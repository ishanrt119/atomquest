import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Goal } from "@/models/Goal";
import { CheckIn } from "@/models/CheckIn";
import mongoose from "mongoose";

export async function getAchievementReport(filters: any = {}) {
  await connectToDatabase();

  const matchStage: any = {};
  if (filters.quarter) {
    matchStage["checkins.quarter"] = filters.quarter;
  }
  if (filters.status) {
    matchStage.status = filters.status;
  }
  if (filters.employeeId) {
    matchStage.employeeId = new mongoose.Types.ObjectId(filters.employeeId);
  }

  // Use aggregation to join Goals with Users, Teams, Managers, and CheckIns
  const pipeline = [
    {
      $match: matchStage
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
    },
    {
      $lookup: {
        from: "teams",
        localField: "employee.teamId",
        foreignField: "_id",
        as: "team"
      }
    },
    {
      $unwind: {
        path: "$team",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "team.managerId",
        foreignField: "_id",
        as: "manager"
      }
    },
    {
      $unwind: {
        path: "$manager",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        employeeName: "$employee.name",
        employeeIdCode: "$employee._id",
        teamName: "$team.name",
        managerName: "$manager.name",
        goalTitle: "$title",
        thrustArea: "$thrustArea",
        uomType: "$uomType",
        targetValue: "$targetValue",
        currentAchievement: "$currentAchievement",
        progressPercentage: "$displayProgressPercentage",
        status: "$status",
        isSharedGoal: "$isSharedGoal",
        updatedAt: "$updatedAt"
      }
    }
  ];

  const results = await Goal.aggregate(pipeline);
  return results;
}
