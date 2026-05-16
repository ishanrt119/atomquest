import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { Goal } from "@/models/Goal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id);
    if (!sharedGoal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Sync Engine Logic: Efficient BulkWrite
    const bulkOps = [
      {
        updateMany: {
          filter: { sharedGoalId: sharedGoal._id },
          update: {
            $set: {
              currentAchievement: sharedGoal.currentAchievement,
              progressPercentage: sharedGoal.progressPercentage,
              status: sharedGoal.status,
              syncedAt: new Date(),
            }
          }
        }
      }
    ];

    const result = await Goal.bulkWrite(bulkOps);

    await createAuditLog({
      entityType: "SharedGoal",
      entityId: sharedGoal._id,
      action: "updated",
      changedBy: session.userId,
      newValue: { 
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        achievement: sharedGoal.currentAchievement,
        progress: sharedGoal.progressPercentage
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        syncedGoalsCount: result.modifiedCount,
        achievement: sharedGoal.currentAchievement,
        progress: sharedGoal.progressPercentage
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
