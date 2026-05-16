import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";
import {
  calculateProgress,
  deriveStatusFromProgress,
} from "@/services/sync/progressCalculationService";

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
    const { currentAchievement, status: clientStatus } = body;

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id);
    if (!sharedGoal)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (
      sharedGoal.primaryOwnerId.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only primary owner can update achievement" },
        { status: 403 }
      );
    }

    // Server-side progress calculation (single source of truth)
    const progress = calculateProgress(
      sharedGoal.uomType,
      sharedGoal.measurementDirection,
      sharedGoal.targetValue,
      currentAchievement,
      sharedGoal.targetDate,
      null
    );

    const status =
      clientStatus || deriveStatusFromProgress(progress.rawProgressPercentage);

    const oldValues = {
      currentAchievement: sharedGoal.currentAchievement,
      rawProgressPercentage: sharedGoal.rawProgressPercentage,
      displayProgressPercentage: sharedGoal.displayProgressPercentage,
      progressStatusLabel: sharedGoal.progressStatusLabel,
      status: sharedGoal.status,
    };

    // Persist standardized fields
    sharedGoal.currentAchievement = currentAchievement;
    sharedGoal.rawProgressPercentage = progress.rawProgressPercentage;
    sharedGoal.displayProgressPercentage = progress.displayProgressPercentage;
    sharedGoal.progressStatusLabel = progress.progressStatusLabel;
    sharedGoal.status = status;
    await sharedGoal.save();

    await createAuditLog({
      entityType: "SharedGoal",
      entityId: sharedGoal._id,
      action: "updated",
      changedBy: session.userId,
      oldValue: oldValues,
      newValue: {
        currentAchievement,
        rawProgressPercentage: progress.rawProgressPercentage,
        displayProgressPercentage: progress.displayProgressPercentage,
        progressStatusLabel: progress.progressStatusLabel,
        status,
      },
    });

    // Trigger sync engine
    const host = req.headers.get("host");
    const protocol =
      process.env.NODE_ENV === "development" ? "http" : "https";

    fetch(`${protocol}://${host}/api/shared-goal-sync/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${token}`,
      },
      body: JSON.stringify({
        primaryGoalId: sharedGoal.primaryOwnerId,
        currentAchievement,
        rawProgressPercentage: progress.rawProgressPercentage,
        displayProgressPercentage: progress.displayProgressPercentage,
        progressStatusLabel: progress.progressStatusLabel,
        status,
        quarter: body.quarter || "Q1",
      }),
    }).catch(console.error);

    return NextResponse.json({ success: true, data: sharedGoal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
