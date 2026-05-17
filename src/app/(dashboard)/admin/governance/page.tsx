import { Suspense } from "react";
import AuditClient from "./AuditClient";

export const metadata = {
  title: "Governance & Audit Trail | Admin | AtomQuest",
};

export default function GovernancePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Governance & Audit Trail</h1>
        <p className="text-muted-foreground mt-2">
          Immutable logging of system modifications, overrides, and goal status changes.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading audit trails...</div>}>
        <AuditClient />
      </Suspense>
    </div>
  );
}
