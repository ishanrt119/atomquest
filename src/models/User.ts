import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
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
    password: { type: String, select: false }, // Prevent returning password in queries by default
    role: { 
      type: String, 
      enum: Object.values(USER_ROLES), 
      default: USER_ROLES.EMPLOYEE 
    },
    departmentId: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    designation: { type: String },
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
