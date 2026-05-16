import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";
import { createNotification } from "@/services/notification";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, targetTeamId, slotType } = body; // slotType: 'manager' | 'employee' | 'unassigned'

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    await connectToDatabase();
    
    // We don't have proper replica sets configured for transactions in all environments,
    // so we'll do careful sequential updates.
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const oldTeamId = user.teamId;
    let targetTeam = null;

    if (slotType !== 'unassigned') {
      targetTeam = await Team.findById(targetTeamId);
      if (!targetTeam) return NextResponse.json({ error: "Target team not found" }, { status: 404 });
      
      // Validations
      if (slotType === 'manager') {
        if (user.role !== 'manager') return NextResponse.json({ error: "User is not a manager" }, { status: 400 });
        if (targetTeam.managerId && targetTeam.managerId.toString() !== userId) {
          return NextResponse.json({ error: "Team already has a manager" }, { status: 400 });
        }
        if (targetTeam.employeeIds.includes(userId)) {
          return NextResponse.json({ error: "User is already an employee in this team" }, { status: 400 });
        }
      } else if (slotType === 'employee') {
        if (user.role !== 'employee') return NextResponse.json({ error: "User is not an employee" }, { status: 400 });
        if (targetTeam.managerId && targetTeam.managerId.toString() === userId) {
          return NextResponse.json({ error: "User is already the manager of this team" }, { status: 400 });
        }
      }
    }

    // Step 1: Remove from old team if exists
    if (oldTeamId) {
      const oldTeam = await Team.findById(oldTeamId);
      if (oldTeam) {
        if (oldTeam.managerId && oldTeam.managerId.toString() === userId) {
          oldTeam.managerId = null;
        }
        oldTeam.employeeIds = oldTeam.employeeIds.filter((id: any) => id.toString() !== userId);
        await oldTeam.save();
      }
    }

    // Step 2: Add to new team
    if (slotType === 'manager' && targetTeam) {
      targetTeam.managerId = user._id;
      user.teamId = targetTeam._id;
      await targetTeam.save();
    } else if (slotType === 'employee' && targetTeam) {
      if (!targetTeam.employeeIds.includes(user._id)) {
        targetTeam.employeeIds.push(user._id);
        await targetTeam.save();
      }
      user.teamId = targetTeam._id;
      user.managerId = targetTeam.managerId || null; // Auto-assign team manager
    } else if (slotType === 'unassigned') {
      user.teamId = null;
      user.managerId = null;
    }

    await user.save();

    // If a new manager is assigned to a team, update managerId for all team employees
    if (slotType === 'manager' && targetTeam) {
      await User.updateMany(
        { _id: { $in: targetTeam.employeeIds } },
        { $set: { managerId: user._id } }
      );
    }
    
    // If manager is removed (unassigned), unset managerId for team employees
    if (oldTeamId && user.role === 'manager') {
      const oldTeam = await Team.findById(oldTeamId);
      if (oldTeam && !oldTeam.managerId) {
        await User.updateMany(
          { _id: { $in: oldTeam.employeeIds } },
          { $unset: { managerId: 1 } }
        );
      }
    }

    await createAuditLog({
      entityType: "TeamAssignment",
      entityId: user._id,
      action: "updated",
      changedBy: session.userId,
      oldValue: { teamId: oldTeamId },
      newValue: { teamId: user.teamId, slotType },
    });

    if (slotType !== 'unassigned' && targetTeam) {
      if (slotType === 'manager') {
        await createNotification({
          recipientId: user._id,
          senderId: session.userId,
          type: "team_assignment",
          title: "Assigned as Team Manager",
          message: `You have been assigned as the manager for ${targetTeam.teamName}.`,
          priority: "high",
          link: "/manager",
        });
      } else if (slotType === 'employee') {
        await createNotification({
          recipientId: user._id,
          senderId: session.userId,
          type: "team_assignment",
          title: "Team Assignment",
          message: `You have been assigned to ${targetTeam.teamName}.`,
          priority: "high",
          link: "/employee",
        });

        if (targetTeam.managerId) {
          await createNotification({
            recipientId: targetTeam.managerId,
            senderId: session.userId,
            type: "team_assignment",
            title: "New Team Member",
            message: `${user.name} has been assigned to your team.`,
            priority: "medium",
            link: "/manager",
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: { user, team: targetTeam } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
