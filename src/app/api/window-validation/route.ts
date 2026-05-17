import { NextResponse } from "next/server";
import { validateActionAccess, ActionType } from "@/services/cycle/windowAccessService";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, employeeId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const targetEmployeeId = employeeId || session.id;
    const validation = await validateActionAccess(action as ActionType, targetEmployeeId);

    return NextResponse.json(validation);
  } catch (error) {
    console.error("Error validating window access:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
