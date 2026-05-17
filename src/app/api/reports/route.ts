import { NextResponse } from "next/server";
import { getAchievementReport } from "@/services/reporting/exportService";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter");
    const status = searchParams.get("status");
    
    const filters: any = {};
    if (quarter) filters.quarter = quarter;
    if (status) filters.status = status;

    const data = await getAchievementReport(filters);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
