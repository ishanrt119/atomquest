import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { updateAchievement } from "@/services/sync/achievementSyncService";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyJWT(token);
    if (!session || session.role !== "employee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      checkinId, goalId, 
      actualAchievementValue, actualAchievementDate, 
      employeeComment, quarter 
    } = body;

    await connectToDatabase();

    const result = await updateAchievement({
      checkinId,
      goalId,
      employeeId: session.userId,
      actualAchievementValue,
      actualAchievementDate,
      employeeComment,
      quarter
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Update Achievement API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

