import { getCurrentUser } from "@/lib/session";
import { AdminClient } from "./AdminClient";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Team } from "@/models/Team";
import { GoalSheet } from "@/models/GoalSheet";
import { SharedGoal } from "@/models/SharedGoal";
import { AuditLog } from "@/models/AuditLog";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  await connectToDatabase();
  
  const activeEmployeesCount = await User.countDocuments({ role: "employee", isActive: true });
  const activeManagersCount = await User.countDocuments({ role: "manager", isActive: true });
  const totalTeams = await Team.countDocuments();
  
  const pendingApprovals = await GoalSheet.countDocuments({ status: "submitted" });
  const activeGoalSheets = await GoalSheet.countDocuments({ status: { $in: ["submitted", "approved", "in_progress"] } });
  
  const sharedGoalsCount = await SharedGoal.countDocuments();

  const auditLogsRaw = await AuditLog.find().sort({ timestamp: -1 }).limit(5).lean();
  const auditLogs = JSON.parse(JSON.stringify(auditLogsRaw));

  return (
    <AdminClient 
      metrics={{
        activeEmployeesCount,
        activeManagersCount,
        totalTeams,
        pendingApprovals,
        activeGoalSheets,
        sharedGoalsCount,
      }}
      auditLogs={auditLogs}
    />
  );
}
