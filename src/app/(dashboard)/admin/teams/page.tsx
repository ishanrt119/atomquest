import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { redirect } from "next/navigation";
import { TeamBuilderClient } from "./TeamBuilderClient";

export default async function AdminTeamsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  await connectToDatabase();
  
  const initialTeamsRaw = await Team.find()
    .populate("managerId", "name email designation role")
    .populate("employeeIds", "name email designation role")
    .sort({ createdAt: -1 })
    .lean();

  const initialTeams = JSON.parse(JSON.stringify(initialTeamsRaw.map((team: any) => ({
    _id: team._id.toString(),
    teamName: team.teamName,
    description: team.description,
    manager: team.managerId ? {
      _id: team.managerId._id.toString(),
      name: team.managerId.name,
      email: team.managerId.email,
      designation: team.managerId.designation,
      role: team.managerId.role,
    } : null,
    employees: team.employeeIds.map((emp: any) => ({
      _id: emp._id.toString(),
      name: emp.name,
      email: emp.email,
      designation: emp.designation,
      role: emp.role,
    }))
  }))));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Teams</h1>
        <p className="text-muted-foreground mt-2">
          Manage departments, assign managers, and allocate employees.
        </p>
      </div>

      <TeamBuilderClient initialTeams={initialTeams} />
    </div>
  );
}
