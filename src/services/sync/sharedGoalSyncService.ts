import { Goal } from "@/models/Goal";
import { CheckIn } from "@/models/CheckIn";
import { createAuditLog } from "@/services/audit";

/**
 * Shared Goal Sync Service
 * 
 * Synchronizes the progress of a Primary Owner's goal to all linked participating
 * employee goals and their active Check-Ins. Uses MongoDB bulkWrite for performance.
 */
export async function syncSharedGoal(
  sharedGoalId: string,
  primaryGoalId: string,
  updatedAchievementValue: number | undefined,
  updatedAchievementDate: string | undefined,
  rawProgressPercentage: number,
  displayProgressPercentage: number,
  status: string,
  quarter: string,
  triggeringUserId: string
) {
  try {
    // 1. Find all linked goals EXCEPT the primary owner's
    const linkedGoals = await Goal.find({
      sharedGoalId: sharedGoalId,
      _id: { $ne: primaryGoalId }
    }).lean();

    if (!linkedGoals.length) {
      return { success: true, message: "No linked goals found to sync." };
    }

    // Prepare Bulk Operations for Goal Collection
    const goalBulkOps = linkedGoals.map(goal => {
      const updateSet: any = {
        status,
        rawProgressPercentage,
        displayProgressPercentage,
        syncedAt: new Date()
      };
      if (updatedAchievementValue !== undefined) updateSet.currentAchievement = updatedAchievementValue;

      return {
        updateOne: {
          filter: { _id: goal._id },
          update: { $set: updateSet }
        }
      };
    });

    // Prepare Bulk Operations for CheckIn Collection
    const checkinBulkOps = linkedGoals.map(goal => {
      const updateSet: any = {
        rawProgressPercentage,
        displayProgressPercentage,
        status
      };
      if (updatedAchievementValue !== undefined) updateSet.actualAchievementValue = updatedAchievementValue;
      if (updatedAchievementDate !== undefined) updateSet.actualAchievementDate = updatedAchievementDate;

      return {
        updateOne: {
          // Sync based on active quarter, goal, and the employee
          filter: { goalId: goal._id, quarter: quarter, employeeId: goal.employeeId },
          update: {
            $set: updateSet,
            $setOnInsert: {
              managerId: goal.createdBy,
              plannedTargetValue: goal.targetValue,
              plannedTargetDate: goal.targetDate,
              checkinSubmitted: false,
              managerReviewed: false,
            }
          },
          upsert: true
        }
      };
    });

    // Execute batch writes in parallel
    await Promise.all([
      Goal.bulkWrite(goalBulkOps),
      CheckIn.bulkWrite(checkinBulkOps)
    ]);

    // Optional: Log bulk sync activity
    await createAuditLog({
      entityType: "SharedGoal",
      entityId: sharedGoalId as any,
      action: "updated",
      changedBy: triggeringUserId,
      newValue: { rawProgressPercentage, displayProgressPercentage, quarter, syncedGoalCount: linkedGoals.length },
    });

    return { success: true, syncedCount: linkedGoals.length };
  } catch (error) {
    console.error("[SharedGoalSyncService] Error synchronizing shared goals:", error);
    throw error;
  }
}
