"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { Target, CheckCircle2, TrendingUp, AlertCircle, Clock, Calendar, Users, ChevronRight, Inbox } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

export function EmployeeClient({ 
  firstName, 
  sheet, 
  goals, 
  sharedGoals, 
  activities,
  quarter,
  year 
}: { 
  firstName: string, 
  sheet: any, 
  goals: any[], 
  sharedGoals: any[], 
  activities: any[],
  quarter: string,
  year: number 
}) {
  
  // Calculate dynamic metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === "completed" || g.status === "exceeded").length;
  const inProgressGoals = goals.filter(g => g.status === "on_track" || g.status === "at_risk").length;
  
  // Weighted average progress using standardized fields
  const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  const completionPercentage = totalWeightage === 0 ? 0 : Math.round(
    goals.reduce((sum, g) => sum + ((g.displayProgressPercentage ?? 0) * (g.weightage || 0)), 0) / totalWeightage
  );

  // Format activities
  const formatActivityText = (act: any) => {
    if (act.action === "created") return "Created a new entry.";
    if (act.action === "updated") return "Updated an entry.";
    if (act.action === "status_changed") return `Status changed to ${act.newValue}.`;
    if (act.action === "locked") return "Goals have been approved and locked.";
    if (act.action === "unlocked") return "Goals have been unlocked.";
    return "Performed an action.";
  };

  const renderTarget = (g: any) => {
    if (g.uomType === "timeline" && g.targetDate) {
      return format(new Date(g.targetDate), "MMM d, yyyy");
    }
    if (g.uomType === "percentage") {
      return `${g.targetValue ?? 0}%`;
    }
    return g.targetValue ?? 0;
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Welcome Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-8 rounded-2xl border border-primary/10"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Good Morning, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            You're currently in the <strong>{quarter} {year} Cycle</strong>.
            {sheet ? ` Your goal sheet is currently ${sheet.status}.` : " You haven't created your goals yet."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/employee/check-ins">
            <Button variant="outline">View Check-ins</Button>
          </Link>
          <Link href="/employee/goals">
            <Button>Update Goals</Button>
          </Link>
        </div>
      </motion.div>

      {/* Goal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Goals" value={totalGoals} icon={Target} delay={0.1} />
        <MetricCard title="Completed" value={completedGoals} icon={CheckCircle2} delay={0.2} />
        <MetricCard title="In Progress" value={inProgressGoals} icon={TrendingUp} delay={0.3} />
        <MetricCard title="Completion %" value={`${completionPercentage}%`} icon={AlertCircle} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Goal Progress Section */}
          <DashboardCard title="Current Goals Overview" action={<Link href="/employee/goals"><Button variant="link">View All</Button></Link>}>
            <div className="space-y-6">
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 rounded-xl border border-dashed">
                  <Inbox className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">You have no goals defined for this quarter.</p>
                  <Link href="/employee/goals" className="mt-4">
                    <Button variant="outline" size="sm">Create Goals</Button>
                  </Link>
                </div>
              ) : (
                goals.map((goal, idx) => (
                  <motion.div 
                    key={goal._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    className="group relative p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{goal.title}</h4>
                          {goal.isSharedGoal && <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500">Shared</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Weightage: {goal.weightage}% | Target: {renderTarget(goal)}</p>
                      </div>
                      <Badge variant={goal.status === 'completed' ? 'default' : goal.status === 'not_started' ? 'secondary' : 'outline'}>
                        {goal.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </DashboardCard>

          {/* Performance Insights */}
          <DashboardCard title="Quarterly Progress Trend">
            <ProgressChart data={[{ name: "Week 1", progress: 10 }, { name: "Week 2", progress: 25 }, { name: "Week 3", progress: 45 }, { name: "Week 4", progress: 50 }, { name: "Week 5", progress: 65 }, { name: "Week 6", progress: 72 }, { name: "Week 7", progress: 85 }, { name: "Week 8", progress: 92 }]} />
          </DashboardCard>

          {/* Shared Goals Section */}
          <DashboardCard title="Shared Department Goals">
            <div className="space-y-4">
              {sharedGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No shared goals assigned to you.</p>
                </div>
              ) : (
                sharedGoals.map((sg) => (
                  <div key={sg._id} className="flex items-center justify-between p-4 border rounded-xl bg-blue-50/30">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-medium">{sg.title}</h5>
                        <p className="text-sm text-muted-foreground">Target: {renderTarget(sg)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                  <h5 className="font-medium text-orange-900 dark:text-orange-200">{quarter} Submission Deadline</h5>
                  <p className="text-sm text-orange-700/80 dark:text-orange-300/80 mt-1">Check company schedule</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Recent Activity */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-6">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                activities.map((activity, idx) => (
                  <div key={activity._id} className="flex gap-4 relative">
                    {idx !== activities.length - 1 && (
                      <div className="absolute top-8 bottom-[-24px] left-[11px] w-px bg-border" />
                    )}
                    <div className="relative z-10 size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="size-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{formatActivityText(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          {/* Quarterly Check-in Timeline */}
          <DashboardCard title="Cycle Timeline">
            <div className="space-y-4">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
                const isCurrent = q === quarter;
                const isPast = parseInt(q.replace('Q','')) < parseInt(quarter.replace('Q',''));
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${isPast ? 'bg-primary' : isCurrent ? 'bg-orange-500' : 'bg-muted'}`} />
                    <span className={`text-sm ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {q} {isPast ? '(Completed)' : isCurrent ? '(Active)' : '(Upcoming)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
          
        </div>
      </div>
    </div>
  );
}
