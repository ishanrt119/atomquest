import mongoose, { Document, Schema } from "mongoose";
import { CHECKIN_STATUSES, CheckInStatus } from "@/constants/database";

export interface ICheckIn extends Document {
  goalId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  quarter: string;
  plannedTarget?: number;
  actualAchievement?: number;
  progressPercentage?: number;
  employeeComment?: string;
  managerComment?: string;
  status: CheckInStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quarter: { type: String, required: true },
    plannedTarget: { type: Number },
    actualAchievement: { type: Number },
    progressPercentage: { type: Number, min: 0, max: 100 },
    employeeComment: { type: String },
    managerComment: { type: String },
    status: { 
      type: String, 
      enum: Object.values(CHECKIN_STATUSES), 
      default: CHECKIN_STATUSES.DRAFT 
    },
  },
  { timestamps: true }
);

export const CheckIn = mongoose.models.CheckIn || mongoose.model<ICheckIn>("CheckIn", CheckInSchema);
