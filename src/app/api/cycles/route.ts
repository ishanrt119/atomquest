import { NextResponse } from "next/server";
import { createCycle } from "@/services/cycle/cycleValidationService";
import { getCurrentUser } from "@/lib/session";
import { GoalCycle } from "@/models/GoalCycle";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const cycles = await GoalCycle.find().sort({ cycleYear: -1 }).populate("createdBy", "name email");

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await connectToDatabase();

    const newCycle = await createCycle(data, session.id);
    
    return NextResponse.json(newCycle, { status: 201 });
  } catch (error: any) {
    console.error("Error creating cycle:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
