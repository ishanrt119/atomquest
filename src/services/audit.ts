import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

type AuditParams = {
  entityType: "Goal" | "GoalSheet" | "SharedGoal" | "User";
  entityId: mongoose.Types.ObjectId | string;
  action: "created" | "updated" | "deleted" | "status_changed" | "locked" | "unlocked";
  changedBy: mongoose.Types.ObjectId | string;
  oldValue?: any;
  newValue?: any;
};

export async function createAuditLog(params: AuditParams) {
  try {
    await connectToDatabase();
    
    await AuditLog.create({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changedBy: params.changedBy,
      oldValue: params.oldValue,
      newValue: params.newValue,
    });
    
  } catch (error) {
    // We log it but typically don't throw to prevent crashing the main transaction
    console.error("[AuditLog Service] Failed to create audit log:", error);
  }
}
