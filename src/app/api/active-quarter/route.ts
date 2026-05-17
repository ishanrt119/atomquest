import { NextResponse } from "next/server";
import { getActiveCycleStatus } from "@/services/cycle/activeQuarterService";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employeeId from query params to check for specific unlocks if passed
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") || session.id;

    const status = await getActiveCycleStatus(employeeId);
    
    return NextResponse.json({
      activeQuarter: status.activePhase,
      allowedActions: status.allowedActions,
      cycleStatus: status.activePhase !== "LOCKED" && status.activePhase !== "NOT_STARTED" ? "ACTIVE" : "INACTIVE",
      nextWindow: status.currentWindowEnd,
      adminOverrideActive: status.adminOverrideActive,
      cycleYear: status.cycleYear,
      cycleId: status.cycleId
    });
  } catch (error) {
    console.error("Error fetching active quarter:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
