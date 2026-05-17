import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditAction } from "@/constants/database";

export type AuditParams = {
  userId: mongoose.Types.ObjectId | string;
  userRole: string;
  actionType: AuditAction;
  entityType: string;
  entityId: mongoose.Types.ObjectId | string;
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(params: AuditParams) {
  try {
    await connectToDatabase();
    
    await AuditLog.create({
      userId: params.userId,
      userRole: params.userRole,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
    
  } catch (error) {
    console.error("[AuditLog Service] Failed to create audit log:", error);
  }
}
