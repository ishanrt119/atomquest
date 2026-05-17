import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { CheckIn } from "@/models/CheckIn";
import { Team } from "@/models/Team";

export async function getCompletionAnalytics(quarter: string, managerId?: string) {
  await connectToDatabase();

  let teamFilter: any = {};
  if (managerId) {
    const teams = await Team.find({ managerId }).select("_id").lean();
    const teamIds = teams.map((t: any) => t._id);
    teamFilter = { teamId: { $in: teamIds } };
  }

  // Count employees
  const totalEmployees = await User.countDocuments({ role: "employee", ...teamFilter });

  // Use aggregation to find checkins for the specific quarter
  const pipeline = [
    {
      $match: { quarter }
    },
    {
      $lookup: {
        from: "users",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee"
      }
    },
    {
      $unwind: "$employee"
    }
  ];

  if (managerId) {
    pipeline.push({
      $match: {
        "employee.teamId": teamFilter.teamId
      }
    } as any);
  }

  const checkins = await CheckIn.aggregate(pipeline);

  const submittedCount = checkins.filter((c: any) => c.status === "submitted" || c.status === "reviewed").length;
  const reviewedCount = checkins.filter((c: any) => c.status === "reviewed").length;
  const overdueCount = totalEmployees - submittedCount;

  const completionPercentage = totalEmployees > 0 ? Math.round((submittedCount / totalEmployees) * 100) : 0;
  const reviewPercentage = submittedCount > 0 ? Math.round((reviewedCount / submittedCount) * 100) : 0;

  return {
    totalEmployees,
    submittedCount,
    reviewedCount,
    overdueCount,
    completionPercentage,
    reviewPercentage,
    checkins
  };
}
