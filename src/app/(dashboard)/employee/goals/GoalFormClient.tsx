"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Trash2, Save, Send, AlertTriangle, Lock } from "lucide-react";

export function GoalFormClient({ initialSheet, initialGoals }: { initialSheet: any, initialGoals: any[] }) {
  const [sheet, setSheet] = useState(initialSheet);
  const [goals, setGoals] = useState<any[]>(initialGoals);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const totalWeightage = goals.reduce((acc, curr) => acc + (Number(curr.weightage) || 0), 0);
  const isLocked = sheet.locked || sheet.status === "submitted" || sheet.status === "approved";

  const handleAddGoal = () => {
    if (goals.length >= 8) return;
    setGoals([...goals, {
      title: "",
      description: "",
      thrustArea: "Core",
      uomType: "numeric",
      measurementDirection: "max",
      target: 0,
      weightage: 10,
      isSharedGoal: false,
    }]);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals[index].isSharedGoal) return;
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...goals];
    updated[index][field] = field === "weightage" || field === "target" ? Number(value) : value;
    setGoals(updated);
  };

  const handleSaveDraft = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetId: sheet._id, goals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccessMsg("Draft saved successfully!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    // Client-side validation check before hitting API
    if (totalWeightage !== 100) {
      setErrorMsg(`Total weightage must be exactly 100%. Current is ${totalWeightage}%.`);
      return;
    }

    setLoading(true);
    try {
      // 1. Save goals first
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetId: sheet._id, goals }),
      });

      // 2. Submit the sheet
      const res = await fetch(`/api/goalsheets/${sheet._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSheet(data.data);
      setSuccessMsg("Goal sheet submitted for manager approval!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Sticky Action Bar */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md p-4 border-b -mx-4 md:-mx-8 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge variant={sheet.status === "approved" ? "default" : sheet.status === "rejected" ? "destructive" : "secondary"} className="uppercase">
            {sheet.status}
          </Badge>
          {isLocked && <Badge variant="outline" className="text-amber-600 bg-amber-50"><Lock className="size-3 mr-1" /> Locked</Badge>}
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full md:w-64">
            <span className="text-sm font-medium whitespace-nowrap">Weightage: {totalWeightage}%</span>
            <Progress 
              value={totalWeightage} 
              className={`h-2 flex-1 ${totalWeightage === 100 ? '[&>div]:bg-green-500' : totalWeightage > 100 ? '[&>div]:bg-red-500' : ''}`}
            />
          </div>

          {!isLocked && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading}><Save className="size-4 mr-2" /> Save Draft</Button>
              <Button onClick={handleSubmit} disabled={loading || totalWeightage !== 100 || goals.length === 0}><Send className="size-4 mr-2" /> Submit</Button>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="size-5 mt-0.5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 text-green-700 border border-green-500/20 p-4 rounded-xl">
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Goal Cards */}
      <div className="space-y-6">
        <AnimatePresence>
          {goals.map((goal, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border bg-card relative ${goal.isSharedGoal ? 'border-blue-500/30 bg-blue-50/30' : ''}`}
            >
              {goal.isSharedGoal && (
                <div className="absolute -top-3 -right-2">
                  <Badge className="bg-blue-500 text-white">Shared Goal</Badge>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold">Goal #{index + 1}</h3>
                {!isLocked && !goal.isSharedGoal && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveGoal(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="lg:col-span-2 space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="Enter goal title..." 
                    value={goal.title} 
                    onChange={(e) => handleChange(index, "title", e.target.value)}
                    disabled={isLocked || goal.isSharedGoal}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thrust Area</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={goal.thrustArea || "Core"}
                    onChange={(e) => handleChange(index, "thrustArea", e.target.value)}
                    disabled={isLocked || goal.isSharedGoal}
                  >
                    <option value="Core">Core Objectives</option>
                    <option value="Innovation">Innovation</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Weightage (%)</Label>
                  <Input 
                    type="number" 
                    min="10" 
                    max="100" 
                    value={goal.weightage} 
                    onChange={(e) => handleChange(index, "weightage", e.target.value)}
                    disabled={isLocked}
                  />
                  {goal.weightage < 10 && <p className="text-[10px] text-destructive">Min 10%</p>}
                </div>

                <div className="lg:col-span-4 space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Provide details about how you will achieve this..."
                    value={goal.description || ""}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    disabled={isLocked}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>UoM Type</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={goal.uomType || "numeric"}
                    onChange={(e) => handleChange(index, "uomType", e.target.value)}
                    disabled={isLocked || goal.isSharedGoal}
                  >
                    <option value="numeric">Numeric Value</option>
                    <option value="percentage">Percentage</option>
                    <option value="timeline">Timeline/Date</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={goal.measurementDirection || "max"}
                    onChange={(e) => handleChange(index, "measurementDirection", e.target.value)}
                    disabled={isLocked || goal.isSharedGoal}
                  >
                    <option value="max">Maximize (Higher is better)</option>
                    <option value="min">Minimize (Lower is better)</option>
                  </select>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <Label>Target Value</Label>
                  <Input 
                    type="number" 
                    placeholder="E.g., 10000"
                    value={goal.target || ""}
                    onChange={(e) => handleChange(index, "target", e.target.value)}
                    disabled={isLocked || goal.isSharedGoal}
                  />
                </div>

              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Button */}
      {!isLocked && goals.length < 8 && (
        <Button variant="outline" className="w-full border-dashed h-14 bg-transparent hover:bg-muted/50" onClick={handleAddGoal}>
          <PlusCircle className="size-5 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">Add New Goal</span>
        </Button>
      )}

      {!isLocked && goals.length >= 8 && (
        <p className="text-center text-sm text-muted-foreground">Maximum of 8 goals reached.</p>
      )}

    </div>
  );
}
