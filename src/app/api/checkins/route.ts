import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CheckIn } from "@/models/CheckIn";
import { Goal } from "@/models/Goal";
import { GoalSheet } from "@/models/GoalSheet";
import { User } from "@/models/User";
import { verifyJWT } from "@/lib/auth";
import { calculateProgress, deriveStatusFromProgress } from "@/services/sync/progressCalculationService";

// GET active quarter check-ins for logged-in employee
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId") || session.userId;
    const quarter = searchParams.get("quarter") || "Q1";

    await connectToDatabase();

    // Only fetch goals from approved/locked goal sheets for the current financial year
    const approvedSheets = await GoalSheet.find({
      employeeId,
      status: { $in: ["approved"] },
      locked: true,
    }).select("_id").lean();

    const approvedSheetIds = approvedSheets.map((s: any) => s._id);

    // Also fetch goals that are locked directly (shared goals cascade)
    const goals = await Goal.find({
      employeeId,
      $or: [
        { goalSheetId: { $in: approvedSheetIds } },
        { isSharedGoal: true, locked: true },
      ],
    }).lean();

    if (goals.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Find existing persisted check-ins
    const goalIds = goals.map((g: any) => g._id);
    const existingCheckins = await CheckIn.find({
      employeeId,
      quarter,
      goalId: { $in: goalIds },
    }).populate("goalId").lean();

    // Build virtual check-ins for goals without one
    // CRITICAL: Use standardized progress fields, NOT legacy progressPercentage
    const virtualCheckins = goals.map((goal: any) => {
      const existing = existingCheckins.find(
        (c: any) => c.goalId?._id?.toString() === goal._id.toString()
      );
      if (existing) return existing;

      // Calculate progress from goal's current achievement for virtual checkins
      const progress = calculateProgress(
        goal.uomType,
        goal.measurementDirection,
        goal.targetValue,
        goal.currentAchievement ?? null,
        goal.targetDate,
        null
      );

      return {
        _id: `virtual_${goal._id}`,
        goalId: goal,
        employeeId,
        quarter,
        plannedTargetValue: goal.targetValue,
        plannedTargetDate: goal.targetDate,
        actualAchievementValue: goal.currentAchievement ?? null,
        actualAchievementDate: null,
        rawProgressPercentage: goal.rawProgressPercentage ?? progress.rawProgressPercentage,
        displayProgressPercentage: goal.displayProgressPercentage ?? progress.displayProgressPercentage,
        progressStatusLabel: goal.progressStatusLabel ?? progress.progressStatusLabel,
        status: goal.status ?? deriveStatusFromProgress(progress.rawProgressPercentage),
        employeeComment: "",
        checkinSubmitted: false,
        managerReviewed: false,
      };
    });

    return NextResponse.json({ success: true, data: virtualCheckins });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


// UPSERT check-ins (batch save)
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { checkins, quarter } = body;

    await connectToDatabase();

    const employee = await User.findById(session.userId);
    if (!employee) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updatedCheckins = [];

    for (const c of checkins) {
      const isVirtual = c._id && c._id.toString().startsWith("virtual_");

      // Recalculate progress server-side for consistency
      const goalDoc = typeof c.goalId === "object" ? c.goalId : await Goal.findById(c.goalId).lean();
      const progress = calculateProgress(
        goalDoc?.uomType || "numeric",
        goalDoc?.measurementDirection || "max",
        goalDoc?.targetValue,
        c.actualAchievementValue,
        goalDoc?.targetDate,
        c.actualAchievementDate
      );

      const checkinFields = {
        actualAchievementValue: c.actualAchievementValue,
        actualAchievementDate: c.actualAchievementDate,
        rawProgressPercentage: progress.rawProgressPercentage,
        displayProgressPercentage: progress.displayProgressPercentage,
        progressStatusLabel: progress.progressStatusLabel,
        status: c.status || deriveStatusFromProgress(progress.rawProgressPercentage),
        employeeComment: c.employeeComment,
      };

      let checkinDoc;
      if (isVirtual) {
        checkinDoc = await CheckIn.create({
          goalId: c.goalId._id || c.goalId,
          employeeId: session.userId,
          managerId: employee.managerId || employee._id,
          quarter,
          plannedTargetValue: c.plannedTargetValue,
          plannedTargetDate: c.plannedTargetDate,
          ...checkinFields,
        });
      } else {
        checkinDoc = await CheckIn.findByIdAndUpdate(
          c._id,
          { $set: checkinFields },
          { new: true }
        );
      }
      updatedCheckins.push(checkinDoc);
    }

    return NextResponse.json({ success: true, data: updatedCheckins });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
