import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import { SharedGoalsClient } from "./SharedGoalsClient";

export default async function ManagerSharedGoalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  await connectToDatabase();

  const sharedGoalsRaw = await SharedGoal.find()
    .populate("primaryOwnerId", "name email")
    .populate("participatingEmployeeIds", "name email")
    .populate("teamId", "teamName")
    .sort({ createdAt: -1 })
    .lean();

  const allEmployeesRaw = await User.find({ managerId: user.id }).select("name email _id").lean();

  const sharedGoals = sharedGoalsRaw.map((sg: any) => ({
    ...sg,
    _id: sg._id.toString(),
    primaryOwnerId: sg.primaryOwnerId ? { ...sg.primaryOwnerId, _id: sg.primaryOwnerId._id.toString() } : null,
    participatingEmployeeIds: sg.participatingEmployeeIds ? sg.participatingEmployeeIds.map((e: any) => ({ ...e, _id: e._id.toString() })) : [],
    teamId: sg.teamId ? { ...sg.teamId, _id: sg.teamId._id.toString() } : null,
    linkedGoalIds: sg.linkedGoalIds ? sg.linkedGoalIds.map((id: any) => id.toString()) : [],
    createdBy: sg.createdBy.toString(),
  }));

  // Manager only sees teams they manage
  const allTeamsRaw = await Team.find({ managerId: user.id }).populate("managerId", "name").populate("employeeIds", "name email").lean();
  const allTeams = allTeamsRaw.map((t: any) => ({
    ...t,
    _id: t._id.toString(),
    managerId: t.managerId ? { ...t.managerId, _id: t.managerId._id.toString() } : null,
    employeeIds: t.employeeIds.map((e: any) => ({ ...e, _id: e._id.toString() })),
    createdBy: t.createdBy.toString()
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Shared Goals</h1>
        <p className="text-muted-foreground mt-2">
          Create top-level company goals and cascade them to specific employees.
        </p>
      </div>

      <SharedGoalsClient initialSharedGoals={sharedGoals} teams={allTeams} />
    </div>
  );
}
