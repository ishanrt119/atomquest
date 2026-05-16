import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { Goal } from "@/models/Goal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const sharedGoal = await SharedGoal.findById(id);
    if (!sharedGoal) return NextResponse.json({ error: "Shared Goal not found" }, { status: 404 });

    // Only Admin or the Primary Owner can edit target/title
    if (session.role !== "admin" && sharedGoal.primaryOwnerId.toString() !== session.userId && sharedGoal.createdBy.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldTarget = sharedGoal.target;
    
    if (body.title) sharedGoal.title = body.title;
    if (body.target) sharedGoal.target = body.target;
    if (body.description) sharedGoal.description = body.description;
    
    await sharedGoal.save();

    // Cascading update to all linked employee goals
    await Goal.updateMany(
      { sharedGoalId: id },
      { 
        $set: { 
          title: sharedGoal.title, 
          target: sharedGoal.target, 
          description: sharedGoal.description,
          updatedBy: session.userId
        } 
      }
    );

    await createAuditLog({
      entityType: "SharedGoal",
      entityId: sharedGoal._id,
      action: "updated",
      changedBy: session.userId,
      oldValue: { target: oldTarget },
      newValue: { target: sharedGoal.target },
    });

    return NextResponse.json({ success: true, data: sharedGoal }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
