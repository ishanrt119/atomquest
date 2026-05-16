import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { currentAchievement, progressPercentage, status } = body;

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id);
    if (!sharedGoal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (sharedGoal.primaryOwnerId.toString() !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Only primary owner can update achievement" }, { status: 403 });
    }

    const oldValues = {
      currentAchievement: sharedGoal.currentAchievement,
      progressPercentage: sharedGoal.progressPercentage,
      status: sharedGoal.status
    };

    sharedGoal.currentAchievement = currentAchievement;
    sharedGoal.progressPercentage = progressPercentage;
    sharedGoal.status = status;
    await sharedGoal.save();

    await createAuditLog({
      entityType: "SharedGoal",
      entityId: sharedGoal._id,
      action: "updated",
      changedBy: session.userId,
      oldValue: oldValues,
      newValue: { currentAchievement, progressPercentage, status },
    });

    // Trigger sync engine
    const host = req.headers.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    // Fire and forget the sync to prevent blocking the UI
    fetch(`${protocol}://${host}/api/shared-goal-sync/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${token}` // Pass token for auth
      }
    }).catch(console.error);

    return NextResponse.json({ success: true, data: sharedGoal });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
