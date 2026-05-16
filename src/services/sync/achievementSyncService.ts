import { Goal } from "@/models/Goal";
import { CheckIn } from "@/models/CheckIn";
import { SharedGoal } from "@/models/SharedGoal";
import { createAuditLog } from "@/services/audit";
import { calculateProgress, deriveStatusFromProgress } from "./progressCalculationService";
import { syncSharedGoal } from "./sharedGoalSyncService";

export interface UpdateAchievementPayload {
  checkinId?: string;
  goalId: string;
  employeeId: string;
  actualAchievementValue?: number | null;
  actualAchievementDate?: string | null;
  employeeComment?: string;
  quarter: string;
}

/**
 * Achievement Sync Engine
 * 
 * The single source-controlled pipeline for updating goal achievements.
 * Handles progress calculations, atomic cross-collection updates (Goal & CheckIn),
 * and triggers Shared Goal fan-out synchronization.
 */
export async function updateAchievement(payload: UpdateAchievementPayload) {
  const {
    checkinId, goalId, employeeId,
    actualAchievementValue, actualAchievementDate,
    employeeComment, quarter
  } = payload;

  // 1. Fetch Goal to determine constraints & targets
  const goal = await Goal.findOne({ _id: goalId, employeeId }).lean();
  if (!goal) {
    throw new Error("Goal not found or unauthorized");
  }

  const { rawProgressPercentage, displayProgressPercentage } = calculateProgress(
    goal.uomType,
    goal.measurementDirection,
    goal.targetValue,
    actualAchievementValue,
    goal.targetDate,
    actualAchievementDate
  );

  const status = deriveStatusFromProgress(rawProgressPercentage);

  // 3. Update the Master Goal Document
  const goalUpdate: any = { status, rawProgressPercentage, displayProgressPercentage };
  if (actualAchievementValue !== undefined && actualAchievementValue !== null) {
    goalUpdate.currentAchievement = Number(actualAchievementValue);
  }

  const updatedGoal = await Goal.findByIdAndUpdate(
    goalId,
    { $set: goalUpdate },
    { new: true }
  ).lean();

  // 4. Create/Update Active Quarter CheckIn Document (Source of Truth for Dashboard)
  let checkin;
  if (checkinId && !checkinId.startsWith("virtual_")) {
    checkin = await CheckIn.findByIdAndUpdate(
      checkinId,
      {
        $set: {
          actualAchievementValue: actualAchievementValue !== undefined ? Number(actualAchievementValue) : undefined,
          actualAchievementDate: actualAchievementDate || undefined,
          rawProgressPercentage,
          displayProgressPercentage,
          status,
          employeeComment,
        }
      },
      { new: true }
    ).lean();
  } else {
    // Generate real CheckIn from virtual draft
    checkin = await CheckIn.findOneAndUpdate(
      { goalId, employeeId, quarter },
      {
        $set: {
          actualAchievementValue: actualAchievementValue !== undefined ? Number(actualAchievementValue) : undefined,
          actualAchievementDate: actualAchievementDate || undefined,
          rawProgressPercentage,
          displayProgressPercentage,
          status,
          employeeComment,
        },
        $setOnInsert: {
          managerId: goal.createdBy,
          plannedTargetValue: goal.targetValue,
          plannedTargetDate: goal.targetDate,
          checkinSubmitted: false,
          managerReviewed: false,
        }
      },
      { upsert: true, new: true }
    ).lean();
  }

  // 5. Shared Goal Synchronization Pipeline
  if (updatedGoal.isSharedGoal && updatedGoal.isPrimaryOwner && updatedGoal.sharedGoalId) {
    // Update the master SharedGoal record
    const sharedUpdate: any = { status, rawProgressPercentage, displayProgressPercentage };
    if (actualAchievementValue !== undefined && actualAchievementValue !== null) {
      sharedUpdate.currentAchievement = Number(actualAchievementValue);
    }
    await SharedGoal.findByIdAndUpdate(updatedGoal.sharedGoalId, { $set: sharedUpdate });

    // Trigger Fan-Out Sync to linked employees
    await syncSharedGoal(
      updatedGoal.sharedGoalId.toString(),
      updatedGoal._id.toString(),
      actualAchievementValue !== null ? actualAchievementValue : undefined,
      actualAchievementDate !== null ? actualAchievementDate : undefined,
      rawProgressPercentage,
      displayProgressPercentage,
      status,
      quarter,
      employeeId
    );
  }

  // 6. Create Audit Log
  await createAuditLog({
    entityType: "CheckIn",
    entityId: checkin._id as any,
    action: "updated",
    changedBy: employeeId,
    newValue: { actualAchievementValue, rawProgressPercentage, displayProgressPercentage, status, quarter },
  });

  return {
    checkin,
    goal: updatedGoal,
    rawProgressPercentage,
    displayProgressPercentage,
    status
  };
}
