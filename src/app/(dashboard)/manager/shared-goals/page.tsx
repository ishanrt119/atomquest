import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import { SharedGoalsClient } from "./SharedGoalsClient";

export default async function ManagerSharedGoalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  await connectToDatabase();

  const sharedGoalsRaw = await SharedGoal.find()
    .populate("primaryOwnerId", "name email")
    .populate("assignedEmployees", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const allEmployeesRaw = await User.find({ managerId: user.id }).select("name email _id").lean();

  const sharedGoals = sharedGoalsRaw.map((sg: any) => ({
    ...sg,
    _id: sg._id.toString(),
    primaryOwnerId: { ...sg.primaryOwnerId, _id: sg.primaryOwnerId._id.toString() },
    assignedEmployees: sg.assignedEmployees.map((e: any) => ({ ...e, _id: e._id.toString() })),
    createdBy: sg.createdBy.toString(),
  }));

  const allEmployees = allEmployeesRaw.map((e: any) => ({
    ...e,
    _id: e._id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Shared Goals</h1>
        <p className="text-muted-foreground mt-2">
          Create top-level company goals and cascade them to specific employees.
        </p>
      </div>

      <SharedGoalsClient initialSharedGoals={sharedGoals} employees={allEmployees} />
    </div>
  );
}
