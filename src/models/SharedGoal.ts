import mongoose, { Document, Schema } from "mongoose";

export interface ISharedGoal extends Document {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  measurementDirection: "min" | "max";
  targetValue: number;
  targetDate?: Date;
  status: "not_started" | "at_risk" | "on_track" | "completed" | "exceeded";
  currentAchievement: number;
  rawProgressPercentage: number;
  displayProgressPercentage: number;
  participatingEmployeeIds: mongoose.Types.ObjectId[];
  primaryOwnerId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  assignedByRole: "admin" | "manager";
  linkedGoalIds: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SharedGoalSchema = new Schema<ISharedGoal>(
  {
    title: { type: String, required: true },
    description: { type: String },
    thrustArea: { type: String },
    uomType: {
      type: String,
      enum: ["numeric", "percentage", "timeline", "zero"],
      default: "numeric"
    },
    measurementDirection: {
      type: String,
      enum: ["min", "max"],
      default: "max",
    },
    targetValue: { type: Number, required: true },
    targetDate: { type: Date },
    status: {
      type: String,
      enum: ["not_started", "at_risk", "on_track", "completed", "exceeded"],
      default: "not_started"
    },
    currentAchievement: { type: Number, default: 0 },
    rawProgressPercentage: { type: Number, default: 0 },
    displayProgressPercentage: { type: Number, default: 0 },
    participatingEmployeeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    primaryOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    assignedByRole: { type: String, enum: ["admin", "manager"], required: true, default: "admin" },
    linkedGoalIds: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const SharedGoal = mongoose.models.SharedGoal || mongoose.model<ISharedGoal>("SharedGoal", SharedGoalSchema);
