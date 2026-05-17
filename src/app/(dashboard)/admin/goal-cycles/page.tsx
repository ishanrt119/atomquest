import { Suspense } from "react";
import GoalCycleClient from "./GoalCycleClient";

export const metadata = {
  title: "Goal Cycles | Admin | AtomQuest",
};

export default function GoalCyclesPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Goal Cycle Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure quarterly windows, enforce goal-setting periods, and manage timeline overrides.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading cycles...</div>}>
        <GoalCycleClient />
      </Suspense>
    </div>
  );
}
