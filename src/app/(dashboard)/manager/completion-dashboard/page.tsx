import { Suspense } from "react";
import CompletionClient from "./CompletionClient";

export const metadata = {
  title: "Completion Dashboard | Manager | AtomQuest",
};

export default function CompletionDashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Real-time Completion Status</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your team's quarterly check-in submission and review progress.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading dashboard...</div>}>
        <CompletionClient />
      </Suspense>
    </div>
  );
}
