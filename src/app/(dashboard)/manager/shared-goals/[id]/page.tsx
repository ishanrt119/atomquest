import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { redirect } from "next/navigation";
import { SharedGoalDetailClient } from "@/components/shared-goals/SharedGoalDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ManagerSharedGoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "manager") redirect("/login");

  const { id } = await params;

  await connectToDatabase();

  const sharedGoalRaw = await SharedGoal.findById(id)
    .populate("primaryOwnerId", "name email")
    .populate("participatingEmployeeIds", "name email")
    .populate("teamId", "teamName")
    .lean();

  if (!sharedGoalRaw) redirect("/manager/shared-goals");

  const sharedGoal = {
    ...sharedGoalRaw,
    _id: sharedGoalRaw._id.toString(),
    primaryOwnerId: sharedGoalRaw.primaryOwnerId ? { ...sharedGoalRaw.primaryOwnerId, _id: sharedGoalRaw.primaryOwnerId._id.toString() } : null,
    participatingEmployeeIds: sharedGoalRaw.participatingEmployeeIds ? sharedGoalRaw.participatingEmployeeIds.map((e: any) => ({ ...e, _id: e._id.toString() })) : [],
    teamId: sharedGoalRaw.teamId ? { ...sharedGoalRaw.teamId, _id: sharedGoalRaw.teamId._id.toString() } : null,
    linkedGoalIds: sharedGoalRaw.linkedGoalIds ? sharedGoalRaw.linkedGoalIds.map((id: any) => id.toString()) : [],
    createdBy: sharedGoalRaw.createdBy.toString(),
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/manager/shared-goals" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit">
          <ArrowLeft className="size-4" /> Back to Shared Goals
        </Link>
      </div>
      
      <SharedGoalDetailClient goal={sharedGoal} currentUser={user} />
    </div>
  );
}
