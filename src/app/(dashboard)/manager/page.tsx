import { getCurrentUser } from "@/lib/session";
import { ManagerClient } from "./ManagerClient";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { AuditLog } from "@/models/AuditLog";
import { redirect } from "next/navigation";
import { getFinancialYear, getFinancialQuarter } from "@/lib/utils";

export default async function ManagerDashboard() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const firstName = user.name.split(" ")[0] || "Manager";

  await connectToDatabase();
  const year = getFinancialYear();
  const quarter = getFinancialQuarter();

  // Fetch real team members from the users collection
  const employeesRaw = await User.find({ managerId: user.id }).lean();
  
  // If the user has no managerId matches, fallback to empty array. 
  // (In a real system, you'd ensure seed data sets managerId properly)
  const employees = employeesRaw.map((emp: any) => ({
    id: emp._id.toString(),
    name: emp.name,
    designation: emp.designation || "Software Engineer",
  }));

  const employeeIds = employees.map((e) => e.id);

  // Fetch all goal sheets for this team
  const goalSheetsRaw = await GoalSheet.find({ employeeId: { $in: employeeIds }, year, quarter }).lean();
  const goalSheets = goalSheetsRaw.map((s: any) => ({
    ...s,
    _id: s._id.toString(),
    employeeId: s.employeeId.toString()
  }));

  // Fetch all goals for these sheets
  const sheetIds = goalSheets.map((s) => s._id);
  const goalsRaw = await Goal.find({ goalSheetId: { $in: sheetIds } }).lean();
  const goals = goalsRaw.map((g: any) => ({
    ...g,
    _id: g._id.toString(),
    goalSheetId: g.goalSheetId.toString(),
    employeeId: g.employeeId.toString(),
  }));

  // Fetch recent activities
  const activitiesRaw = await AuditLog.find({ entityId: { $in: sheetIds } })
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
    <ManagerClient 
      firstName={firstName} 
      teamMembers={employees} 
      goalSheets={goalSheets} 
      goals={goals} 
      activities={activities} 
    />
  );
}
