"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, CheckCircle, AlertTriangle, Lock, Unlock, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface GoalCycle {
  _id: string;
  cycleYear: number;
  goalSettingStart: string;
  goalSettingEnd: string;
  q1Start: string;
  q1End: string;
  q2Start: string;
  q2End: string;
  q3Start: string;
  q3End: string;
  q4Start: string;
  q4End: string;
  isActive: boolean;
  adminOverride?: {
    isOverridden: boolean;
    reason?: string;
    overrideEndDate?: string;
    overriddenPhase?: string;
  };
}

export default function GoalCycleClient() {
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cycleYear: new Date().getFullYear(),
    goalSettingStart: `${new Date().getFullYear()}-05-01`,
    goalSettingEnd: `${new Date().getFullYear()}-05-31`,
    q1Start: `${new Date().getFullYear()}-07-01`,
    q1End: `${new Date().getFullYear()}-07-31`,
    q2Start: `${new Date().getFullYear()}-10-01`,
    q2End: `${new Date().getFullYear()}-10-31`,
    q3Start: `${new Date().getFullYear() + 1}-01-01`,
    q3End: `${new Date().getFullYear() + 1}-01-31`,
    q4Start: `${new Date().getFullYear() + 1}-03-01`,
    q4End: `${new Date().getFullYear() + 1}-04-30`,
  });

  const [overrideData, setOverrideData] = useState({
    isOverridden: true,
    reason: "",
    overrideEndDate: "",
    overriddenPhase: "Q1"
  });

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/cycles");
      const data = await res.json();
      setCycles(data);
    } catch (error) {
      console.error("Failed to fetch cycles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        fetchCycles();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create cycle");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await fetch(`/api/cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACTIVATE" }),
      });
      fetchCycles();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId) return;

    try {
      const res = await fetch(`/api/cycles/${selectedCycleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OVERRIDE", adminOverride: overrideData }),
      });
      if (res.ok) {
        setIsOverrideOpen(false);
        fetchCycles();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to apply override");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearOverride = async (id: string) => {
    try {
      await fetch(`/api/cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OVERRIDE", adminOverride: { isOverridden: false } }),
      });
      fetchCycles();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> New Cycle
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Goal Cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-2">
                <Label>Cycle Year</Label>
                <Input
                  type="number"
                  value={formData.cycleYear}
                  onChange={(e) => setFormData({ ...formData, cycleYear: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="col-span-2 font-semibold">Goal Setting Window</div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.goalSettingStart} onChange={(e) => setFormData({ ...formData, goalSettingStart: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.goalSettingEnd} onChange={(e) => setFormData({ ...formData, goalSettingEnd: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="col-span-2 font-semibold">Q1 Check-in Window</div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.q1Start} onChange={(e) => setFormData({ ...formData, q1Start: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.q1End} onChange={(e) => setFormData({ ...formData, q1End: e.target.value })} required /></div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="col-span-2 font-semibold">Q2 Check-in Window</div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.q2Start} onChange={(e) => setFormData({ ...formData, q2Start: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.q2End} onChange={(e) => setFormData({ ...formData, q2End: e.target.value })} required /></div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="col-span-2 font-semibold">Q3 Check-in Window</div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.q3Start} onChange={(e) => setFormData({ ...formData, q3Start: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.q3End} onChange={(e) => setFormData({ ...formData, q3End: e.target.value })} required /></div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="col-span-2 font-semibold">Q4 / Annual Review Window</div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.q4Start} onChange={(e) => setFormData({ ...formData, q4Start: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.q4End} onChange={(e) => setFormData({ ...formData, q4End: e.target.value })} required /></div>
              </div>

              <Button type="submit" className="w-full">Create Cycle</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {cycles.map((cycle) => (
          <Card key={cycle._id} className={cycle.isActive ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  {cycle.cycleYear} Cycle
                  {cycle.isActive && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>}
                  {!cycle.isActive && <Badge variant="secondary">Inactive</Badge>}
                </CardTitle>
                <CardDescription>Configure windows for this year's goals and check-ins.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!cycle.isActive && (
                  <Button variant="outline" size="sm" onClick={() => handleActivate(cycle._id)}>
                    Set as Active
                  </Button>
                )}
                {cycle.adminOverride?.isOverridden ? (
                  <Button variant="destructive" size="sm" onClick={() => handleClearOverride(cycle._id)}>
                    <Unlock className="w-4 h-4 mr-1" /> Clear Override
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedCycleId(cycle._id);
                    setIsOverrideOpen(true);
                  }}>
                    <Lock className="w-4 h-4 mr-1" /> Override
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cycle.adminOverride?.isOverridden && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="text-yellow-500 w-5 h-5 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-500">Admin Override Active</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Phase: <strong>{cycle.adminOverride.overriddenPhase}</strong> | Ends: {cycle.adminOverride.overrideEndDate ? format(new Date(cycle.adminOverride.overrideEndDate), "MMM d, yyyy") : "N/A"}
                    </p>
                    {cycle.adminOverride.reason && (
                      <p className="text-sm text-yellow-700/80 dark:text-yellow-400/80 mt-1">Reason: {cycle.adminOverride.reason}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div className="border p-3 rounded-lg bg-card">
                  <div className="font-semibold mb-1 text-primary">Goal Setting</div>
                  <div className="text-muted-foreground">{format(new Date(cycle.goalSettingStart), "MMM d")} - {format(new Date(cycle.goalSettingEnd), "MMM d, yyyy")}</div>
                </div>
                <div className="border p-3 rounded-lg bg-card">
                  <div className="font-semibold mb-1 text-blue-500">Q1 Check-in</div>
                  <div className="text-muted-foreground">{format(new Date(cycle.q1Start), "MMM d")} - {format(new Date(cycle.q1End), "MMM d, yyyy")}</div>
                </div>
                <div className="border p-3 rounded-lg bg-card">
                  <div className="font-semibold mb-1 text-purple-500">Q2 Check-in</div>
                  <div className="text-muted-foreground">{format(new Date(cycle.q2Start), "MMM d")} - {format(new Date(cycle.q2End), "MMM d, yyyy")}</div>
                </div>
                <div className="border p-3 rounded-lg bg-card">
                  <div className="font-semibold mb-1 text-orange-500">Q3 Check-in</div>
                  <div className="text-muted-foreground">{format(new Date(cycle.q3Start), "MMM d")} - {format(new Date(cycle.q3End), "MMM d, yyyy")}</div>
                </div>
                <div className="border p-3 rounded-lg bg-card">
                  <div className="font-semibold mb-1 text-emerald-500">Q4 / Annual</div>
                  <div className="text-muted-foreground">{format(new Date(cycle.q4Start), "MMM d")} - {format(new Date(cycle.q4End), "MMM d, yyyy")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Admin Override</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOverride} className="space-y-4">
            <div className="space-y-2">
              <Label>Override Phase</Label>
              <select
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={overrideData.overriddenPhase}
                onChange={(e) => setOverrideData({ ...overrideData, overriddenPhase: e.target.value })}
              >
                <option value="GOAL_SETTING">Goal Setting</option>
                <option value="Q1">Q1 Check-in</option>
                <option value="Q2">Q2 Check-in</option>
                <option value="Q3">Q3 Check-in</option>
                <option value="Q4">Q4 / Annual Review</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Extend Deadline To</Label>
              <Input type="date" required value={overrideData.overrideEndDate} onChange={(e) => setOverrideData({ ...overrideData, overrideEndDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason (Audit Log)</Label>
              <Input placeholder="e.g., Extended Q2 window for delayed appraisals" required value={overrideData.reason} onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOverrideOpen(false)}>Cancel</Button>
              <Button type="submit">Apply Override</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
