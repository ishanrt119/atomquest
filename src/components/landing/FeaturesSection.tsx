"use client";

import { motion } from "framer-motion";
import { CheckCircle2, LayoutDashboard, ShieldCheck, Target, TrendingUp, Users } from "lucide-react";

const features = [
  {
    title: "Goal Creation",
    description: "Intuitively draft, align, and set objectives with clarity and precision.",
    icon: Target,
  },
  {
    title: "Quarterly Tracking",
    description: "Stay on top of performance with built-in check-ins and quarterly review cycles.",
    icon: TrendingUp,
  },
  {
    title: "Manager Reviews",
    description: "Streamline the review process with threaded feedback and approval workflows.",
    icon: CheckCircle2,
  },
  {
    title: "Shared Goals",
    description: "Foster team alignment by linking individual OKRs to organizational metrics.",
    icon: Users,
  },
  {
    title: "Analytics Dashboard",
    description: "Visualize completion rates and bottlenecks through interactive data insights.",
    icon: LayoutDashboard,
  },
  {
    title: "Audit Logs",
    description: "Maintain a secure history of all goal modifications and status changes.",
    icon: ShieldCheck,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need to Scale Performance</h2>
          <p className="text-muted-foreground text-lg">
            Purpose-built tools designed to make OKR tracking and performance management frictionless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all group"
            >
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
