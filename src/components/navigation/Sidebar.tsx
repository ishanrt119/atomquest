"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Briefcase, 
  CheckCircle2, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Target, 
  Users 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Unified Configuration
const NAV_CONFIG = {
  employee: [
    { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { name: "My Goals", href: "/employee/goals", icon: Target },
    { name: "Check-ins", href: "/employee/check-ins", icon: CheckCircle2 },
    { name: "Shared Goals", href: "/employee/shared", icon: Users },
    { name: "Performance", href: "/employee/performance", icon: BarChart3 },
  ],
  manager: [
    { name: "Dashboard", href: "/manager", icon: LayoutDashboard },
    { name: "Team Goals", href: "/manager/team-goals", icon: Target },
    { name: "Approvals", href: "/manager/approvals", icon: CheckCircle2 },
    { name: "Check-ins", href: "/manager/check-ins", icon: Briefcase },
    { name: "Team Analytics", href: "/manager/analytics", icon: BarChart3 },
  ],
  admin: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Goal Cycles", href: "/admin/cycles", icon: Target },
    { name: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ]
};

export function Sidebar() {
  const pathname = usePathname();
  
  // Determine role based on URL for demo purposes. 
  // In a real app, this comes from a Session Provider.
  let currentRole: "employee" | "manager" | "admin" = "employee";
  if (pathname.startsWith("/manager")) currentRole = "manager";
  if (pathname.startsWith("/admin")) currentRole = "admin";

  const links = NAV_CONFIG[currentRole];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <div>
          <span className="font-semibold text-lg tracking-tight block leading-tight">AtomQuest</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{currentRole}</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Main Menu
          </div>
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
      </ScrollArea>

      <div className="p-4 border-t">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
