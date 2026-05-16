"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { DistributionChart } from "@/components/analytics/DistributionChart";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { Users, FileSignature, AlertTriangle, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const MOCK_TEAM = [
  { id: 1, name: "Alice Smith", goals: 5, progress: 78, status: "On Track", lastUpdate: "2h ago", avatar: "AS" },
  { id: 2, name: "David Chen", goals: 4, progress: 45, status: "At Risk", lastUpdate: "3d ago", avatar: "DC" },
  { id: 3, name: "Emma Watson", goals: 6, progress: 92, status: "Ahead", lastUpdate: "1h ago", avatar: "EW" },
  { id: 4, name: "James Bond", goals: 3, progress: 60, status: "On Track", lastUpdate: "1d ago", avatar: "JB" },
];

export default function ManagerDashboard() {
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Overview</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              You manage a team of <strong>12 members</strong>. Team goal completion is tracking well for Q3.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="default">Schedule Check-ins</Button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Team Members" value={12} icon={Users} delay={0.1} />
        <MetricCard title="Pending Approvals" value={3} icon={FileSignature} delay={0.2} trend="Action Needed" trendUp={false} />
        <MetricCard title="Check-ins Completed" value="8/12" icon={CheckCircle} delay={0.3} />
        <MetricCard title="Avg. Goal Progress" value="68%" icon={TrendingUp} delay={0.4} trend="+2% this week" trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Approval Queue */}
          <DashboardCard title="Approval Queue" description="Goals awaiting your review">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">DC</AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-semibold text-sm">David Chen</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted Q3 Goal Sheet</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8">Review</Button>
                    <Button variant="default" size="sm" className="h-8">Approve All</Button>
                  </div>
                </div>
              ))}
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
                {MOCK_TEAM.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{member.goals}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <Progress value={member.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{member.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={member.status === 'At Risk' ? 'destructive' : member.status === 'Ahead' ? 'default' : 'secondary'} className="font-normal">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardCard>

          {/* Team Performance Analytics */}
          <DashboardCard title="Team Performance Trend">
            <ProgressChart />
          </DashboardCard>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          
          {/* Escalation Alerts */}
          <DashboardCard title="Escalation Alerts" className="border-destructive/30">
            <div className="space-y-4">
              <div className="flex gap-3 items-start p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm">Delayed Check-in</h5>
                  <p className="text-xs mt-1 opacity-90">David Chen is 4 days late on Q3 Mid-Quarter check-in.</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Goal Distribution */}
          <DashboardCard title="Goal Distribution (By Area)">
            <DistributionChart />
          </DashboardCard>

          {/* Recent Team Activities */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-4">
              {['Emma Watson completed a goal', 'James Bond updated progress to 60%', 'Alice Smith drafted Q4 goals'].map((activity, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{activity}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
