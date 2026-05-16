"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { DistributionChart } from "@/components/analytics/DistributionChart";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { Users, FileSignature, AlertTriangle, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export function ManagerClient({ 
  firstName, 
  teamMembers,
  goalSheets = [],
  goals = [],
  activities = []
}: { 
  firstName: string;
  teamMembers: Array<{ id: string; name: string; designation: string }>;
  goalSheets?: any[];
  goals?: any[];
  activities?: any[];
}) {
  const pendingSheets = goalSheets.filter(s => s.status === "submitted");
  const approvedSheets = goalSheets.filter(s => s.status === "approved");
  const checkInsCompleted = approvedSheets.length + pendingSheets.length;

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const avgProgress = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // Calculate Distribution
  const distributionData: { [key: string]: number } = {};
  goals.forEach(g => {
    const area = g.thrustArea || "Uncategorized";
    distributionData[area] = (distributionData[area] || 0) + 1;
  });
  const chartData = Object.keys(distributionData).map(key => ({
    name: key,
    value: distributionData[key]
  }));

  return (
    <div className="space-y-8 pb-10">
      
      {/* Team Overview Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-2xl border"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Good Morning, {firstName} 👋</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              You manage a team of <strong>{teamMembers.length} members</strong>. You have {pendingSheets.length} pending goal sheets to review.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="default">Schedule Check-ins</Button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Team Members" value={teamMembers.length} icon={Users} delay={0.1} />
        <MetricCard title="Pending Approvals" value={pendingSheets.length} icon={FileSignature} delay={0.2} trend={pendingSheets.length > 0 ? "Action Needed" : "All Caught Up"} trendUp={pendingSheets.length === 0} />
        <MetricCard title="Check-ins Completed" value={`${checkInsCompleted}/${teamMembers.length}`} icon={CheckCircle} delay={0.3} />
        <MetricCard title="Avg. Goal Progress" value={`${avgProgress}%`} icon={TrendingUp} delay={0.4} trend="Based on status" trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Approval Queue */}
          <DashboardCard title="Approval Queue" description="Goals awaiting your review">
            <div className="space-y-4">
              {pendingSheets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground border rounded-xl bg-card">No pending approvals.</div>
              ) : pendingSheets.map((sheet) => {
                const emp = teamMembers.find(t => t.id === sheet.employeeId);
                return (
                  <div key={sheet._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">{emp?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="font-semibold text-sm">{emp?.name || "Unknown"}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">Submitted {sheet.quarter} Goal Sheet</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = "/manager/approvals"}>Review</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Employee Progress Table */}
          <DashboardCard title="Team Progress Tracker">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Goals</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => {
                    const sheet = goalSheets.find(s => s.employeeId === member.id);
                    const empGoals = goals.filter(g => g.employeeId === member.id);
                    const empCompleted = empGoals.filter(g => g.status === "completed").length;
                    const progress = empGoals.length === 0 ? 0 : Math.round((empCompleted / empGoals.length) * 100);
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="leading-none">{member.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{member.designation || "Software Engineer"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{empGoals.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="font-normal text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                            {sheet ? sheet.status : "No Sheet"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DashboardCard>

          {/* Team Performance Analytics */}
          <DashboardCard title="Team Performance Trend">
            <ProgressChart data={[{ name: "W1", progress: 10 }, { name: "W2", progress: avgProgress }]} />
          </DashboardCard>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          
          {/* Escalation Alerts */}
          <DashboardCard title="Escalation Alerts" className="border-destructive/30">
            <div className="space-y-4">
              {goalSheets.filter(s => s.status === "rejected").length > 0 ? (
                goalSheets.filter(s => s.status === "rejected").map(sheet => {
                  const emp = teamMembers.find(t => t.id === sheet.employeeId);
                  return (
                    <div key={sheet._id} className="flex gap-3 items-start p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                      <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-sm">Rejected Goal Sheet</h5>
                        <p className="text-xs mt-1 opacity-90">{emp?.name}'s {sheet.quarter} goals were rejected. Awaiting re-submission.</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground p-3">No active alerts.</p>
              )}
            </div>
          </DashboardCard>

          {/* Goal Distribution */}
          <DashboardCard title="Goal Distribution (By Area)">
            <DistributionChart data={chartData} />
          </DashboardCard>

          {/* Recent Team Activities */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((activity, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Action: {activity.action}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
