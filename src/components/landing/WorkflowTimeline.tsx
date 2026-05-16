"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Employee Drafts Goals",
    description: "Individuals define their objectives based on company OKRs.",
  },
  {
    step: "02",
    title: "Manager Approval",
    description: "Managers review, provide feedback, and approve the targets.",
  },
  {
    step: "03",
    title: "Quarterly Check-ins",
    description: "Regular updates ensure alignment and track ongoing progress.",
  },
  {
    step: "04",
    title: "HR Analytics",
    description: "Admins monitor organizational health and performance metrics.",
  },
];

export function WorkflowTimeline() {
  return (
    <section id="workflow" className="py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">A Seamless Workflow</h2>
          <p className="text-muted-foreground text-lg">
            From drafting to review, AtomQuest standardizes the performance lifecycle.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-border -z-10" />

          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="relative"
            >
              <div className="size-12 rounded-full border-4 border-background bg-muted flex items-center justify-center font-bold text-muted-foreground mb-6 shadow-sm">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
