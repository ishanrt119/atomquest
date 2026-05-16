import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CheckIn } from "@/models/CheckIn";
import { verifyJWT } from "@/lib/auth";

/**
 * GET /api/checkins/[id]
 * Returns a single check-in by ID.
 * Employees can only access their own. Managers/Admins can access their team's.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const checkin = await CheckIn.findById(id)
      .populate("goalId", "title description thrustArea uomType measurementDirection targetValue targetDate weightage isSharedGoal isPrimaryOwner")
      .populate("employeeId", "name email designation")
      .lean();

    if (!checkin) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // RBAC: employees can only see their own check-ins
    if (session.role === "employee" && (checkin as any).employeeId._id.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: checkin });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/checkins/[id]
 * Allows managers to update the manager comment / reviewed status on a specific check-in.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role === "employee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { managerComment, managerReviewed } = body;

    await connectToDatabase();

    const update: any = {};
    if (managerComment !== undefined) update.managerComment = managerComment;
    if (managerReviewed !== undefined) {
      update.managerReviewed = managerReviewed;
      if (managerReviewed) update.reviewedAt = new Date();
    }

    const checkin = await CheckIn.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("goalId", "title")
      .populate("employeeId", "name email")
      .lean();

    if (!checkin) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: checkin });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
