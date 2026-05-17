import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES, UserRole } from "@/constants/database";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  departmentId?: string;
  teamId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  designation?: string;
  onboardingStatus: "invited" | "active" | "disabled";
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  lastLogin?: Date;
  passwordResetRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    password: { type: String, select: false },
    role: { 
      type: String, 
      enum: Object.values(USER_ROLES), 
      default: USER_ROLES.EMPLOYEE 
    },
    departmentId: { type: String },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    designation: { type: String },
    onboardingStatus: {
      type: String,
      enum: ["invited", "active", "disabled"],
      default: "active"
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
    lastLogin: { type: Date },
    passwordResetRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
