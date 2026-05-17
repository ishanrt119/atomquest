import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendOnboardingEmail } from "@/services/mail/mailService";
import { createAuditLog } from "@/services/audit";
import mongoose from "mongoose";
import { UserRole } from "@/constants/database";

export const createUserOnboarding = async (
  name: string,
  email: string,
  role: UserRole,
  adminId: string
) => {
  await connectToDatabase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const defaultPassword = "password123";

  const newUser = new User({
    name,
    email,
    password: defaultPassword,
    role,
    onboardingStatus: "invited",
    invitedBy: new mongoose.Types.ObjectId(adminId),
    invitedAt: new Date(),
    passwordResetRequired: true,
    isActive: true,
  });

  await newUser.save();

  // Audit Logging
  await createAuditLog({
    userId: adminId,
    userRole: "admin",
    actionType: "CREATED",
    entityType: "User",
    entityId: newUser._id,
    newValue: { email, role, onboardingStatus: "invited" },
    reason: `Onboarded new ${role}`
  });

  // Send Email in background (non-blocking) or foreground. For immediate feedback, we await it.
  await sendOnboardingEmail(name, email, defaultPassword);

  return newUser;
};

export const resendUserInvitation = async (userId: string, adminId: string) => {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  if (user.onboardingStatus !== "invited" && user.passwordResetRequired === false) {
    throw new Error("User is already fully active and onboarded.");
  }

  // We keep the old password but just notify them of it.
  // Realistically we should probably reset to default if they lost it.
  const tempPassword = "password123"; 
  user.password = tempPassword; // This will trigger pre-save hash
  user.passwordResetRequired = true;
  user.onboardingStatus = "invited";
  user.invitedAt = new Date();
  await user.save();

  await createAuditLog({
    userId: adminId,
    userRole: "admin",
    actionType: "UPDATED",
    entityType: "User",
    entityId: user._id,
    fieldChanged: "invitation",
    reason: `Resent onboarding invitation`
  });

  await sendOnboardingEmail(user.name, user.email, tempPassword);

  return user;
};

export const disableUserAccount = async (userId: string, adminId: string) => {
  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  user.isActive = false;
  user.onboardingStatus = "disabled";
  await user.save();

  await createAuditLog({
    userId: adminId,
    userRole: "admin",
    actionType: "UPDATED",
    entityType: "User",
    entityId: user._id,
    fieldChanged: "isActive",
    newValue: false,
    reason: "Disabled user account"
  });

  return user;
};

export const activateUserAccount = async (userId: string, adminId: string) => {
  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  user.isActive = true;
  user.onboardingStatus = user.passwordResetRequired ? "invited" : "active";
  await user.save();

  await createAuditLog({
    userId: adminId,
    userRole: "admin",
    actionType: "UPDATED",
    entityType: "User",
    entityId: user._id,
    fieldChanged: "isActive",
    newValue: true,
    reason: "Activated user account"
  });

  return user;
};
