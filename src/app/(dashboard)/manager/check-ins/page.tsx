import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { redirect } from "next/navigation";
import { ManagerReviewClient } from "./ManagerReviewClient";

export default async function ManagerCheckInsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  await connectToDatabase();

  // Use Team collection as the source of truth (not User.managerId)
  const team = await Team.findOne({ managerId: user.id })
    .populate("employeeIds", "name email designation")
    .lean();

  const teamMembers = team
    ? (team.employeeIds as any[]).map((emp: any) => ({
        _id: emp._id.toString(),
        name: emp.name,
        email: emp.email,
        designation: emp.designation || "Team Member",
      }))
    : [];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Check-ins & Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Review your team's quarterly progress, analyze achievements, and provide structured feedback.
        </p>
      </div>

      <ManagerReviewClient managerId={user.id} teamMembers={teamMembers} />
    </div>
  );
}
