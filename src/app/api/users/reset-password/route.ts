import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/session";
import { createAuditLog } from "@/services/audit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Set the new password, Mongoose schema pre-save hook will hash it
    user.password = newPassword;
    user.passwordResetRequired = false;
    user.onboardingStatus = "active";
    await user.save();

    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      actionType: "UPDATED",
      entityType: "User",
      entityId: user._id,
      fieldChanged: "password",
      reason: "User completed first-login password reset"
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    console.error("Password Reset Error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
