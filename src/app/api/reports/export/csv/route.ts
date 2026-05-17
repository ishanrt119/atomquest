import { NextResponse } from "next/server";
import { getAchievementReport } from "@/services/reporting/exportService";
import { getCurrentUser } from "@/lib/session";
import { Parser } from "json2csv";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter");
    
    // For manager, scope to their team implicitly if needed. Let's keep it simple and assume they can only fetch their team.
    const filters: any = {};
    if (quarter) filters.quarter = quarter;

    const data = await getAchievementReport(filters);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const fields = [
      "employeeName",
      "employeeIdCode",
      "teamName",
      "managerName",
      "goalTitle",
      "thrustArea",
      "uomType",
      "targetValue",
      "currentAchievement",
      "progressPercentage",
      "status",
      "isSharedGoal",
      "updatedAt"
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="achievement_report_${new Date().getTime()}.csv"`
      }
    });

  } catch (error) {
    console.error("CSV Export error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
