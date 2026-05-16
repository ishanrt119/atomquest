import mongoose, { Document, Schema } from "mongoose";

export interface ISharedGoal extends Document {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  measurementDirection: "min" | "max";
  targetValue: number;
  targetDate?: Date;
  status: "not_started" | "on_track" | "completed";
  currentAchievement: number;
  progressPercentage: number;
  assignedEmployees: mongoose.Types.ObjectId[];
  primaryOwnerId: mongoose.Types.ObjectId;
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
      enum: ["not_started", "on_track", "completed"], 
      default: "not_started" 
    },
    currentAchievement: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    assignedEmployees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    primaryOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    linkedGoalIds: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const SharedGoal = mongoose.models.SharedGoal || mongoose.model<ISharedGoal>("SharedGoal", SharedGoalSchema);
