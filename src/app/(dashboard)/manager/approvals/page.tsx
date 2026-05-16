import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { User } from "@/models/User";
import { Goal } from "@/models/Goal";
import { redirect } from "next/navigation";
import { ApprovalQueueClient } from "./ApprovalQueueClient";

export default async function ManagerApprovalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  await connectToDatabase();

  // Get team members
  const employees = await User.find({ managerId: user.id }).select("_id").lean();
  const employeeIds = employees.map(emp => emp._id);

  // Fetch submitted goal sheets only for team members
  const submittedSheets = await GoalSheet.find({
    status: "submitted",
    employeeId: { $in: employeeIds }
  })
    .populate("employeeId", "name email designation")
    .sort({ updatedAt: -1 })
    .lean();

  // Fetch goals for these sheets
  const sheetIds = submittedSheets.map(s => s._id);
  const allGoals = await Goal.find({ goalSheetId: { $in: sheetIds } }).lean();

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
      .filter(g => g.goalSheetId.toString() === sheet._id.toString())
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
