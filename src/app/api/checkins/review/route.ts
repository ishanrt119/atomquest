import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CheckIn } from "@/models/CheckIn";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";
import { createNotification } from "@/services/notification";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role === "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { employeeId, quarter, reviews } = body; 
    // reviews = [{ checkInId, managerComment }]

    await connectToDatabase();

    const bulkOps = reviews.map((r: any) => ({
      updateOne: {
        filter: { _id: r.checkInId, employeeId, quarter, checkinSubmitted: true },
        update: {
          $set: {
            managerComment: r.managerComment,
            managerReviewed: true,
            reviewedAt: new Date(),
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await CheckIn.bulkWrite(bulkOps);
    }

    await createAuditLog({
      entityType: "CheckIn",
      entityId: employeeId,
      action: "updated",
      changedBy: session.userId,
      newValue: { quarter, action: "manager_reviewed" }
    });

    await createNotification({
      recipientId: employeeId,
      type: "goal_approved", // generic type
      title: "Quarterly Check-in Reviewed",
      message: `Your manager has reviewed and commented on your ${quarter} check-in.`,
      priority: "medium",
      link: `/employee/check-ins`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
