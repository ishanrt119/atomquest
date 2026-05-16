"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { Target, CheckCircle2, TrendingUp, AlertCircle, Clock, Calendar, Users, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MOCK_GOALS = [
  { id: 1, title: "Launch Marketing Campaign V2", target: "10,000 Leads", achievement: "8,500 Leads", progress: 85, status: "On Track", weight: 40 },
  { id: 2, title: "Reduce Churn Rate by 2%", target: "4.5%", achievement: "5.1%", progress: 60, status: "At Risk", weight: 30 },
  { id: 3, title: "Complete Q3 Compliance Training", target: "100%", achievement: "100%", progress: 100, status: "Completed", weight: 30 },
];

const MOCK_ACTIVITIES = [
  { id: 1, text: "Manager Sarah approved your Q2 Check-in", time: "2 hours ago", type: "approval" },
  { id: 2, text: "You completed the goal 'Q3 Compliance Training'", time: "Yesterday", type: "completion" },
  { id: 3, text: "Commented on 'Reduce Churn Rate'", time: "3 days ago", type: "comment" },
];

export default function EmployeeDashboard() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* Welcome Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-8 rounded-2xl border border-primary/10"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Good Morning, Alice 👋</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            You're currently in the <strong>Q3 2026 Cycle</strong>. You have 1 check-in pending and your overall progress is looking strong.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">View Check-ins</Button>
          <Button>Update Goals</Button>
        </div>
      </motion.div>

      {/* Goal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Goals" value={5} icon={Target} delay={0.1} />
        <MetricCard title="Completed" value={2} icon={CheckCircle2} delay={0.2} trend="+1 this week" trendUp />
        <MetricCard title="In Progress" value={3} icon={TrendingUp} delay={0.3} />
        <MetricCard title="Completion %" value="78%" icon={AlertCircle} delay={0.4} trend="+5% from Q2" trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Goal Progress Section */}
          <DashboardCard title="Current Goals Overview" action={<Button variant="link">View All</Button>}>
            <div className="space-y-6">
              {MOCK_GOALS.map((goal, idx) => (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="group relative p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-base">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Weightage: {goal.weight}%</p>
                    </div>
                    <Badge variant={goal.status === 'Completed' ? 'default' : goal.status === 'At Risk' ? 'destructive' : 'secondary'}>
                      {goal.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{goal.achievement}</span>
                      <span className="font-medium text-muted-foreground">{goal.target}</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>

          {/* Performance Insights */}
          <DashboardCard title="Quarterly Progress Trend">
            <ProgressChart />
          </DashboardCard>

          {/* Shared Goals Section */}
          <DashboardCard title="Shared Department Goals">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 className="font-medium">Increase Platform Adoption</h5>
                  <p className="text-sm text-muted-foreground">Shared with: Marketing Team</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">65%</span>
                <p className="text-xs text-muted-foreground">Team Progress</p>
              </div>
            </div>
          </DashboardCard>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          
          {/* Upcoming Deadlines */}
          <DashboardCard title="Upcoming Deadlines">
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Calendar className="size-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-orange-900 dark:text-orange-200">Q3 Mid-Quarter Check-in</h5>
                  <p className="text-sm text-orange-700/80 dark:text-orange-300/80 mt-1">Due in 3 days</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Recent Activity */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-6">
              {MOCK_ACTIVITIES.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {idx !== MOCK_ACTIVITIES.length - 1 && (
                    <div className="absolute top-8 bottom-[-24px] left-[11px] w-px bg-border" />
                  )}
                  <div className="relative z-10 size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="size-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground">
              View Full History <ChevronRight className="size-3 ml-1" />
            </Button>
          </DashboardCard>

          {/* Quarterly Check-in Timeline */}
          <DashboardCard title="Cycle Timeline">
            <div className="space-y-4">
              {['Q1 (Completed)', 'Q2 (Completed)', 'Q3 (Active)', 'Q4 (Upcoming)'].map((q, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`size-3 rounded-full ${idx < 2 ? 'bg-primary' : idx === 2 ? 'bg-orange-500' : 'bg-muted'}`} />
                  <span className={`text-sm ${idx === 2 ? 'font-semibold' : 'text-muted-foreground'}`}>{q}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
          
        </div>
      </div>
    </div>
  );
}
