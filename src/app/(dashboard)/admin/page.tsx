import { getCurrentUser } from "@/lib/session";
import { AdminClient } from "./AdminClient";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  await connectToDatabase();
  // Fetch real count of active employees from the database
  const activeEmployeesCount = await User.countDocuments({ role: "employee", isActive: true });

  return <AdminClient activeEmployeesCount={activeEmployeesCount} />;
}
