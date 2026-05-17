import { Suspense } from "react";
import ReportsClient from "./ReportsClient";

export const metadata = {
  title: "Reports & Exports | Admin | AtomQuest",
};

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Reporting</h1>
        <p className="text-muted-foreground mt-2">
          Generate, filter, and export performance achievement reports.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading reports...</div>}>
        <ReportsClient />
      </Suspense>
    </div>
  );
}
