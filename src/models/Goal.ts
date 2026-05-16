import mongoose, { Document, Schema } from "mongoose";

export interface IGoal extends Document {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  measurementDirection: "min" | "max";
  targetValue?: number;
  targetDate?: Date;
  weightage: number;
  status: "not_started" | "on_track" | "completed";
  locked: boolean;
  employeeId: mongoose.Types.ObjectId;
  goalSheetId: mongoose.Types.ObjectId;
  isSharedGoal: boolean;
  sharedGoalId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
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
      required: true,
      default: "max",
    },
    targetValue: {
      type: Number,
      required: function(this: any) {
        return this.uomType !== "timeline";
      },
    },
    targetDate: {
      type: Date,
      required: function(this: any) {
        return this.uomType === "timeline";
      },
    },
    weightage: { 
      type: Number, 
      required: true, 
      min: [10, "Weightage must be at least 10"], 
      max: [100, "Weightage cannot exceed 100"] 
    },
    status: { 
      type: String, 
      enum: ["not_started", "on_track", "completed"], 
      default: "not_started" 
    },
    locked: { type: Boolean, default: false },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goalSheetId: { type: Schema.Types.ObjectId, ref: "GoalSheet", required: true, index: true },
    isSharedGoal: { type: Boolean, default: false },
    sharedGoalId: { type: Schema.Types.ObjectId, ref: "SharedGoal" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Goal = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
