import mongoose, { Document, Schema } from "mongoose";

export interface ICheckIn extends Document {
  goalId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  quarter: string;
  plannedTargetValue?: number;
  plannedTargetDate?: Date;
  actualAchievementValue?: number;
  actualAchievementDate?: Date;
  rawProgressPercentage?: number;
  displayProgressPercentage?: number;
  progressScore?: number;
  status: "not_started" | "at_risk" | "on_track" | "completed" | "exceeded";
  employeeComment?: string;
  managerComment?: string;
  checkinSubmitted: boolean;
  managerReviewed: boolean;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quarter: { type: String, required: true },
    plannedTargetValue: { type: Number },
    plannedTargetDate: { type: Date },
    actualAchievementValue: { type: Number },
    actualAchievementDate: { type: Date },
    rawProgressPercentage: { type: Number, min: 0, default: 0 },
    displayProgressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    progressScore: { type: Number },
    employeeComment: { type: String },
    managerComment: { type: String },
    status: {
      type: String,
      enum: ["not_started", "at_risk", "on_track", "completed", "exceeded"],
      default: "not_started"
    },
    checkinSubmitted: { type: Boolean, default: false },
    managerReviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const CheckIn = mongoose.models.CheckIn || mongoose.model<ICheckIn>("CheckIn", CheckInSchema);
