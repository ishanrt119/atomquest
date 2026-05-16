import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { verifyJWT } from "@/lib/auth";

// Helper to extract session without requiring cookies() import in every route manually
async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const query: any = {};
    
    // If employee, they can only see their own sheets
    if (session.role === "employee") {
      query.employeeId = session.userId;
    } else if (employeeId) {
      // Manager/Admin can query specific employee
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    // Default sorting to latest
    const sheets = await GoalSheet.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: sheets }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { year, quarter } = body;

    if (!year || !quarter) {
      return NextResponse.json({ error: "Year and quarter are required." }, { status: 400 });
    }

    await connectToDatabase();

    // Check if one already exists
    const existing = await GoalSheet.findOne({ employeeId: session.userId, year, quarter });
    if (existing) {
      return NextResponse.json({ error: "Goal sheet for this period already exists.", data: existing }, { status: 400 });
    }

    const newSheet = await GoalSheet.create({
      employeeId: session.userId,
      year,
      quarter,
      status: "draft",
      locked: false,
      totalWeightage: 0,
    });

    return NextResponse.json({ success: true, data: newSheet }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
