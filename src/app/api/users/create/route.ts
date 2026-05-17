import { NextResponse } from "next/server";
import { createUserOnboarding } from "@/services/onboarding/onboardingService";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Only Admins can onboard users." }, { status: 403 });
    }

    const { name, email, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const newUser = await createUserOnboarding(name, email, role, session.id);

    return NextResponse.json({ success: true, userId: newUser._id });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
  }
}
