import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CheckIn } from "@/models/CheckIn";
import { Team } from "@/models/Team";
import { verifyJWT } from "@/lib/auth";
import { getFinancialQuarter } from "@/lib/utils";

/**
 * GET /api/manager/team-checkins
 *
 * Returns the latest CheckIn records for all employees in the manager's team
 * for the current (or specified) financial quarter.
 * This is the source of truth for the Manager Dashboard and Check-ins page.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session || session.role === "employee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const quarter = searchParams.get("quarter") || getFinancialQuarter();

    await connectToDatabase();

    // 1. Find team managed by this manager
    const team = await Team.findOne({ managerId: session.userId })
      .populate("employeeIds", "name email designation")
      .lean();

    if (!team) {
      return NextResponse.json({ success: true, data: { team: null, members: [], checkins: [] } });
    }

    const employeeIds = (team.employeeIds as any[]).map((e: any) => e._id);

    if (employeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          team: { _id: team._id.toString(), teamName: team.teamName },
          members: [],
          checkins: [],
        },
      });
    }

    // 2. Fetch all check-ins for team employees in the current quarter
    const checkinsRaw = await CheckIn.find({
      employeeId: { $in: employeeIds },
      quarter,
    })
      .populate("goalId", "title description thrustArea uomType measurementDirection targetValue targetDate weightage isSharedGoal isPrimaryOwner")
      .populate("employeeId", "name email designation")
      .sort({ updatedAt: -1 })
      .lean();

    // 3. Serialize
    const checkins = checkinsRaw.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
      goalId: c.goalId
        ? { ...c.goalId, _id: c.goalId._id.toString() }
        : null,
      employeeId: c.employeeId
        ? { ...c.employeeId, _id: c.employeeId._id.toString() }
        : null,
      managerId: c.managerId?.toString(),
    }));

    const members = (team.employeeIds as any[]).map((e: any) => ({
      _id: e._id.toString(),
      name: e.name,
      email: e.email,
      designation: e.designation || "Team Member",
    }));

    return NextResponse.json({
      success: true,
      data: {
        team: { _id: team._id.toString(), teamName: team.teamName },
        members,
        checkins,
        quarter,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
