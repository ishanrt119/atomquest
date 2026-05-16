"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ApprovalQueueClient({ initialSheets }: { initialSheets: any[] }) {
  const [sheets, setSheets] = useState(initialSheets);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [rejectDialogObj, setRejectDialogObj] = useState<{ id: string, name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  // For inline editing
  const [editedGoals, setEditedGoals] = useState<{ [goalId: string]: any }>({});

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGoalChange = (goalId: string, field: string, value: string) => {
    setEditedGoals(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: Number(value)
      }
    }));
  };

  const handleApprove = async (sheetId: string) => {
    setLoading(true);
    try {
      // If there are inline edits, we must bulk save them first
      const sheet = sheets.find(s => s._id === sheetId);
      if (!sheet) return;

      const goalsToSave = sheet.goals.map((g: any) => {
        if (editedGoals[g._id]) {
          return { ...g, ...editedGoals[g._id] };
        }
        return g;
      });

      // Recalculate weightage to ensure manager didn't break it
      const totalWeightage = goalsToSave.reduce((acc: number, curr: any) => acc + (Number(curr.weightage) || 0), 0);
      if (totalWeightage !== 100) {
        alert(`Cannot approve: Total weightage is ${totalWeightage}%. Must be 100%. Adjust your edits.`);
        setLoading(false);
        return;
      }

      // Bulk save modifications
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetId: sheetId, goals: goalsToSave }),
      });

      // Approve sheet
      const res = await fetch(`/api/goalsheets/${sheetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) throw new Error("Approval failed");
      
      setSheets(sheets.filter(s => s._id !== sheetId));

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialogObj || !rejectionReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goalsheets/${rejectDialogObj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason }),
      });

      if (!res.ok) throw new Error("Rejection failed");
      
      setSheets(sheets.filter(s => s._id !== rejectDialogObj.id));
      setRejectDialogObj(null);
      setRejectionReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle className="size-16 text-green-500/50 mb-4" />
        <h3 className="text-xl font-medium">All caught up!</h3>
        <p className="text-muted-foreground mt-2">No pending goal sheets await your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sheets.map((sheet) => {
        const isExpanded = expandedId === sheet._id;

        return (
          <div key={sheet._id} className="border rounded-xl bg-card overflow-hidden">
            {/* Header Row */}
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(sheet._id)}>
              <div className="flex items-center gap-4">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {sheet.employee.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{sheet.employee.name}</h4>
                  <p className="text-xs text-muted-foreground">{sheet.employee.designation}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{sheet.quarter} {sheet.year}</p>
                  <p className="text-xs text-muted-foreground">{sheet.goals.length} Goals • {sheet.totalWeightage}% Wtg</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">Submitted</Badge>
                  {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t bg-muted/10"
                >
                  <div className="p-4 md:p-6 space-y-6">
                    
                    <div className="space-y-4">
                      {sheet.goals.map((goal: any, index: number) => {
                        const currentGoal = editedGoals[goal._id] || goal;
                        return (
                          <div key={goal._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-background border rounded-lg">
                            <div className="md:col-span-6">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-sm">Goal {index + 1}: {goal.title}</h5>
                                {goal.isSharedGoal && <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-blue-500 text-blue-500">Shared</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description || "No description."}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-[10px]">{goal.thrustArea}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{goal.uomType}</Badge>
                              </div>
                            </div>
                            
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Target ({goal.measurementDirection})</label>
                              <Input 
                                type="number" 
                                className="h-8 text-sm" 
                                value={currentGoal.target} 
                                onChange={(e) => handleGoalChange(goal._id, "target", e.target.value)}
                                disabled={goal.isSharedGoal}
                              />
                            </div>
                            
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Weightage (%)</label>
                              <Input 
                                type="number" 
                                className="h-8 text-sm" 
                                value={currentGoal.weightage} 
                                onChange={(e) => handleGoalChange(goal._id, "weightage", e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setRejectDialogObj({ id: sheet._id, name: sheet.employee.name })}>
                        <XCircle className="size-4 mr-2" /> Reject
                      </Button>
                      <Button onClick={() => handleApprove(sheet._id)} disabled={loading}>
                        <CheckCircle className="size-4 mr-2" /> Approve & Lock Goals
                      </Button>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <Dialog open={!!rejectDialogObj} onOpenChange={() => setRejectDialogObj(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Goal Sheet</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting {rejectDialogObj?.name}'s goal sheet. They will be notified to make changes.
            </p>
            <Textarea 
              placeholder="e.g. Target for Goal #2 is too low, please revise to at least 15,000."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogObj(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !rejectionReason.trim()}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
