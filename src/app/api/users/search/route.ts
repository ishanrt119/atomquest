import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyJWT(token);
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const unassignedOnly = searchParams.get("unassigned") === "true";
    const role = searchParams.get("role");

    await connectToDatabase();

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } }
      ];
    }

    if (unassignedOnly) {
      query.$or = [
        ...(query.$or || []),
        { teamId: null },
        { teamId: { $exists: false } }
      ];
    }
    
    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ["employee", "manager"] };
    }

    const users = await User.find(query)
      .select("name email role designation teamId managerId isActive")
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
