"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { DistributionChart } from "@/components/analytics/DistributionChart";
import { Building2, Activity, Database, AlertCircle, ShieldAlert, BarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_DEPTS = [
  { name: "Engineering", score: 85, active: 45 },
  { name: "Marketing", score: 92, active: 12 },
  { name: "Sales", score: 76, active: 28 },
  { name: "Human Resources", score: 88, active: 8 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* Organization Overview Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card p-8 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-4">
            Organization View
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Command Center</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Currently overseeing the <strong>Q3 2026</strong> goal cycle. System health is optimal.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Download className="size-4 mr-2" /> Export Global Report</Button>
          <Button>Manage Cycles</Button>
        </div>
      </motion.div>

      {/* Global Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Active Employees" value={284} icon={Building2} delay={0.1} />
        <MetricCard title="Org. Goal Completion" value="71%" icon={BarChart} delay={0.2} trend="+4.2% YoY" trendUp />
        <MetricCard title="Pending Final Approvals" value={14} icon={AlertCircle} delay={0.3} trend="Needs Attention" trendUp={false} />
        <MetricCard title="System API Health" value="99.9%" icon={Activity} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Org Analytics with Tabs */}
          <DashboardCard title="Organization Analytics">
            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="trends">Quarterly Trends</TabsTrigger>
                <TabsTrigger value="departments">Department Comparison</TabsTrigger>
              </TabsList>
              <TabsContent value="trends" className="space-y-4">
                <ProgressChart />
              </TabsContent>
              <TabsContent value="departments">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  (Bar Chart Representation Here)
                </div>
              </TabsContent>
            </Tabs>
          </DashboardCard>

          {/* Department Performance Table */}
          <DashboardCard title="Department Health Matrix" action={<Button variant="ghost" size="sm">View All</Button>}>
            <div className="space-y-6">
              {MOCK_DEPTS.map((dept, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="w-1/3">
                    <h5 className="font-medium text-sm">{dept.name}</h5>
                    <p className="text-xs text-muted-foreground">{dept.active} Active Goal Sheets</p>
                  </div>
                  <div className="w-1/2 flex items-center gap-3">
                    <Progress value={dept.score} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-10 text-right">{dept.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Audit Logs Preview */}
          <DashboardCard title="System Audit Logs" action={<Button variant="link">Full Log</Button>}>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">10:45 AM</span>
                <span className="flex-1 px-4">User [Admin] modified 'Q3 Cycle Dates'</span>
                <Badge variant="outline">SYSTEM</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">09:12 AM</span>
                <span className="flex-1 px-4">Goal #482 force-closed by Manager</span>
                <Badge variant="outline">ACTION</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">08:00 AM</span>
                <span className="flex-1 px-4">Automated Backup Completed</span>
                <Badge variant="outline" className="text-green-600 bg-green-100">SUCCESS</Badge>
              </div>
            </div>
          </DashboardCard>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          
          {/* Cycle Management Status */}
          <DashboardCard title="Active Cycle Status">
            <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-primary">Q3 2026</h4>
                <Badge>Active</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">Jul 1, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">Sep 30, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mid-Q Check-in</span>
                  <span className="font-medium text-orange-600">Aug 15, 2026</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">Lock Editing</Button>
            </div>
          </DashboardCard>

          {/* Escalation Monitoring */}
          <DashboardCard title="Global Escalations" className="border-destructive/30">
            <div className="space-y-4">
              <div className="flex gap-3 items-start p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm">Compliance Violation Risk</h5>
                  <p className="text-xs mt-1 opacity-90">12 mandatory HR goals unacknowledged across Engineering.</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* System Health */}
          <DashboardCard title="Infrastructure">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-green-100 flex items-center justify-center">
                  <Database className="size-4 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">MongoDB Atlas</p>
                  <p className="text-xs text-muted-foreground">Latency: 12ms</p>
                </div>
                <div className="size-2 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-green-100 flex items-center justify-center">
                  <Activity className="size-4 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Next.js API Routes</p>
                  <p className="text-xs text-muted-foreground">Error Rate: 0.01%</p>
                </div>
                <div className="size-2 rounded-full bg-green-500" />
              </div>
            </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
