import { getCurrentUser } from "@/lib/session";
import { ManagerClient } from "./ManagerClient";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { AuditLog } from "@/models/AuditLog";
import { Team } from "@/models/Team";
import { CheckIn } from "@/models/CheckIn";
import { redirect } from "next/navigation";
import { getFinancialYear, getFinancialQuarter } from "@/lib/utils";
import mongoose from "mongoose";

export default async function ManagerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstName = user.name.split(" ")[0] || "Manager";

  await connectToDatabase();
  const year = getFinancialYear();
  const quarter = getFinancialQuarter();
  const managerObjectId = new mongoose.Types.ObjectId(user.id);

  // ── 1. Find team ────────────────────────────────────────────────────────
  const team = await Team.findOne({ managerId: managerObjectId })
    .populate("employeeIds", "name email designation")
    .lean();

  const teamMembersRaw: any[] = team ? (team.employeeIds as any[]) : [];
  const employees = teamMembersRaw.map((emp: any) => ({
    id: emp._id.toString(),
    name: emp.name,
    designation: emp.designation || "Team Member",
  }));
  const employeeIds = teamMembersRaw.map((e: any) => e._id);

  // ── 2. Goal Sheets (for approval queue) ────────────────────────────────
  const goalSheetsRaw = await GoalSheet.find({
    employeeId: { $in: employeeIds },
    year,
    quarter,
  }).lean();
  const goalSheets = JSON.parse(JSON.stringify(goalSheetsRaw));

  // ── 3. Latest CheckIns (source of truth for progress) ──────────────────
  const checkinsRaw = await CheckIn.find({
    employeeId: { $in: employeeIds },
    quarter,
  })
    .populate("goalId", "title thrustArea uomType targetValue weightage isSharedGoal")
    .populate("employeeId", "name email")
    .sort({ updatedAt: -1 })
    .lean();

  const checkins = checkinsRaw.map((c: any) => ({
    ...c,
    _id: c._id.toString(),
    goalId: c.goalId ? { ...c.goalId, _id: c.goalId._id.toString() } : null,
    employeeId: c.employeeId ? { ...c.employeeId, _id: c.employeeId._id.toString() } : null,
    managerId: c.managerId?.toString(),
  }));

  // ── 4. Recent audit activity ────────────────────────────────────────────
  const sheetIds = goalSheetsRaw.map((s) => s._id);
  const activitiesRaw = await AuditLog.find({
    $or: [
      { entityId: { $in: sheetIds } },
      { entityId: { $in: employeeIds } },
    ],
  })
    .sort({ timestamp: -1 })
    .limit(8)
    .lean();
  const activities = JSON.parse(JSON.stringify(activitiesRaw));

  return (
    <ManagerClient
      firstName={firstName}
      teamMembers={employees}
      goalSheets={goalSheets}
      checkins={checkins}
      activities={activities}
      currentQuarter={quarter}
    />
  );
}
