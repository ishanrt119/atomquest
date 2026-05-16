import mongoose, { Document, Schema } from "mongoose";
import { GOAL_STATUSES, GoalStatus } from "@/constants/database";

export interface IGoal extends Document {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType?: string; // Unit of Measurement
  target?: number;
  weightage: number;
  status: GoalStatus;
  locked: boolean;
  employeeId: mongoose.Types.ObjectId;
  goalSheetId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true },
    description: { type: String },
    thrustArea: { type: String },
    uomType: { type: String },
    target: { type: Number },
    weightage: { 
      type: Number, 
      required: true, 
      min: [10, "Weightage must be at least 10"], 
      max: [100, "Weightage cannot exceed 100"] 
    },
    status: { 
      type: String, 
      enum: Object.values(GOAL_STATUSES), 
      default: GOAL_STATUSES.DRAFT 
    },
    locked: { type: Boolean, default: false },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goalSheetId: { type: Schema.Types.ObjectId, ref: "GoalSheet", required: true, index: true },
  },
  { timestamps: true }
);

export const Goal = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
