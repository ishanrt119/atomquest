import mongoose, { Document, Schema } from "mongoose";

export interface IGoalSheet extends Document {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  quarter: string; // e.g., 'Q1', 'Q2'
  status: "draft" | "submitted" | "approved" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const GoalSheetSchema = new Schema<IGoalSheet>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    year: { type: Number, required: true },
    quarter: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["draft", "submitted", "approved", "closed"], 
      default: "draft" 
    },
  },
  { timestamps: true }
);

// Compound index to ensure an employee has only one goal sheet per quarter/year combination
GoalSheetSchema.index({ employeeId: 1, year: 1, quarter: 1 }, { unique: true });

export const GoalSheet = mongoose.models.GoalSheet || mongoose.model<IGoalSheet>("GoalSheet", GoalSheetSchema);
