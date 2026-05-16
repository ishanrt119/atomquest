"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, ChevronDown, ChevronRight, MessageSquare,
  User as UserIcon, RefreshCw, Loader2, AlertTriangle,
  TrendingUp, Target, BarChart3, Clock
} from "lucide-react";
import { format } from "date-fns";

// ─── Status helpers ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; cls: string }> = {
  not_started: { label: "Not Started", cls: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  at_risk: { label: "At Risk", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  on_track: { label: "On Track", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  completed: { label: "Completed", cls: "bg-primary/10 text-primary border-primary/20" },
  exceeded: { label: "Exceeded Target", cls: "bg-green-600/10 text-green-700 border-green-600/20" },
};

const progressColor = (p: number) => {
  if (p >= 100) return "bg-primary";
  if (p >= 60) return "bg-emerald-500";
  if (p >= 30) return "bg-amber-500";
  return "bg-rose-500";
};

export function ManagerReviewClient({
  managerId,
  teamMembers,
}: {
  managerId: string;
  teamMembers: any[];
}) {
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [allCheckins, setAllCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Fetch quarter ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/checkins/active-quarter")
      .then((r) => r.json())
      .then((d) => setActiveQuarter(d.activeQuarter))
      .catch(console.error);
  }, []);

  // ── Fetch ALL team check-ins via the new dedicated endpoint ────────────
  const fetchTeamCheckins = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/manager/team-checkins?quarter=${activeQuarter}`);
      const data = await res.json();
      if (data.success) {
        setAllCheckins(data.data.checkins || []);
      }
    } catch (err) {
      console.error("Failed to load team check-ins", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeQuarter]);

  useEffect(() => {
    if (activeQuarter) fetchTeamCheckins();
  }, [activeQuarter, fetchTeamCheckins]);

  // ── Derive checkins for selected employee ────────────────────────────────
  const employeeCheckins = selectedEmployee
    ? allCheckins.filter((c) => {
        const empId = typeof c.employeeId === "object" ? c.employeeId?._id : c.employeeId;
        return empId === selectedEmployee;
      })
    : [];

  // Manager sees all check-ins — submitted and drafts
  const submittedCheckins = employeeCheckins.filter((c) => c.checkinSubmitted);

  const teamAverageProgress =
    submittedCheckins.length > 0
      ? Math.round(
          submittedCheckins.reduce((sum, c) => sum + (c.rawProgressPercentage || 0), 0) /
            submittedCheckins.length
        )
      : 0;

  // ── Per-member summary for sidebar ───────────────────────────────────────
  const getMemberSummary = (memberId: string) => {
    const empCheckins = allCheckins.filter((c) => {
      const empId = typeof c.employeeId === "object" ? c.employeeId?._id : c.employeeId;
      return empId === memberId;
    });
    const submitted = empCheckins.filter((c) => c.checkinSubmitted);
    const avgProg =
      submitted.length > 0
        ? Math.round(submitted.reduce((s, c) => s + (c.rawProgressPercentage || 0), 0) / submitted.length)
        : 0;
    const pending = submitted.filter((c) => !c.managerReviewed).length;
    return { submittedCount: submitted.length, avgProgress: avgProg, pendingReview: pending };
  };

  // ── Comment update ───────────────────────────────────────────────────────
  const handleCommentChange = (id: string, comment: string) => {
    setAllCheckins((prev) => prev.map((c) => (c._id === id ? { ...c, managerComment: comment } : c)));
  };

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Save reviews ─────────────────────────────────────────────────────────
  const handleSaveReviews = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const reviews = submittedCheckins.map((c) => ({
        checkInId: c._id,
        managerComment: c.managerComment || "",
      }));

      const res = await fetch("/api/checkins/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee, quarter: activeQuarter, reviews }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic: mark reviewed in local state
      setAllCheckins((prev) =>
        prev.map((c) => {
          const empId = typeof c.employeeId === "object" ? c.employeeId?._id : c.employeeId;
          if (empId === selectedEmployee && c.checkinSubmitted) {
            return { ...c, managerReviewed: true };
          }
          return c;
        })
      );
      setSuccessMsg("Reviews saved and employee notified.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Quarter + refresh header ───────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-sm font-semibold">
            {activeQuarter}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {allCheckins.filter((c) => c.checkinSubmitted).length} submitted check-ins across {teamMembers.length} members
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTeamCheckins(true)}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* ── Global messages ────────────────────────────────────────────── */}
      {(successMsg || errorMsg) && (
        <div className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium border ${successMsg ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
          {successMsg ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
          {successMsg || errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ── Sidebar: Team List ──────────────────────────────────────── */}
        <div className="md:col-span-1 border rounded-2xl bg-card overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Team Members</h3>
          </div>
          <div className="divide-y">
            {teamMembers.map((emp) => {
              const summary = getMemberSummary(emp._id);
              return (
                <button
                  key={emp._id}
                  onClick={() => setSelectedEmployee(emp._id)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedEmployee === emp._id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{emp.email}</p>
                    </div>
                    <ChevronRight className={`size-4 shrink-0 ml-2 ${selectedEmployee === emp._id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  {summary.submittedCount > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">{summary.submittedCount} submitted</span>
                        <span className="font-semibold">{summary.avgProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progressColor(summary.avgProgress)}`}
                          style={{ width: `${Math.min(100, summary.avgProgress)}%` }}
                        />
                      </div>
                      {summary.pendingReview > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                          <AlertTriangle className="size-2.5" /> {summary.pendingReview} pending review
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {teamMembers.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No team members assigned.
              </div>
            )}
          </div>
        </div>

        {/* ── Main Panel ─────────────────────────────────────────────── */}
        <div className="md:col-span-3 space-y-4">
          {!selectedEmployee ? (
            <div className="h-64 flex items-center justify-center border border-dashed rounded-2xl">
              <div className="text-center">
                <BarChart3 className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Select a team member to review their check-ins.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="h-64 flex items-center justify-center border rounded-2xl bg-card">
              <Loader2 className="size-6 border-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Employee summary header */}
              <div className="p-5 border rounded-2xl bg-card flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {teamMembers.find((t) => t._id === selectedEmployee)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{activeQuarter} Check-in Review</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Avg Progress</p>
                    <p className="text-2xl font-bold text-primary">{teamAverageProgress}%</p>
                    <p className="text-[10px] text-muted-foreground">from {submittedCheckins.length} check-ins</p>
                  </div>
                  {submittedCheckins.length > 0 && (
                    <Button onClick={handleSaveReviews} disabled={saving} size="sm">
                      {saving ? (
                        <><Loader2 className="size-4 mr-2 animate-spin" /> Saving…</>
                      ) : (
                        <><CheckCircle2 className="size-4 mr-2" /> Complete Review</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Check-in cards */}
              {submittedCheckins.length === 0 ? (
                <div className="p-10 border border-dashed rounded-2xl text-center bg-muted/5">
                  <Clock className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    This employee has not submitted their {activeQuarter} check-in yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submittedCheckins.map((checkin) => {
                    const isExpanded = !!expandedRows[checkin._id];
                    const sc = statusConfig[checkin.status] || statusConfig.not_started;
                    return (
                      <div key={checkin._id} className="border rounded-2xl bg-card overflow-hidden">

                        {/* Collapsed row */}
                        <button
                          onClick={() => toggleRow(checkin._id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-4 text-left flex-1 min-w-0">
                            {isExpanded
                              ? <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                              : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{checkin.goalId?.title || "Goal"}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                                  {sc.label}
                                </span>
                                {checkin.managerReviewed && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold">
                                    <CheckCircle2 className="size-2.5" /> Reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-3 shrink-0">
                            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressColor(checkin.displayProgressPercentage || 0)}`}
                                style={{ width: `${checkin.displayProgressPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold tabular-nums w-10 text-right">
                              {checkin.rawProgressPercentage || 0}%
                            </span>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="p-5 border-t bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              {/* Target vs Actual */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-card border rounded-xl">
                                  <p className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1 mb-1.5">
                                    <Target className="size-3" /> Planned
                                  </p>
                                  <p className="font-bold text-lg">
                                    {checkin.goalId?.uomType === "timeline"
                                      ? checkin.plannedTargetDate
                                        ? format(new Date(checkin.plannedTargetDate), "dd MMM yy")
                                        : "—"
                                      : checkin.plannedTargetValue ?? "—"}
                                  </p>
                                </div>
                                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                  <p className="text-[10px] text-primary font-semibold uppercase flex items-center gap-1 mb-1.5">
                                    <TrendingUp className="size-3" /> Actual
                                  </p>
                                  <p className="font-bold text-lg text-primary">
                                    {checkin.goalId?.uomType === "timeline"
                                      ? checkin.actualAchievementDate
                                        ? format(new Date(checkin.actualAchievementDate), "dd MMM yy")
                                        : "—"
                                      : checkin.actualAchievementValue ?? "—"}
                                  </p>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs items-center">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    Progress
                                    {(checkin.rawProgressPercentage || 0) > 100 && (
                                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] px-1.5 py-0 text-white">
                                        Exceeded ({checkin.rawProgressPercentage}%)
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="font-bold">{checkin.displayProgressPercentage || 0}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${progressColor(checkin.displayProgressPercentage || 0)}`}
                                    style={{ width: `${checkin.displayProgressPercentage || 0}%` }}
                                  />
                                </div>
                              </div>

                              {/* Employee comment */}
                              <div className="space-y-1.5">
                                <Label className="text-xs flex items-center gap-1.5">
                                  <UserIcon className="size-3" /> Employee Comment
                                </Label>
                                <div className="p-3 bg-card border rounded-lg min-h-14 text-sm">
                                  {checkin.employeeComment || (
                                    <span className="text-muted-foreground italic">No comment provided.</span>
                                  )}
                                </div>
                              </div>

                              {checkin.updatedAt && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Last updated: {format(new Date(checkin.updatedAt), "dd MMM yyyy, HH:mm")}
                                </p>
                              )}
                            </div>

                            {/* Manager feedback */}
                            <div className="space-y-1.5">
                              <Label className="text-xs flex items-center gap-1.5">
                                <MessageSquare className="size-3" /> Manager Feedback
                              </Label>
                              <Textarea
                                placeholder="Add your structured feedback on their achievement…"
                                className="h-36 resize-none bg-card text-sm"
                                value={checkin.managerComment || ""}
                                onChange={(e) => handleCommentChange(checkin._id, e.target.value)}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Feedback will be saved when you click "Complete Review" above.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
