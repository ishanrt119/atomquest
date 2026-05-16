"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Save, RefreshCw, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SharedGoalDetailClient({ goal, currentUser }: { goal: any, currentUser: any }) {
  const isPrimaryOwner = goal.primaryOwnerId._id === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  const canEdit = isPrimaryOwner || isAdmin;

  const [achievement, setAchievement] = useState(goal.currentAchievement ?? 0);
  const [status, setStatus] = useState(goal.status);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Auto-calculate progress percentage
  const progressPercentage = Math.min(100, Math.max(0, Math.round((achievement / goal.targetValue) * 100))) || 0;

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch(`/api/shared-goals/${goal._id}/update-achievement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAchievement: Number(achievement),
          progressPercentage,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Achievement updated! Sync engine is processing updates to linked goal sheets.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/shared-goal-sync/${goal._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Forced sync successful. Updated ${data.data.syncedGoalsCount} linked employee goal sheets.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start gap-4 p-6 border rounded-2xl bg-card">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{goal.title}</h2>
            <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50/50">
              <LinkIcon className="size-3 mr-1" /> Master Record
            </Badge>
          </div>
          <p className="text-muted-foreground">{goal.description}</p>
        </div>
        <div className="text-right">
          <Badge variant={status === "completed" ? "default" : status === "on_track" ? "secondary" : "outline"} className="uppercase">
            {status.replace("_", " ")}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Created by {goal.createdBy?.name || "Admin"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="p-6 border rounded-2xl bg-card">
            <h3 className="text-lg font-bold mb-4">Progress Synchronization</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target ({goal.uomType})</p>
                <p className="text-3xl font-bold">{goal.targetValue}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Achievement</p>
                <p className="text-3xl font-bold text-primary">{goal.currentAchievement ?? 0}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{goal.progressPercentage ?? 0}%</span>
              </div>
              <Progress value={goal.progressPercentage ?? 0} className="h-3" />
            </div>

            {canEdit && (
              <div className="p-5 border rounded-xl bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <h4 className="font-semibold">Update Achievement</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Achievement Value</Label>
                    <Input 
                      type="number" 
                      value={achievement} 
                      onChange={e => setAchievement(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="on_track">On Track</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleUpdate} disabled={loading}>
                    <Save className="size-4 mr-2" /> Save & Sync
                  </Button>
                  <Button variant="outline" onClick={handleForceSync} disabled={syncing}>
                    <RefreshCw className={`size-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Force Sync Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border rounded-2xl bg-card">
            <h3 className="font-bold mb-4">Ownership</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Primary Owner</p>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    {goal.primaryOwnerId.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{goal.primaryOwnerId.name}</p>
                    <p className="text-xs text-muted-foreground">{goal.primaryOwnerId.email}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Cascaded To ({goal.assignedEmployees.length})</p>
                <div className="space-y-3">
                  {goal.assignedEmployees.map((emp: any) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="text-sm">{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
