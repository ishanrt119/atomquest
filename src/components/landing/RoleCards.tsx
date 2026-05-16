"use client";

import { motion } from "framer-motion";
import { Briefcase, Settings, User } from "lucide-react";

export function RoleCards() {
  const roles = [
    {
      title: "Employee",
      icon: User,
      description: "Focus on your personal growth, track daily progress, and request feedback from peers.",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Manager",
      icon: Briefcase,
      description: "Approve goals, conduct check-ins, and ensure your team stays aligned with company targets.",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Administrator",
      icon: Settings,
      description: "Manage system settings, oversee audit logs, and access high-level organizational analytics.",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <section id="roles" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Role-Based Access</h2>
          <p className="text-muted-foreground text-lg">
            Tailored experiences depending on your position in the organization.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border bg-card p-8 shadow-sm flex flex-col items-center text-center"
            >
              <div className={`size-16 rounded-full ${role.color} flex items-center justify-center mb-6`}>
                <role.icon className="size-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">{role.title}</h3>
              <p className="text-muted-foreground">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
