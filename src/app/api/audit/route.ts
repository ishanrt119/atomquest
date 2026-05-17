import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const actionType = searchParams.get("actionType");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    
    const filter: any = {};
    if (entityType) filter.entityType = entityType;
    if (actionType) filter.actionType = actionType;

    const logs = await AuditLog.find(filter)
      .sort({ changedAt: -1 })
      .limit(limit)
      .populate("userId", "name email role")
      .lean();

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Audit API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
