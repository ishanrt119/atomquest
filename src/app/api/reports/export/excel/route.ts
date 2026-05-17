import { NextResponse } from "next/server";
import { getAchievementReport } from "@/services/reporting/exportService";
import { getCurrentUser } from "@/lib/session";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter");
    
    const filters: any = {};
    if (quarter) filters.quarter = quarter;

    const data = await getAchievementReport(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Achievement Report");

    worksheet.columns = [
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Team Name", key: "teamName", width: 20 },
      { header: "Manager", key: "managerName", width: 25 },
      { header: "Goal Title", key: "goalTitle", width: 40 },
      { header: "Thrust Area", key: "thrustArea", width: 20 },
      { header: "UoM Type", key: "uomType", width: 15 },
      { header: "Target", key: "targetValue", width: 15 },
      { header: "Actual", key: "currentAchievement", width: 15 },
      { header: "Progress %", key: "progressPercentage", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Shared", key: "isSharedGoal", width: 10 },
      { header: "Updated At", key: "updatedAt", width: 25 },
    ];

    worksheet.addRows(data);

    // Styling the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="achievement_report_${new Date().getTime()}.xlsx"`
      }
    });

  } catch (error) {
    console.error("Excel Export error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
