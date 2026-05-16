import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SharedGoal } from "@/models/SharedGoal";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";
import { createBulkNotifications } from "@/services/notification";
import { getFinancialYear, getFinancialQuarter } from "@/lib/utils";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const query: any = {};
    if (session.role === "employee") {
      query.participatingEmployeeIds = session.userId;
    } else if (session.role === "manager") {
      query.$or = [{ createdBy: session.userId }, { primaryOwnerId: session.userId }];
    }

    const sharedGoals = await SharedGoal.find(query)
      .populate("primaryOwnerId", "name email")
      .populate("participatingEmployeeIds", "name email")
      .populate("teamId", "teamName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: sharedGoals }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, description, thrustArea, target, targetDate, uomType = "numeric", measurementDirection = "max", participatingEmployeeIds, primaryOwnerId, teamId } = body;

    if (!title || !target || !primaryOwnerId) {
      return NextResponse.json({ error: "Title, target, and primaryOwnerId are required" }, { status: 400 });
    }

    await connectToDatabase();

    const newSharedGoal = await SharedGoal.create({
      title,
      description,
      thrustArea,
      uomType,
      measurementDirection,
      targetValue: target,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      participatingEmployeeIds: participatingEmployeeIds || [],
      primaryOwnerId,
      teamId,
      assignedByRole: session.role === "admin" ? "admin" : "manager",
      createdBy: session.userId,
      linkedGoalIds: [],
    });

    await createAuditLog({
      entityType: "SharedGoal",
      entityId: newSharedGoal._id,
      action: "created",
      changedBy: session.userId,
      newValue: { title, target },
    });

    // Cascade: Create matching Goal entries for assigned employees
    // Note: We assign them an initial weightage of 10. The employee must adjust their own sheet to equal 100%.
    if (participatingEmployeeIds && participatingEmployeeIds.length > 0) {
      const year = getFinancialYear();
      const quarter = getFinancialQuarter(); // Current quarter

      // Ensure primaryOwner is in the list to receive a goal too
      const allEmployeesToAssign = [...new Set([...participatingEmployeeIds, primaryOwnerId])];
      const linkedGoalIds = [];

      for (const empId of allEmployeesToAssign) {
        // Find their active goal sheet or create a draft one
        let sheet = await GoalSheet.findOne({ employeeId: empId, year, quarter });
        if (!sheet) {
          sheet = await GoalSheet.create({
            employeeId: empId,
            year,
            quarter,
            status: "draft",
            locked: false,
          });
        }

        const isOwner = empId.toString() === primaryOwnerId.toString();

        const goal = await Goal.create({
          title,
          description,
          thrustArea,
          targetValue: target,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          weightage: 10, // Default minimum weightage, employee can adjust
          uomType,
          measurementDirection,
          status: "not_started",
          locked: false, // Not locked until sheet is approved, but title/target are locked by UI
          employeeId: empId,
          goalSheetId: sheet._id,
          isSharedGoal: true,
          sharedGoalId: newSharedGoal._id,
          isPrimaryOwner: isOwner,
          createdBy: session.userId,
          updatedBy: session.userId,
        });

        linkedGoalIds.push(goal._id);
      }

      // Update SharedGoal with linked goals
      newSharedGoal.linkedGoalIds = linkedGoalIds;
      await newSharedGoal.save();

      // Notify all assigned employees
      const notifications = participatingEmployeeIds.map((empId: string) => ({
        recipientId: empId,
        senderId: session.userId,
        type: "shared_goal_assigned",
        title: "New Shared Goal",
        message: `You have been assigned a new shared goal: "${title}".`,
        priority: "high",
        link: "/employee/goals"
      }));
      await createBulkNotifications(notifications);
    }

    return NextResponse.json({ success: true, data: newSharedGoal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
