import { getCurrentUser } from "@/lib/session";
import { ManagerClient } from "./ManagerClient";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

export default async function ManagerDashboard() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const firstName = user.name.split(" ")[0] || "Manager";

  await connectToDatabase();
  // Fetch real team members from the users collection
  const employees = await User.find({ role: "employee" }).lean();
  
  const formattedMembers = employees.map(emp => ({
    id: emp._id.toString(),
    name: emp.name,
    designation: emp.designation || "Software Engineer",
  }));

  return <ManagerClient firstName={firstName} teamMembers={formattedMembers} />;
}
