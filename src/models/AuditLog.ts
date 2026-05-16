import mongoose, { Document, Schema } from "mongoose";
import { AUDIT_ACTIONS, AuditAction } from "@/constants/database";

export interface IAuditLog extends Document {
  entityType: string; // e.g., 'Goal', 'User', 'GoalSheet'
  entityId: mongoose.Types.ObjectId;
  action: AuditAction;
  changedBy: mongoose.Types.ObjectId;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oldValue: { type: Schema.Types.Mixed }, // Mixed type allows storing flexible object states
    newValue: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { 
    // Audit logs shouldn't technically need full timestamps as timestamp field is enough,
    // but Mongoose timestamps will automatically maintain createdAt and updatedAt.
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
