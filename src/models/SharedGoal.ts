import mongoose, { Document, Schema } from "mongoose";

export interface ISharedGoal extends Document {
  title: string;
  description?: string;
  thrustArea?: string;
  targetValue: number;
  assignedEmployees: mongoose.Types.ObjectId[];
  primaryOwnerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SharedGoalSchema = new Schema<ISharedGoal>(
  {
    title: { type: String, required: true },
    description: { type: String },
    thrustArea: { type: String },
    targetValue: { type: Number, required: true },
    assignedEmployees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    primaryOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const SharedGoal = mongoose.models.SharedGoal || mongoose.model<ISharedGoal>("SharedGoal", SharedGoalSchema);
