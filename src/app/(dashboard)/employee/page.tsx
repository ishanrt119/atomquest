import { getCurrentUser } from "@/lib/session";
import { EmployeeClient } from "./EmployeeClient";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { SharedGoal } from "@/models/SharedGoal";
import { AuditLog } from "@/models/AuditLog";
import { getFinancialYear, getFinancialQuarter } from "@/lib/utils";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "employee") {
    redirect("/login");
  }

  await connectToDatabase();

  const firstName = user.name.split(" ")[0] || "Employee";
  const year = getFinancialYear();
  const quarter = getFinancialQuarter();

  // Fetch current Goal Sheet
  const sheetRaw = await GoalSheet.findOne({ employeeId: user.id, year, quarter }).lean();
  let sheet = null;
  let goals: any[] = [];
  
  if (sheetRaw) {
    sheet = JSON.parse(JSON.stringify(sheetRaw));

    // Fetch Goals
    const goalsRaw = await Goal.find({ goalSheetId: sheetRaw._id }).lean();
    goals = JSON.parse(JSON.stringify(goalsRaw));
  }

  // Fetch Shared Goals assigned to this employee
  const sharedGoalsRaw = await SharedGoal.find({ assignedEmployees: user.id }).lean();
  const sharedGoals = JSON.parse(JSON.stringify(sharedGoalsRaw));

  // Fetch recent activity (Audit Logs) involving this user
  const activitiesRaw = await AuditLog.find({ 
    $or: [{ changedBy: user.id }, { entityId: sheetRaw?._id }]
  })
  .sort({ timestamp: -1 })
  .limit(5)
  .lean();

  const activities = JSON.parse(JSON.stringify(activitiesRaw));

  return (
    <EmployeeClient 
      firstName={firstName} 
      sheet={sheet} 
      goals={goals} 
      sharedGoals={sharedGoals} 
      activities={activities}
      quarter={quarter}
      year={year}
    />
  );
}
