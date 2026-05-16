import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { redirect } from "next/navigation";
import { GoalFormClient } from "./GoalFormClient";
import { getFinancialYear, getFinancialQuarter } from "@/lib/utils";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") redirect("/login");

  await connectToDatabase();

  const year = getFinancialYear();
  const quarter = getFinancialQuarter();

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

  // Safely serialize Mongoose documents to plain objects for Client Component
  const formattedSheet = JSON.parse(JSON.stringify(sheet));
  const formattedGoals = JSON.parse(JSON.stringify(goals));

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
