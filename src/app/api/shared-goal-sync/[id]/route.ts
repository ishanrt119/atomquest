import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { Goal } from "@/models/Goal";
import { verifyJWT } from "@/lib/auth";
import { syncSharedGoal } from "@/services/sync/sharedGoalSyncService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id).lean();
    if (!sharedGoal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // The body should contain the primary goal id and active quarter from the client/trigger
    const {
      primaryGoalId,
      currentAchievement,
      achievementDate,
      rawProgressPercentage,
      displayProgressPercentage,
      status,
      quarter
    } = body;

    // Wait for the sync engine
    const result = await syncSharedGoal(
      id,
      primaryGoalId,
      currentAchievement !== null ? currentAchievement : undefined,
      achievementDate !== null ? achievementDate : undefined,
      rawProgressPercentage ?? sharedGoal.rawProgressPercentage,
      displayProgressPercentage ?? sharedGoal.displayProgressPercentage,
      status ?? sharedGoal.status,
      quarter,
      session.userId
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("[Shared Goal Sync API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

