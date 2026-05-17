import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("onboardingStatus");
    const search = searchParams.get("search");

    const query: any = {};
    if (role) query.role = role;
    if (status) query.onboardingStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("teamId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: users });
  } catch (error: any) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Common route for toggling disable/activate
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { userId, action } = await request.json();
    
    // We import here to avoid circular dependencies if any
    const { disableUserAccount, activateUserAccount } = await import("@/services/onboarding/onboardingService");

    if (action === "disable") {
      await disableUserAccount(userId, session.id);
    } else if (action === "activate") {
      await activateUserAccount(userId, session.id);
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Toggle User Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
