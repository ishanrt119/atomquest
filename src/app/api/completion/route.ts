import { NextResponse } from "next/server";
import { getCompletionAnalytics } from "@/services/completion/completionService";
import { getCurrentUser } from "@/lib/session";
import { getActiveCycleStatus } from "@/services/cycle/activeQuarterService";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let quarter = searchParams.get("quarter");

    // If no quarter provided, find the active one
    if (!quarter) {
      const status = await getActiveCycleStatus();
      if (status.activePhase === "Q1" || status.activePhase === "Q2" || status.activePhase === "Q3" || status.activePhase === "Q4") {
        quarter = status.activePhase;
      } else {
        quarter = "Q1"; // fallback
      }
    }
    
    const managerId = session.role === "manager" ? session.id : undefined;
    const data = await getCompletionAnalytics(quarter, managerId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Completion API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
