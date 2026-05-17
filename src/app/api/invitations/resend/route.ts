import { NextResponse } from "next/server";
import { resendUserInvitation } from "@/services/onboarding/onboardingService";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    await resendUserInvitation(userId, session.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Resend Invitation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
