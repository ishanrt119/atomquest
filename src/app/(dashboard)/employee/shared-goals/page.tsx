import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertCircle, Target, TrendingUp, Link as LinkIcon, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function EmployeeSharedGoalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") redirect("/login");

  await connectToDatabase();

  const sharedGoalsRaw = await SharedGoal.find({
    $or: [
      { participatingEmployeeIds: user.id },
      { primaryOwnerId: user.id }
    ]
  })
    .populate("primaryOwnerId", "name email")
    .populate("participatingEmployeeIds", "name email")
    .populate("teamId", "teamName")
    .sort({ createdAt: -1 })
    .lean();

  const sharedGoals = sharedGoalsRaw.map((sg: any) => ({
    ...sg,
    _id: sg._id.toString(),
    primaryOwnerId: sg.primaryOwnerId ? { ...sg.primaryOwnerId, _id: sg.primaryOwnerId._id.toString() } : null,
    participatingEmployeeIds: sg.participatingEmployeeIds ? sg.participatingEmployeeIds.map((e: any) => ({ ...e, _id: e._id.toString() })) : [],
    teamId: sg.teamId ? { ...sg.teamId, _id: sg.teamId._id.toString() } : null,
    linkedGoalIds: sg.linkedGoalIds ? sg.linkedGoalIds.map((id: any) => id.toString()) : [],
    createdBy: sg.createdBy.toString(),
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Goals</h1>
          <p className="text-muted-foreground mt-2">
            View departmental KPIs and cross-functional objectives you are assigned to.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sharedGoals.map((sg) => (
          <div key={sg._id} className="p-6 md:p-8 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {sg.primaryOwnerId._id === user.id && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="size-3" /> Primary Owner
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-foreground">{sg.title}</h3>
                  <Badge variant={sg.status === "completed" ? "default" : sg.status === "on_track" ? "secondary" : "outline"} className="uppercase">
                    {sg.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-3xl">{sg.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-muted/30 rounded-xl mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5 mb-1"><Target className="size-3" /> Target</p>
                <p className="font-bold text-lg">{sg.targetValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5 mb-1"><TrendingUp className="size-3" /> Achievement</p>
                <p className="font-bold text-lg text-primary">{sg.currentAchievement ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Thrust Area</p>
                <p className="font-medium">{sg.thrustArea}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Primary Owner</p>
                <p className="font-medium">{sg.primaryOwnerId.name}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="flex items-center gap-2">
                  Overall Progress
                  {(sg.rawProgressPercentage ?? 0) > 100 && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 ml-2">
                      Exceeded Target ({sg.rawProgressPercentage}%)
                    </Badge>
                  )}
                </span>
                <span>{sg.displayProgressPercentage ?? 0}%</span>
              </div>
              <Progress value={sg.displayProgressPercentage ?? 0} className="h-2" />
            </div>

            <div className="flex justify-between items-center border-t pt-6">
              <div className="flex -space-x-2">
                {sg.participatingEmployeeIds.slice(0, 5).map((emp: any) => (
                  <div key={emp._id} className="size-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-bold text-primary" title={emp.name}>
                    {emp.name.charAt(0)}
                  </div>
                ))}
                {sg.participatingEmployeeIds.length > 5 && (
                  <div className="size-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold">
                    +{sg.participatingEmployeeIds.length - 5}
                  </div>
                )}
              </div>

              {sg.primaryOwnerId?._id === user.id && (
                <Link href="/employee/check-ins">
                  <Badge className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1.5">
                    Update Achievement <ArrowRight className="size-3" />
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        ))}

        {sharedGoals.length === 0 && (
          <div className="text-center py-16 border border-dashed rounded-2xl bg-muted/10">
            <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Shared Goals</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven't been assigned to any cross-functional shared goals yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
