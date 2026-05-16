import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { GoalSheet } from "@/models/GoalSheet";
import { User } from "@/models/User";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { teamName, description } = body;
    const { id } = await params;

    await connectToDatabase();
    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const oldValues = { teamName: team.teamName, description: team.description };
    if (teamName) team.teamName = teamName;
    if (description !== undefined) team.description = description;
    
    await team.save();

    await createAuditLog({
      entityType: "Team",
      entityId: team._id,
      action: "updated",
      changedBy: session.userId,
      oldValue: oldValues,
      newValue: { teamName: team.teamName, description: team.description },
    });

    return NextResponse.json({ success: true, data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await connectToDatabase();

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Check if team members have active goal sheets
    const memberIds = [...team.employeeIds];
    if (team.managerId) memberIds.push(team.managerId);

    if (memberIds.length > 0) {
      const activeSheets = await GoalSheet.find({ 
        employeeId: { $in: memberIds },
        status: { $in: ["submitted", "approved", "in_progress"] } 
      });
      if (activeSheets.length > 0) {
        return NextResponse.json({ error: "Cannot delete team with active goal sheets. Reassign members first." }, { status: 400 });
      }
    }

    // Unassign users from this team
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $unset: { teamId: 1, managerId: 1 } }
    );

    await Team.findByIdAndDelete(id);

    await createAuditLog({
      entityType: "Team",
      entityId: id,
      action: "deleted",
      changedBy: session.userId,
      oldValue: { teamName: team.teamName },
      newValue: null,
    });

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
