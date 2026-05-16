import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { teamId, userId, role } = body;

    if (!teamId || !userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();
    
    const team = await Team.findById(teamId);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (role === "employee") {
      team.employeeIds = team.employeeIds.filter((id: any) => id.toString() !== userId);
      await team.save();

      user.teamId = null;
      user.managerId = null;
      await user.save();
    } else if (role === "manager") {
      team.managerId = null;
      await team.save();

      user.teamId = null;
      await user.save();

      // Clear managerId from all employees in this team
      if (team.employeeIds.length > 0) {
        await User.updateMany(
          { _id: { $in: team.employeeIds } },
          { $unset: { managerId: 1 } }
        );
      }
    }

    await createAuditLog({
      entityType: "TeamAssignment",
      entityId: user._id,
      action: "deleted",
      changedBy: session.userId,
      oldValue: { teamId, role },
      newValue: { teamId: null, role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
