import { getCurrentUser } from "@/lib/session";
import { ManagerClient } from "./ManagerClient";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { AuditLog } from "@/models/AuditLog";
import { Team } from "@/models/Team";
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

  const mongoose = require("mongoose");
  const managerObjectId = new mongoose.Types.ObjectId(user.id);

  // Fetch team from Team collection first
  const team = await Team.findOne({ managerId: managerObjectId }).lean();
  const teamEmployeeIds = team ? team.employeeIds : [];

  // Fetch real team members from the users collection based on Team relationships
  const employeesRaw = await User.find({ _id: { $in: teamEmployeeIds } }).lean();
  
  // If the user has no managerId matches, fallback to empty array. 
  // (In a real system, you'd ensure seed data sets managerId properly)
  const employees = employeesRaw.map((emp: any) => ({
    id: emp._id.toString(),
    name: emp.name,
    designation: emp.designation || "Software Engineer",
  }));

  const employeeIds = employees.map((e) => e.id);

  const goalSheetsRaw = await GoalSheet.find({ employeeId: { $in: employeeIds }, year, quarter }).lean();
  const goalSheets = JSON.parse(JSON.stringify(goalSheetsRaw));

  const sheetIds = goalSheetsRaw.map((s) => s._id);
  const goalsRaw = await Goal.find({ goalSheetId: { $in: sheetIds } }).lean();
  const goals = JSON.parse(JSON.stringify(goalsRaw));

  // Fetch recent activities
  const activitiesRaw = await AuditLog.find({ entityId: { $in: sheetIds } })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();

  const activities = JSON.parse(JSON.stringify(activitiesRaw));

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
