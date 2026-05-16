"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { DistributionChart } from "@/components/analytics/DistributionChart";
import {
  Users, FileSignature, AlertTriangle, TrendingUp,
  CheckCircle, Clock, RefreshCw, BarChart3, Target,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";

// ─── Progress colour helper ──────────────────────────────────────────────────
const progressColor = (p: number) => {
  if (p >= 100) return "text-primary";
  if (p >= 60) return "text-emerald-600";
  if (p >= 30) return "text-amber-600";
  return "text-rose-500";
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: "bg-primary/10 text-primary border-primary/20",
    exceeded: "bg-green-600/10 text-green-700 border-green-600/20",
    on_track: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    not_started: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    at_risk: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    submitted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    approved: "bg-primary/10 text-primary border-primary/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return map[status] || "bg-muted text-muted-foreground";
};

export function ManagerClient({
  firstName,
  teamMembers,
  goalSheets = [],
  checkins = [],
  activities = [],
  currentQuarter = "Q1",
}: {
  firstName: string;
  teamMembers: Array<{ id: string; name: string; designation: string }>;
  goalSheets?: any[];
  checkins?: any[];
  activities?: any[];
  currentQuarter?: string;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // ── Derived stats (all from CheckIn collection) ─────────────────────────
  const pendingSheets = goalSheets.filter((s) => s.status === "submitted");
  const rejectedSheets = goalSheets.filter((s) => s.status === "rejected");

  const submittedCheckins = checkins.filter((c) => c.checkinSubmitted);
  const reviewedCheckins = checkins.filter((c) => c.managerReviewed);
  const pendingReview = submittedCheckins.filter((c) => !c.managerReviewed);

  // Avg progress from real CheckIn progressPercentage
  const avgProgress =
    submittedCheckins.length === 0
      ? 0
      : Math.round(
          submittedCheckins.reduce((sum, c) => sum + (c.rawProgressPercentage || 0), 0) /
            submittedCheckins.length
        );

  // Per-employee aggregated progress from CheckIns
  const memberProgress = teamMembers.map((member) => {
    const empCheckins = checkins.filter(
      (c) => (typeof c.employeeId === "object" ? c.employeeId?._id : c.employeeId) === member.id
    );
    const submitted = empCheckins.filter((c) => c.checkinSubmitted);
    const avgProg =
      empCheckins.length === 0
        ? 0
        : Math.round(empCheckins.reduce((s, c) => s + (c.rawProgressPercentage || 0), 0) / empCheckins.length);
    const sheet = goalSheets.find((s) => s.employeeId === member.id);
    const latestStatus =
      empCheckins.length > 0
        ? empCheckins.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0].status
        : "not_started";
    return {
      ...member,
      avgProgress: avgProg,
      goalCount: empCheckins.length,
      submittedCount: submitted.length,
      sheetStatus: sheet?.status || "no_sheet",
      latestStatus,
      hasSubmitted: submitted.length > 0,
    };
  });

  // Distribution from checkin goal areas
  const personalDistribution: Record<string, number> = {};
  const sharedDistribution: Record<string, number> = {};
  
  checkins.forEach((c) => {
    if (c.goalId?.thrustArea) {
      const area = c.goalId.thrustArea;
      if (c.goalId.isSharedGoal) {
        sharedDistribution[area] = (sharedDistribution[area] || 0) + 1;
      } else {
        personalDistribution[area] = (personalDistribution[area] || 0) + 1;
      }
    }
  });
  
  const personalChartData = Object.entries(personalDistribution).map(([name, value]) => ({ name, value }));
  const sharedChartData = Object.entries(sharedDistribution).map(([name, value]) => ({ name, value }));

  // Handle refresh — re-run server component
  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/5 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Good Morning, {firstName} 👋</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              You manage <strong>{teamMembers.length} members</strong>. {currentQuarter} check-ins:{" "}
              <strong>{submittedCheckins.length}</strong> submitted,{" "}
              <strong>{pendingReview.length}</strong> awaiting your review.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh Data"}
            </Button>
            <Button size="sm" onClick={() => router.push("/manager/check-ins")}>
              <MessageSquare className="size-4 mr-2" /> Review Check-ins
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Metric Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Team Members" value={teamMembers.length} icon={Users} delay={0.1} />
        <MetricCard
          title="Pending Approvals"
          value={pendingSheets.length}
          icon={FileSignature}
          delay={0.2}
          trend={pendingSheets.length > 0 ? "Action Needed" : "All Caught Up"}
          trendUp={pendingSheets.length === 0}
        />
        <MetricCard
          title="Check-ins Submitted"
          value={`${submittedCheckins.length} goals`}
          icon={CheckCircle}
          delay={0.3}
          trend={`${reviewedCheckins.length} reviewed`}
          trendUp={reviewedCheckins.length > 0}
        />
        <MetricCard
          title={`Avg. ${currentQuarter} Progress`}
          value={`${avgProgress}%`}
          icon={TrendingUp}
          delay={0.4}
          trend="From actual check-ins"
          trendUp={avgProgress > 50}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Pending Review Alert */}
          {pendingReview.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                <p className="text-sm font-medium">
                  <strong>{pendingReview.length}</strong> submitted check-in{pendingReview.length > 1 ? "s" : ""} awaiting your review.
                </p>
              </div>
              <Button size="sm" onClick={() => router.push("/manager/check-ins")}>Review Now</Button>
            </div>
          )}

          {/* Approval Queue */}
          <DashboardCard title="Goal Sheet Approval Queue" description="Submitted goal sheets waiting for approval">
            <div className="space-y-3">
              {pendingSheets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground border rounded-xl bg-card text-sm">
                  No pending approvals.
                </div>
              ) : (
                pendingSheets.map((sheet) => {
                  const emp = teamMembers.find((t) => t.id === sheet.employeeId);
                  return (
                    <div
                      key={sheet._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {emp?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{emp?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted {sheet.quarter} Goal Sheet
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => router.push("/manager/approvals")}
                      >
                        Review
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </DashboardCard>

          {/* Team Progress Table — from real CheckIn data */}
          <DashboardCard title={`${currentQuarter} Team Progress`} description="Live achievement data from submitted check-ins">
            <div className="space-y-3">
              {memberProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No team members found.</p>
              ) : (
                memberProgress.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.designation}</p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 sm:max-w-[220px]">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{member.goalCount} goal{member.goalCount !== 1 ? "s" : ""}</span>
                        <span className={`font-bold tabular-nums ${progressColor(member.avgProgress)}`}>
                          {member.avgProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            member.avgProgress >= 100
                              ? "bg-primary"
                              : member.avgProgress >= 60
                              ? "bg-emerald-500"
                              : member.avgProgress >= 30
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, member.avgProgress)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(
                          member.hasSubmitted ? member.latestStatus : member.sheetStatus
                        )}`}
                      >
                        {member.hasSubmitted
                          ? member.latestStatus.replace("_", " ")
                          : member.sheetStatus.replace("_", " ")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push("/manager/check-ins")}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>

        {/* ── Right column (1/3) ───────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Escalations */}
          <DashboardCard title="Escalation Alerts" className="border-destructive/30">
            <div className="space-y-3">
              {rejectedSheets.length > 0 ? (
                rejectedSheets.map((sheet) => {
                  const emp = teamMembers.find((t) => t.id === sheet.employeeId);
                  return (
                    <div
                      key={sheet._id}
                      className="flex gap-3 items-start p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
                    >
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Rejected Goal Sheet</p>
                        <p className="text-xs mt-1 opacity-90">
                          {emp?.name}'s {sheet.quarter} goals were rejected. Awaiting re-submission.
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground p-2">No active alerts.</p>
              )}
            </div>
          </DashboardCard>

          {/* Goal distribution by thrust area */}
          {(personalChartData.length > 0 || sharedChartData.length > 0) && (
            <DashboardCard title="Goals by Thrust Area">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal KPIs</TabsTrigger>
                  <TabsTrigger value="shared">Shared Goals</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  <DistributionChart data={personalChartData} />
                </TabsContent>
                <TabsContent value="shared">
                  <DistributionChart data={sharedChartData} />
                </TabsContent>
              </Tabs>
            </DashboardCard>
          )}

          {/* Recent Activity */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((a: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium capitalize">{a.action?.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {a.timestamp ? format(new Date(a.timestamp), "dd/MM/yyyy, HH:mm:ss") : "—"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
