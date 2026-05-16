import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectToDatabase();
    const teams = await Team.find()
      .populate("managerId", "name email designation")
      .populate("employeeIds", "name email designation")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { teamName, description } = body;

    if (!teamName) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    await connectToDatabase();

    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return NextResponse.json({ error: "Team name already exists" }, { status: 400 });
    }

    const team = await Team.create({
      teamName,
      description,
      createdBy: session.userId,
      employeeIds: [],
    });

    await createAuditLog({
      entityType: "Team",
      entityId: team._id,
      action: "created",
      changedBy: session.userId,
      oldValue: null,
      newValue: { teamName },
    });

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
