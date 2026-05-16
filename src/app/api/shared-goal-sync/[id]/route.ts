import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { verifyJWT } from "@/lib/auth";
import { syncSharedGoal } from "@/services/sync/sharedGoalSyncService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id).lean();
    if (!sharedGoal)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const {
      primaryGoalId,
      currentAchievement,
      achievementDate,
      rawProgressPercentage,
      displayProgressPercentage,
      progressStatusLabel,
      status,
      quarter,
    } = body;

    const result = await syncSharedGoal(
      id,
      primaryGoalId,
      currentAchievement !== null ? currentAchievement : undefined,
      achievementDate !== null ? achievementDate : undefined,
      rawProgressPercentage ?? sharedGoal.rawProgressPercentage ?? 0,
      displayProgressPercentage ?? sharedGoal.displayProgressPercentage ?? 0,
      progressStatusLabel ?? sharedGoal.progressStatusLabel ?? "Not Started",
      status ?? sharedGoal.status ?? "not_started",
      quarter,
      session.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[Shared Goal Sync API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
