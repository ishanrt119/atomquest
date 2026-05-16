import mongoose, { Document, Schema } from "mongoose";
import { USER_ROLES, UserRole } from "@/constants/database";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  departmentId?: string;
  managerId?: mongoose.Types.ObjectId;
  designation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      index: true
    },
    password: { type: String, select: false }, // Usually not returned in queries by default
    role: { 
      type: String, 
      enum: Object.values(USER_ROLES), 
      default: USER_ROLES.EMPLOYEE 
    },
    departmentId: { type: String }, // Can be transformed to ObjectId if a Department model is created later
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    designation: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
