"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BarChart3, Briefcase, CheckCircle2, LayoutDashboard, Target, Users, ShieldCheck } from "lucide-react";

// Replicating NAV_CONFIG for Mobile to avoid circular deps with Sidebar easily
const NAV_CONFIG = {
  employee: [
    { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { name: "My Goals", href: "/employee/goals", icon: Target },
    { name: "Check-ins", href: "/employee/check-ins", icon: CheckCircle2 },
  ],
  manager: [
    { name: "Dashboard", href: "/manager", icon: LayoutDashboard },
    { name: "Team Goals", href: "/manager/team-goals", icon: Target },
    { name: "Approvals", href: "/manager/approvals", icon: CheckCircle2 },
  ],
  admin: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Goal Cycles", href: "/admin/cycles", icon: Target },
  ]
};

export function MobileDrawer() {
  const pathname = usePathname();
  let currentRole: "employee" | "manager" | "admin" = "employee";
  if (pathname.startsWith("/manager")) currentRole = "manager";
  if (pathname.startsWith("/admin")) currentRole = "admin";

  const links = NAV_CONFIG[currentRole];

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-semibold text-lg tracking-tight block leading-tight">AtomQuest</span>
          </div>
        </div>
        <div className="flex-1 py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {link.name}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
