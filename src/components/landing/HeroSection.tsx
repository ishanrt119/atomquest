"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-muted/50 text-muted-foreground">
            <span className="flex size-2 rounded-full bg-primary mr-2" />
            Introducing AtomQuest 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Transform Organizational <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Goal Tracking
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Modernize employee performance management with real-time KPI tracking, quarterly check-ins, and actionable leadership insights.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Free Trial <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Explore Features
            </Button>
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-2xl border bg-background/50 backdrop-blur-xl p-2 shadow-soft-2xl">
            <div className="rounded-xl overflow-hidden border bg-card">
              {/* Mockup Header */}
              <div className="h-12 border-b flex items-center px-4 gap-2 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-destructive/80" />
                  <div className="size-3 rounded-full bg-orange-400" />
                  <div className="size-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 h-6 w-64 bg-background rounded-md border text-xs flex items-center px-2 text-muted-foreground">
                  atomquest.app/dashboard
                </div>
              </div>
              {/* Mockup Content */}
              <div className="h-[400px] bg-background p-8 flex gap-6">
                {/* Sidebar */}
                <div className="w-48 space-y-4">
                  <div className="h-8 w-full bg-muted rounded-md" />
                  <div className="h-8 w-3/4 bg-muted/50 rounded-md" />
                  <div className="h-8 w-4/5 bg-muted/50 rounded-md" />
                  <div className="h-8 w-2/3 bg-muted/50 rounded-md" />
                </div>
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-muted rounded-md" />
                    <div className="h-10 w-32 bg-primary rounded-md" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 rounded-xl border bg-card p-4 flex flex-col justify-between">
                      <Target className="size-6 text-primary" />
                      <div className="space-y-2">
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="h-6 w-3/4 bg-foreground/10 rounded" />
                      </div>
                    </div>
                    <div className="h-32 rounded-xl border bg-card p-4 flex flex-col justify-between">
                      <BarChart3 className="size-6 text-primary" />
                      <div className="space-y-2">
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="h-6 w-3/4 bg-foreground/10 rounded" />
                      </div>
                    </div>
                    <div className="h-32 rounded-xl border bg-card p-4 flex flex-col justify-between">
                      <div className="size-6 rounded bg-primary/20" />
                      <div className="space-y-2">
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="h-6 w-3/4 bg-foreground/10 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
