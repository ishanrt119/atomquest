import mongoose, { Document, Schema } from "mongoose";

export interface IGoalCycle extends Document {
  cycleYear: number;
  goalSettingStart: Date;
  goalSettingEnd: Date;
  q1Start: Date;
  q1End: Date;
  q2Start: Date;
  q2End: Date;
  q3Start: Date;
  q3End: Date;
  q4Start: Date;
  q4End: Date;
  isActive: boolean;
  adminOverride?: {
    isOverridden: boolean;
    reason?: string;
    overrideEndDate?: Date;
    unlockedEmployeeIds?: mongoose.Types.ObjectId[];
    overriddenPhase?: "GOAL_SETTING" | "Q1" | "Q2" | "Q3" | "Q4";
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalCycleSchema = new Schema<IGoalCycle>(
  {
    cycleYear: { type: Number, required: true, unique: true },
    goalSettingStart: { type: Date, required: true },
    goalSettingEnd: { type: Date, required: true },
    q1Start: { type: Date, required: true },
    q1End: { type: Date, required: true },
    q2Start: { type: Date, required: true },
    q2End: { type: Date, required: true },
    q3Start: { type: Date, required: true },
    q3End: { type: Date, required: true },
    q4Start: { type: Date, required: true },
    q4End: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    adminOverride: {
      isOverridden: { type: Boolean, default: false },
      reason: { type: String },
      overrideEndDate: { type: Date },
      unlockedEmployeeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
      overriddenPhase: { type: String, enum: ["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4"] }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const GoalCycle = mongoose.models.GoalCycle || mongoose.model<IGoalCycle>("GoalCycle", GoalCycleSchema);
