import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalSheet } from "@/models/GoalSheet";
import { Goal } from "@/models/Goal";
import { verifyJWT } from "@/lib/auth";
import { createAuditLog } from "@/services/audit";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, rejectionReason } = body; // action: 'submit' | 'approve' | 'reject' | 'unlock'
    const { id } = await params;

    await connectToDatabase();

    const sheet = await GoalSheet.findById(id);
    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });

    const oldStatus = sheet.status;

    // Authorization & Action handling
    if (action === "submit") {
      // Employee submitting their own sheet
      if (session.role === "employee" && sheet.employeeId.toString() !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Calculate real total weightage from DB to be safe against client tampering
      const goals = await Goal.find({ goalSheetId: id });
      const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
      
      if (totalWeightage !== 100) {
        return NextResponse.json({ error: `Cannot submit. Total weightage is ${totalWeightage}% (must be 100%).` }, { status: 400 });
      }
      if (goals.length > 8) {
        return NextResponse.json({ error: "Cannot submit. Max 8 goals allowed." }, { status: 400 });
      }
      if (goals.length === 0) {
        return NextResponse.json({ error: "Cannot submit empty goal sheet." }, { status: 400 });
      }

      sheet.status = "submitted";
      sheet.totalWeightage = totalWeightage;
      await sheet.save();

      await createAuditLog({
        entityType: "GoalSheet",
        entityId: sheet._id,
        action: "status_changed",
        changedBy: session.userId,
        oldValue: oldStatus,
        newValue: "submitted",
      });

    } else if (action === "approve") {
      if (session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      
      sheet.status = "approved";
      sheet.locked = true;
      sheet.approvedAt = new Date();
      sheet.approvedBy = session.userId;
      await sheet.save();

      // Lock all associated goals
      await Goal.updateMany({ goalSheetId: id }, { $set: { locked: true } });

      await createAuditLog({
        entityType: "GoalSheet",
        entityId: sheet._id,
        action: "locked",
        changedBy: session.userId,
        oldValue: { status: oldStatus, locked: false },
        newValue: { status: "approved", locked: true },
      });

    } else if (action === "reject") {
      if (session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!rejectionReason) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });

      sheet.status = "rejected";
      sheet.rejectionReason = rejectionReason;
      await sheet.save();

      await createAuditLog({
        entityType: "GoalSheet",
        entityId: sheet._id,
        action: "status_changed",
        changedBy: session.userId,
        oldValue: oldStatus,
        newValue: "rejected",
      });

    } else if (action === "unlock") {
      if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

      sheet.status = "draft"; // Reset to draft
      sheet.locked = false;
      await sheet.save();

      // Unlock all associated goals
      await Goal.updateMany({ goalSheetId: id }, { $set: { locked: false } });

      await createAuditLog({
        entityType: "GoalSheet",
        entityId: sheet._id,
        action: "unlocked",
        changedBy: session.userId,
        oldValue: { status: oldStatus, locked: true },
        newValue: { status: "draft", locked: false },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: sheet }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
