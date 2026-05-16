import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { redirect } from "next/navigation";
import { GoalFormClient } from "./GoalFormClient";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") redirect("/login");

  await connectToDatabase();

  const year = new Date().getFullYear();
  const quarter = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  let sheet = await GoalSheet.findOne({ employeeId: user.id, year, quarter }).lean();

  if (!sheet) {
    sheet = await GoalSheet.create({
      employeeId: user.id,
      year,
      quarter,
      status: "draft",
      locked: false,
      totalWeightage: 0,
    });
  }

  // Fetch linked goals
  const goals = await Goal.find({ goalSheetId: sheet._id }).lean();

  // Convert ObjectIds to strings
  const formattedSheet = {
    ...sheet,
    _id: sheet._id.toString(),
    employeeId: sheet.employeeId.toString(),
  };

  const formattedGoals = goals.map((g: any) => ({
    ...g,
    _id: g._id.toString(),
    employeeId: g.employeeId.toString(),
    goalSheetId: g.goalSheetId.toString(),
    sharedGoalId: g.sharedGoalId?.toString(),
    createdBy: g.createdBy.toString(),
    updatedBy: g.updatedBy.toString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Goal Creation & Planning</h1>
        <p className="text-muted-foreground mt-2">
          Define your OKRs for {quarter} {year}. The total weightage must equal exactly 100%.
        </p>
      </div>

      <GoalFormClient 
        initialSheet={formattedSheet} 
        initialGoals={formattedGoals} 
      />
    </div>
  );
}
