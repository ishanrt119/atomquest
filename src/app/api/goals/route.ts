import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Goal } from "@/models/Goal";
import { GoalSheet } from "@/models/GoalSheet";
import { verifyJWT } from "@/lib/auth";
import { validateGoalsArray } from "@/validations/goals";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const goalSheetId = searchParams.get("goalSheetId");

    if (!goalSheetId) {
      return NextResponse.json({ error: "goalSheetId is required" }, { status: 400 });
    }

    await connectToDatabase();

    const goals = await Goal.find({ goalSheetId }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ success: true, data: goals }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Bulk Save Goals (Save Draft)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { goalSheetId, goals } = body;

    if (!goalSheetId || !Array.isArray(goals)) {
      return NextResponse.json({ error: "goalSheetId and goals array are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify sheet is not locked
    const sheet = await GoalSheet.findById(goalSheetId);
    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    if (sheet.locked) {
      return NextResponse.json({ error: "Cannot modify goals. Sheet is locked." }, { status: 403 });
    }

    // Role check - employee can only edit their own sheet
    if (session.role === "employee" && sheet.employeeId.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run validation (Warning only if it's a draft save, but we will strictly enforce constraints like length)
    if (goals.length > 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed." }, { status: 400 });
    }

    // Validate custom uom constraints
    for (const g of goals) {
      if (g.uomType === "percentage" && (g.targetValue < 0 || g.targetValue > 100)) {
        return NextResponse.json({ error: `Goal "${g.title || 'Untitled'}": Target must be between 0 and 100 for percentages.` }, { status: 400 });
      }
      if (g.uomType === "zero" && g.targetValue !== 0) {
        return NextResponse.json({ error: `Goal "${g.title || 'Untitled'}": Target must be exactly 0 for zero defects.` }, { status: 400 });
      }
    }

    // Bulk Operation
    // 1. Delete goals that are no longer in the array
    const goalIdsToKeep = goals.map(g => g._id).filter(id => id); // Extract existing IDs
    await Goal.deleteMany({ goalSheetId, _id: { $nin: goalIdsToKeep }, isSharedGoal: false });

    // 2. Upsert the provided goals
    const upsertPromises = goals.map(async (g) => {
      if (g._id) {
        // Update existing (prevent editing title/target if it's a shared goal)
        const updateData: any = {
          description: g.description,
          weightage: g.weightage,
          updatedBy: session.userId
        };

        if (!g.isSharedGoal) {
          updateData.title = g.title;
          updateData.thrustArea = g.thrustArea;
          updateData.uomType = g.uomType;
          updateData.measurementDirection = g.measurementDirection;
          updateData.targetValue = g.targetValue;
          if (g.targetDate) {
            updateData.targetDate = g.targetDate;
          } else {
            updateData.$unset = { targetDate: 1 };
          }
        }

        return Goal.findByIdAndUpdate(g._id, { $set: updateData }, { new: true });
      } else {
        return Goal.create({
          ...g,
          targetDate: g.targetDate || undefined,
          goalSheetId,
          employeeId: sheet.employeeId,
          createdBy: session.userId,
          updatedBy: session.userId,
        });
      }
    });

    await Promise.all(upsertPromises);

    // Update total weightage on sheet
    const currentTotal = goals.reduce((acc, curr) => acc + (Number(curr.weightage) || 0), 0);
    sheet.totalWeightage = currentTotal;
    await sheet.save();

    return NextResponse.json({ success: true, message: "Goals saved successfully." }, { status: 200 });

  } catch (error: any) {
    console.error("[Bulk Save] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
