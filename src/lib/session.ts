import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "admin";
  designation?: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload || !payload.userId) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(payload.userId).lean() as IUser;
    
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as "employee" | "manager" | "admin",
      designation: user.designation,
    };
  } catch (error) {
    console.error("[Session] Error fetching user:", error);
    return null;
  }
}
