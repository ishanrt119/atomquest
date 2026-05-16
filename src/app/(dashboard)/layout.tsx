import { Sidebar } from "@/components/navigation/Sidebar";
import { TopNav } from "@/components/navigation/TopNav";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar userRole={user.role} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav user={user} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
