import mongoose, { Document, Schema } from "mongoose";

export interface ITeam extends Document {
  teamName: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId;
  employeeIds: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    teamName: { type: String, required: true, unique: true },
    description: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    employeeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
