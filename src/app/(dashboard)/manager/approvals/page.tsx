import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { User } from "@/models/User";
import { Goal } from "@/models/Goal";
import { Team } from "@/models/Team";
import { redirect } from "next/navigation";
import { ApprovalQueueClient } from "./ApprovalQueueClient";

export default async function ManagerApprovalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  await connectToDatabase();

  const mongoose = require("mongoose");
  const managerObjectId = new mongoose.Types.ObjectId(user.id);

  // Get team members using Team collection source of truth
  const team = await Team.findOne({ managerId: managerObjectId }).lean();
  const teamEmployeeIds = team ? team.employeeIds : [];

  const employees = await User.find({ _id: { $in: teamEmployeeIds } }).select("_id").lean();
  const employeeIds = employees.map(emp => emp._id);

  // Fetch submitted goal sheets only for team members
  const submittedSheetsRaw = await GoalSheet.find({
    status: "submitted",
    employeeId: { $in: employeeIds }
  })
    .populate("employeeId", "name email designation")
    .sort({ updatedAt: -1 })
    .lean();

  // Fetch goals for these sheets
  const sheetIds = submittedSheetsRaw.map(s => s._id);
  const allGoalsRaw = await Goal.find({ goalSheetId: { $in: sheetIds } }).lean();

  const submittedSheets = JSON.parse(JSON.stringify(submittedSheetsRaw));
  const allGoals = JSON.parse(JSON.stringify(allGoalsRaw));

  // Group goals by sheetId
  const sheetsWithGoals = submittedSheets.map((sheet: any) => ({
    ...sheet,
    _id: sheet._id.toString(),
    employee: {
      id: sheet.employeeId._id.toString(),
      name: sheet.employeeId.name,
      email: sheet.employeeId.email,
      designation: sheet.employeeId.designation || "Software Engineer",
    },
    goals: allGoals
      .filter((g: any) => g.goalSheetId.toString() === sheet._id.toString())
      .map((g: any) => ({
        ...g,
        _id: g._id.toString(),
      })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review, adjust, and approve goal sheets submitted by your team.
        </p>
      </div>

      <ApprovalQueueClient initialSheets={sheetsWithGoals} />
    </div>
  );
}
