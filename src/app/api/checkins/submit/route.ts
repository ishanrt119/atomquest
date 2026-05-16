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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { quarter } = body;

    await connectToDatabase();

    // Mark all draft check-ins for this quarter by this employee as submitted
    const checkins = await CheckIn.find({ employeeId: session.userId, quarter, checkinSubmitted: false });
    
    if (checkins.length === 0) {
      return NextResponse.json({ error: "No unsubmitted check-ins found for this quarter." }, { status: 400 });
    }

    const managerId = checkins[0].managerId;

    await CheckIn.updateMany(
      { employeeId: session.userId, quarter, checkinSubmitted: false },
      { $set: { checkinSubmitted: true } }
    );

    await createAuditLog({
      entityType: "CheckIn",
      entityId: session.userId as any,
      action: "updated",
      changedBy: session.userId,
      newValue: { quarter, action: "submit_checkin" }
    });

    if (managerId) {
      await createNotification({
        recipientId: managerId.toString(),
        type: "checkin_submitted",
        title: "Quarterly Check-in Submitted",
        message: `An employee has submitted their ${quarter} check-in.`,
        priority: "medium",
        link: `/manager/reviews?employeeId=${session.userId}&quarter=${quarter}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
