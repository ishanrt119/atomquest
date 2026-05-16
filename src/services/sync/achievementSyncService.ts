import { Goal } from "@/models/Goal";
import { CheckIn } from "@/models/CheckIn";
import { SharedGoal } from "@/models/SharedGoal";
import { createAuditLog } from "@/services/audit";
import {
  calculateProgress,
  deriveStatusFromProgress,
  ProgressResult,
} from "./progressCalculationService";
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
 *
 * Flow:
 *   1. Fetch Goal → get targets & UoM config
 *   2. Calculate progress via centralized service
 *   3. Persist to Goal document
 *   4. Persist to CheckIn document (upsert)
 *   5. If shared goal + primary owner → sync to SharedGoal + linked employees
 *   6. Audit log
 *   7. Return standardized response
 */
export async function updateAchievement(payload: UpdateAchievementPayload) {
  const {
    checkinId,
    goalId,
    employeeId,
    actualAchievementValue,
    actualAchievementDate,
    employeeComment,
    quarter,
  } = payload;

  // ── 1. Fetch Goal ──────────────────────────────────────────────────────────
  const goal = await Goal.findOne({ _id: goalId, employeeId }).lean();
  if (!goal) {
    throw new Error("Goal not found or unauthorized");
  }

  // ── 2. Calculate Progress ──────────────────────────────────────────────────
  const progressResult: ProgressResult = calculateProgress(
    goal.uomType,
    goal.measurementDirection,
    goal.targetValue,
    actualAchievementValue,
    goal.targetDate,
    actualAchievementDate
  );

  const { rawProgressPercentage, displayProgressPercentage, progressStatusLabel } =
    progressResult;

  const status = deriveStatusFromProgress(rawProgressPercentage);

  // ── 3. Update the Master Goal Document ─────────────────────────────────────
  const goalUpdate: Record<string, unknown> = {
    status,
    rawProgressPercentage,
    displayProgressPercentage,
    progressStatusLabel,
  };
  if (actualAchievementValue !== undefined && actualAchievementValue !== null) {
    goalUpdate.currentAchievement = Number(actualAchievementValue);
  }

  const updatedGoal = await Goal.findByIdAndUpdate(
    goalId,
    { $set: goalUpdate },
    { new: true }
  ).lean();

  // ── 4. Upsert Active Quarter CheckIn ───────────────────────────────────────
  const checkinFields = {
    actualAchievementValue:
      actualAchievementValue !== undefined
        ? Number(actualAchievementValue)
        : undefined,
    actualAchievementDate: actualAchievementDate || undefined,
    rawProgressPercentage,
    displayProgressPercentage,
    progressStatusLabel,
    status,
    employeeComment,
  };

  let checkin;
  if (checkinId && !checkinId.startsWith("virtual_")) {
    checkin = await CheckIn.findByIdAndUpdate(
      checkinId,
      { $set: checkinFields },
      { new: true }
    ).lean();
  } else {
    // Generate real CheckIn from virtual draft
    checkin = await CheckIn.findOneAndUpdate(
      { goalId, employeeId, quarter },
      {
        $set: checkinFields,
        $setOnInsert: {
          managerId: goal.createdBy,
          plannedTargetValue: goal.targetValue,
          plannedTargetDate: goal.targetDate,
          checkinSubmitted: false,
          managerReviewed: false,
        },
      },
      { upsert: true, new: true }
    ).lean();
  }

  // ── 5. Shared Goal Synchronization ─────────────────────────────────────────
  if (updatedGoal?.isSharedGoal && updatedGoal?.isPrimaryOwner && updatedGoal?.sharedGoalId) {
    // Update the master SharedGoal record
    const sharedUpdate: Record<string, unknown> = {
      status,
      rawProgressPercentage,
      displayProgressPercentage,
      progressStatusLabel,
    };
    if (actualAchievementValue !== undefined && actualAchievementValue !== null) {
      sharedUpdate.currentAchievement = Number(actualAchievementValue);
    }
    await SharedGoal.findByIdAndUpdate(updatedGoal.sharedGoalId, {
      $set: sharedUpdate,
    });

    // Trigger Fan-Out Sync to linked employees
    await syncSharedGoal(
      updatedGoal.sharedGoalId.toString(),
      updatedGoal._id.toString(),
      actualAchievementValue !== null ? actualAchievementValue : undefined,
      actualAchievementDate !== null ? actualAchievementDate : undefined,
      rawProgressPercentage,
      displayProgressPercentage,
      progressStatusLabel,
      status,
      quarter,
      employeeId
    );
  }

  // ── 6. Audit Log ───────────────────────────────────────────────────────────
  await createAuditLog({
    entityType: "CheckIn",
    entityId: checkin?._id as any,
    action: "updated",
    changedBy: employeeId,
    newValue: {
      actualAchievementValue,
      rawProgressPercentage,
      displayProgressPercentage,
      progressStatusLabel,
      status,
      quarter,
    },
  });

  // ── 7. Return Standardized Response ────────────────────────────────────────
  return {
    checkin,
    goal: updatedGoal,
    rawProgressPercentage,
    displayProgressPercentage,
    progressStatusLabel,
    status,
  };
}
