import mongoose, { Document, Schema } from "mongoose";
import { AUDIT_ACTIONS, AuditAction } from "@/constants/database";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: string;
  actionType: AuditAction;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  changedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, required: true },
    actionType: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    fieldChanged: { type: String },
    oldValue: { type: Schema.Types.Mixed }, // Mixed type allows storing flexible object states
    newValue: { type: Schema.Types.Mixed },
    reason: { type: String },
    changedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { 
    timestamps: true 
  }
);

// Immutable - Audit logs should generally not be modified after creation
AuditLogSchema.pre('save', async function() {
  if (!this.isNew) {
    throw new Error('Audit logs cannot be modified');
  }
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
