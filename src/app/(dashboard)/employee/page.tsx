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
    sheet = {
      ...sheetRaw,
      _id: sheetRaw._id.toString(),
      employeeId: sheetRaw.employeeId.toString(),
    };

    // Fetch Goals
    const goalsRaw = await Goal.find({ goalSheetId: sheetRaw._id }).lean();
    goals = goalsRaw.map((g: any) => ({
      ...g,
      _id: g._id.toString(),
      employeeId: g.employeeId.toString(),
      goalSheetId: g.goalSheetId.toString(),
      sharedGoalId: g.sharedGoalId?.toString() || null,
      createdBy: g.createdBy.toString(),
      updatedBy: g.updatedBy.toString(),
    }));
  }

  // Fetch Shared Goals assigned to this employee
  const sharedGoalsRaw = await SharedGoal.find({ assignedEmployees: user.id }).lean();
  const sharedGoals = sharedGoalsRaw.map((sg: any) => ({
    ...sg,
    _id: sg._id.toString(),
    primaryOwnerId: sg.primaryOwnerId.toString(),
    createdBy: sg.createdBy.toString(),
    assignedEmployees: sg.assignedEmployees.map((id: any) => id.toString()),
  }));

  // Fetch recent activity (Audit Logs) involving this user
  const activitiesRaw = await AuditLog.find({ 
    $or: [{ changedBy: user.id }, { entityId: sheetRaw?._id }]
  })
  .sort({ timestamp: -1 })
  .limit(5)
  .lean();

  const activities = activitiesRaw.map((a: any) => ({
    ...a,
    _id: a._id.toString(),
    entityId: a.entityId.toString(),
    changedBy: a.changedBy.toString(),
  }));

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
