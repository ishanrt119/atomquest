import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import { CheckInClient } from "./CheckInClient";

export default async function EmployeeCheckInsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") redirect("/login");

  await connectToDatabase();

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quarterly Check-ins</h1>
        <p className="text-muted-foreground mt-2">
          Track your achievements and submit your progress for manager review.
        </p>
      </div>

      <CheckInClient userId={user.id} />
    </div>
  );
}
