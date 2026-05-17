import { NextResponse } from "next/server";
import { updateCycle, activateCycle, applyAdminOverride } from "@/services/cycle/cycleValidationService";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { GoalCycle } from "@/models/GoalCycle";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { action, ...cycleData } = data;
    await connectToDatabase();

    let result;
    if (action === "ACTIVATE") {
      result = await activateCycle(id, session.id);
    } else if (action === "OVERRIDE") {
      result = await applyAdminOverride(id, cycleData.adminOverride, session.id);
    } else {
      result = await updateCycle(id, cycleData, session.id);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating cycle:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    await GoalCycle.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
