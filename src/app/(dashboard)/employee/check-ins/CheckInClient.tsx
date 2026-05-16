"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Save, Send, AlertTriangle, CheckCircle2, Clock, Target,
  TrendingUp, Link as LinkIcon, RefreshCw, Loader2, Info,
  CalendarClock, BarChart3, Star
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Checkin {
  _id: string;
  goalId: {
    _id: string;
    title: string;
    description?: string;
    thrustArea?: string;
    uomType: "numeric" | "percentage" | "timeline" | "zero";
    measurementDirection: "min" | "max";
    targetValue?: number;
    targetDate?: string;
    weightage: number;
    isSharedGoal?: boolean;
    isPrimaryOwner?: boolean;
    sharedGoalId?: string;
  };
  quarter: string;
  plannedTargetValue?: number;
  plannedTargetDate?: string;
  actualAchievementValue?: number | null;
  actualAchievementDate?: string | null;
  rawProgressPercentage: number;
  displayProgressPercentage: number;
  status: "not_started" | "at_risk" | "on_track" | "completed" | "exceeded";
  employeeComment?: string;
  managerComment?: string;
  checkinSubmitted: boolean;
  managerReviewed: boolean;
}

// ─── Progress Calculation (client-side, mirrors server) ─────────────────────
function calcProgress(
  uomType: string,
  measurementDirection: string,
  targetValue: number | undefined,
  actualValue: number | null | undefined,
  targetDate: string | undefined,
  actualDate: string | null | undefined
): { rawProgressPercentage: number; displayProgressPercentage: number } {
  let raw = 0;

  if (uomType === "timeline") {
    if (!targetDate || !actualDate) raw = 0;
    else {
      const t = new Date(targetDate).getTime();
      const a = new Date(actualDate).getTime();
      if (a <= t) raw = 100;
      else {
        const delayDays = (a - t) / (1000 * 60 * 60 * 24);
        if (delayDays > 30) raw = 0;
        else raw = Math.round(100 - delayDays * 3.33);
      }
    }
  } else if (uomType === "zero") {
    raw = Number(actualValue) === 0 ? 100 : 0;
  } else {
    const tv = Number(targetValue);
    const av = Number(actualValue);
    if (tv && !isNaN(av)) {
      if (measurementDirection === "min") {
        raw = av === 0 ? 100 : Math.round((tv / av) * 100);
      } else {
        raw = Math.round((av / tv) * 100);
      }
    }
  }

  return {
    rawProgressPercentage: raw,
    displayProgressPercentage: Math.min(100, raw)
  };
}

// ─── Status colour helper ───────────────────────────────────────────────────
const statusConfig = {
  not_started: { label: "Not Started", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  at_risk: { label: "At Risk", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  on_track: { label: "On Track", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  completed: { label: "Completed", color: "bg-primary/10 text-primary border-primary/20" },
  exceeded: { label: "Exceeded Target", color: "bg-green-600/10 text-green-700 border-green-600/20" },
};

const progressColor = (p: number) => {
  if (p >= 100) return "bg-primary";
  if (p >= 60) return "bg-emerald-500";
  if (p >= 30) return "bg-amber-500";
  return "bg-rose-500";
};

// ─── Per-Goal Card ───────────────────────────────────────────────────────────
function GoalCheckinCard({
  checkin,
  index,
  readOnly,
  onChange,
  onSave,
  saveState,
}: {
  checkin: Checkin;
  index: number;
  readOnly: boolean;
  onChange: (index: number, field: string, value: any) => void;
  onSave: (index: number) => void;
  saveState: "idle" | "saving" | "saved" | "error";
}) {
  const goal = checkin.goalId;
  const uom = goal.uomType;
  const rawProgress = checkin.rawProgressPercentage ?? 0;
  const displayProgress = checkin.displayProgressPercentage ?? 0;
  const status = checkin.status ?? "not_started";

  return (
    <div className="group relative overflow-hidden border rounded-2xl bg-card transition-all hover:shadow-md hover:border-primary/20">
      {/* Shared Goal accent bar */}
      {goal.isSharedGoal && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      )}

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Goal Info ── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg leading-tight">{goal.title}</h3>
                {goal.isSharedGoal && (
                  <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] gap-1">
                    <LinkIcon className="size-2.5" /> Shared
                    {goal.isPrimaryOwner && " · Primary Owner"}
                  </Badge>
                )}
              </div>
              {goal.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{goal.description}</p>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
              {goal.thrustArea}
            </Badge>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1 mb-1">
                <Target className="size-3" /> Target
              </p>
              <p className="font-bold text-sm">
                {uom === "timeline"
                  ? (goal.targetDate ? format(new Date(goal.targetDate), "dd MMM yy") : "—")
                  : `${goal.targetValue}${uom === "percentage" ? "%" : ""}`}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1 mb-1">
                <BarChart3 className="size-3" /> Weightage
              </p>
              <p className="font-bold text-sm">{goal.weightage}%</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1 mb-1">
                <TrendingUp className="size-3" /> Progress
              </p>
              <p className="font-bold text-sm">{rawProgress}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground items-center">
              <span className="flex items-center gap-2">
                Overall Progress
                {rawProgress > 100 && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] px-1.5 py-0">
                    Exceeded ({rawProgress}%)
                  </Badge>
                )}
              </span>
              <span className="font-semibold">{displayProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressColor(displayProgress)}`}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[status].color}`}>
              <span className={`size-1.5 rounded-full ${status === "completed" ? "bg-primary" : status === "exceeded" ? "bg-green-600" : status === "on_track" ? "bg-emerald-500" : status === "at_risk" ? "bg-rose-500" : "bg-zinc-400"}`} />
              {statusConfig[status].label}
            </span>
            {checkin.managerReviewed && (
              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle2 className="size-3" /> Manager Reviewed
              </span>
            )}
          </div>
        </div>

        {/* ── Right: Achievement Input ── */}
        <div className="bg-muted/10 border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Star className="size-4 text-primary" /> Achievement Update
            </h4>
            <div className="flex items-center gap-1.5">
              {readOnly && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Read-only</span>
              )}
              {saveState === "saving" && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Saving…
                </span>
              )}
              {saveState === "saved" && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Saved
                </span>
              )}
              {saveState === "error" && (
                <span className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertTriangle className="size-3" /> Error
                </span>
              )}
            </div>
          </div>

          {/* Achievement input */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Actual Achievement
              {uom === "zero" && <span className="text-muted-foreground ml-1">(0 = success)</span>}
              {uom === "percentage" && <span className="text-muted-foreground ml-1">(0–100)</span>}
            </Label>
            {uom === "timeline" ? (
              <Input
                type="date"
                value={checkin.actualAchievementDate ? new Date(checkin.actualAchievementDate).toISOString().split("T")[0] : ""}
                onChange={(e) => onChange(index, "actualAchievementDate", e.target.value)}
                onBlur={() => !readOnly && onSave(index)}
                disabled={readOnly}
                className="h-9"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={checkin.actualAchievementValue ?? ""}
                  onChange={(e) => onChange(index, "actualAchievementValue", e.target.value)}
                  onBlur={() => !readOnly && onSave(index)}
                  disabled={readOnly}
                  placeholder={uom === "zero" ? "0" : uom === "percentage" ? "0–100" : "Enter value"}
                  min={uom === "percentage" ? 0 : undefined}
                  max={uom === "percentage" ? 100 : undefined}
                  className="h-9"
                />
                {uom === "percentage" && <span className="text-sm text-muted-foreground shrink-0">%</span>}
              </div>
            )}
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              value={checkin.status || "not_started"}
              onChange={(e) => {
                onChange(index, "status", e.target.value);
              }}
              disabled={readOnly}
            >
              <option value="not_started">Not Started</option>
              <option value="on_track">On Track</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Live progress display */}
          <div className="space-y-1.5">
            <Label className="text-xs">Live Progress</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor(displayProgress)}`}
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-10 text-right tabular-nums ${rawProgress >= 100 ? "text-primary" : rawProgress >= 60 ? "text-emerald-600" : "text-muted-foreground"}`}>
                {rawProgress}%
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label className="text-xs">Comments (optional)</Label>
            <Textarea
              placeholder="Provide context for your achievement…"
              className="resize-none h-16 text-sm"
              value={checkin.employeeComment || ""}
              onChange={(e) => onChange(index, "employeeComment", e.target.value)}
              onBlur={() => !readOnly && onSave(index)}
              disabled={readOnly}
            />
          </div>

          {/* Shared goal note */}
          {goal.isSharedGoal && !goal.isPrimaryOwner && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <Info className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This is a shared goal. Progress is controlled by the <strong>Primary Owner</strong> and synced automatically.
              </p>
            </div>
          )}

          {/* Manager feedback */}
          {checkin.managerReviewed && checkin.managerComment && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-[10px] text-primary font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <CheckCircle2 className="size-3" /> Manager Feedback
              </p>
              <p className="text-sm">{checkin.managerComment}</p>
            </div>
          )}

          {/* Save button */}
          {!readOnly && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onSave(index)}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? (
                <><Loader2 className="size-3.5 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="size-3.5 mr-2" /> Save Progress</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────
export function CheckInClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveStates, setSaveStates] = useState<Record<number, "idle" | "saving" | "saved" | "error">>({});
  const [globalMsg, setGlobalMsg] = useState({ type: "", text: "" });
  const autoSaveTimers = useRef<Record<number, NodeJS.Timeout>>({});

  const isSubmitted = checkins.length > 0 && checkins.every((c) => c.checkinSubmitted);
  const isAllReviewed = checkins.length > 0 && checkins.every((c) => c.managerReviewed);

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const qRes = await fetch("/api/checkins/active-quarter");
        const qData = await qRes.json();
        setActiveQuarter(qData.activeQuarter);
        setIsWindowOpen(qData.isWindowOpen);

        const res = await fetch(`/api/checkins?quarter=${qData.activeQuarter}`);
        const data = await res.json();
        if (data.success) setCheckins(data.data);
      } catch (err) {
        console.error("Failed to load check-ins", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  // ── Local change (instant UI update + debounced autosave) ─────────────────
  const handleChange = useCallback((index: number, field: string, value: any) => {
    setCheckins((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Recalculate live progress
      const c = next[index];
      const g = c.goalId;
      const newProgress = calcProgress(
        g.uomType,
        g.measurementDirection,
        g.targetValue,
        field === "actualAchievementValue" ? value : c.actualAchievementValue,
        g.targetDate,
        field === "actualAchievementDate" ? value : c.actualAchievementDate
      );
      next[index].rawProgressPercentage = newProgress.rawProgressPercentage;
      next[index].displayProgressPercentage = newProgress.displayProgressPercentage;
      // Auto status
      if (newProgress.rawProgressPercentage > 100) next[index].status = "exceeded";
      else if (newProgress.rawProgressPercentage === 100) next[index].status = "completed";
      else if (newProgress.rawProgressPercentage >= 50) next[index].status = "on_track";
      else if (newProgress.rawProgressPercentage > 0) next[index].status = "at_risk";

      return next;
    });

    // Debounce autosave (2s)
    if (autoSaveTimers.current[index]) clearTimeout(autoSaveTimers.current[index]);
    autoSaveTimers.current[index] = setTimeout(() => {
      saveGoalCheckin(index);
    }, 2000);
  }, []);

  // ── Save a single goal's check-in ────────────────────────────────────────
  const saveGoalCheckin = useCallback(async (index: number) => {
    const c = checkins[index];
    if (!c) return;

    setSaveStates((prev) => ({ ...prev, [index]: "saving" }));
    try {
      const res = await fetch("/api/checkins/update-achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinId: c._id,
          goalId: typeof c.goalId === "object" ? c.goalId._id : c.goalId,
          actualAchievementValue: c.actualAchievementValue,
          actualAchievementDate: c.actualAchievementDate,
          rawProgressPercentage: c.rawProgressPercentage,
          displayProgressPercentage: c.displayProgressPercentage,
          status: c.status,
          employeeComment: c.employeeComment,
          quarter: activeQuarter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Replace virtual ID and set exact server-calculated progress/status
      if (data.data) {
        setCheckins((prev) => {
          const next = [...prev];
          if (next[index]._id.startsWith("virtual_") && data.data.checkin?._id) {
            next[index]._id = data.data.checkin._id;
          }
          if (data.data.rawProgressPercentage !== undefined) {
            next[index].rawProgressPercentage = data.data.rawProgressPercentage;
            next[index].displayProgressPercentage = data.data.displayProgressPercentage;
            next[index].status = data.data.status;
          }
          return next;
        });

        // If it was a shared goal, trigger a global layout refresh to update other components
        if (c.goalId?.isSharedGoal) {
          router.refresh();
        }
      }

      setSaveStates((prev) => ({ ...prev, [index]: "saved" }));
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [index]: "idle" })), 2500);
    } catch (err: any) {
      setSaveStates((prev) => ({ ...prev, [index]: "error" }));
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [index]: "idle" })), 3000);
    }
  }, [checkins, activeQuarter]);

  // ── Save all (draft) ──────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setGlobalMsg({ type: "", text: "" });
    await Promise.all(checkins.map((_, i) => saveGoalCheckin(i)));
    setGlobalMsg({ type: "success", text: "All drafts saved successfully." });
    setTimeout(() => setGlobalMsg({ type: "", text: "" }), 3000);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!confirm("Submit your quarterly check-in? Your manager will be notified to review your progress.")) return;
    setSubmitting(true);
    setGlobalMsg({ type: "", text: "" });
    try {
      // Save all first
      await Promise.all(checkins.map((_, i) => saveGoalCheckin(i)));

      const res = await fetch("/api/checkins/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter: activeQuarter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCheckins((prev) => prev.map((c) => ({ ...c, checkinSubmitted: true })));
      setGlobalMsg({ type: "success", text: `${activeQuarter} Check-in submitted to your manager!` });
    } catch (err: any) {
      setGlobalMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Sticky header bar ─────────────────────────────────────────────── */}
      <div className="sticky top-4 z-30 bg-card/90 backdrop-blur-sm border rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            <h2 className="font-bold text-lg">{activeQuarter} Check-in</h2>
          </div>
          <Badge
            className={
              isAllReviewed
                ? "bg-primary/10 text-primary border-primary/20"
                : isSubmitted
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
            }
          >
            {isAllReviewed ? "✓ Reviewed" : isSubmitted ? "Submitted" : "Draft"}
          </Badge>
          {!isWindowOpen && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="size-3" /> Window Closed
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!isSubmitted && isWindowOpen && checkins.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={submitting}>
                <Save className="size-4 mr-1.5" /> Save All
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
                Submit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Global message ─────────────────────────────────────────────────── */}
      {globalMsg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${globalMsg.type === "error" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"}`}>
          {globalMsg.type === "error" ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          <span className="text-sm font-medium">{globalMsg.text}</span>
        </div>
      )}

      {/* ── Closed window warning ──────────────────────────────────────────── */}
      {!isWindowOpen && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Check-in Window Closed</p>
            <p className="text-xs text-amber-600 mt-0.5">The {activeQuarter} check-in window has closed. Your data is displayed in read-only mode.</p>
          </div>
        </div>
      )}

      {/* ── Submitted banner ──────────────────────────────────────────────── */}
      {isSubmitted && !isAllReviewed && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
          <Clock className="size-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Awaiting Manager Review</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your {activeQuarter} check-in has been submitted. Your manager will review and add feedback soon.</p>
          </div>
        </div>
      )}

      {/* ── Goal cards ────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {checkins.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl bg-muted/5">
            <BarChart3 className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No Approved Goals Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              You don't have any approved and locked goals for this quarter yet. Once your manager approves your goal sheet, they'll appear here.
            </p>
          </div>
        ) : (
          checkins.map((checkin, index) => {
            const isSharedNotOwner = !!checkin.goalId?.isSharedGoal && !checkin.goalId?.isPrimaryOwner;
            const readOnly: boolean = !isWindowOpen || isSharedNotOwner;

            return (
              <GoalCheckinCard
                key={checkin._id || index}
                checkin={checkin}
                index={index}
                readOnly={readOnly}
                onChange={handleChange}
                onSave={saveGoalCheckin}
                saveState={saveStates[index] ?? "idle"}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
