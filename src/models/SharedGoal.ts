import mongoose, { Document, Schema } from "mongoose";

export interface ISharedGoal extends Document {
  primaryGoalId: mongoose.Types.ObjectId;
  sharedWithEmployeeId: mongoose.Types.ObjectId;
  contributionPercentage?: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const SharedGoalSchema = new Schema<ISharedGoal>(
  {
    primaryGoalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true, index: true },
    sharedWithEmployeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contributionPercentage: { type: Number, min: 0, max: 100 },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

export const SharedGoal = mongoose.models.SharedGoal || mongoose.model<ISharedGoal>("SharedGoal", SharedGoalSchema);
