import { Suspense } from "react";
import UserManagementClient from "./UserManagementClient";

export const metadata = {
  title: "User Provisioning | Admin | AtomQuest",
};

export default function UserManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Onboarding & Provisioning</h1>
        <p className="text-muted-foreground mt-2">
          Centrally manage employee and manager accounts, control access, and send invitations.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading users...</div>}>
        <UserManagementClient />
      </Suspense>
    </div>
  );
}
