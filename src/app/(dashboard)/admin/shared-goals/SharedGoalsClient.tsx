"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Link as LinkIcon, Save, Users, AlertTriangle, Building2, UserCircle2 } from "lucide-react";

export function SharedGoalsClient({ initialSharedGoals, teams }: { initialSharedGoals: any[], teams: any[] }) {
  const [goals, setGoals] = useState(initialSharedGoals);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thrustArea: "Core",
    target: "",
    teamId: "",
    primaryOwnerId: "",
    participatingEmployeeIds: [] as string[]
  });

  const selectedTeam = teams.find(t => t._id === formData.teamId);
  const teamEmployees = selectedTeam?.employeeIds || [];

  const handleToggleEmployee = (empId: string) => {
    setFormData(prev => ({
      ...prev,
      participatingEmployeeIds: prev.participatingEmployeeIds.includes(empId)
        ? prev.participatingEmployeeIds.filter(id => id !== empId)
        : [...prev.participatingEmployeeIds, empId]
    }));
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.target || !formData.teamId || !formData.primaryOwnerId) {
      alert("Title, target, team, and primary owner are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          target: Number(formData.target)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Simple reload to fetch newly populated data from server component
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">

      {!showForm ? (
        <Button onClick={() => setShowForm(true)}><PlusCircle className="size-4 mr-2" /> Create Shared Goal</Button>
      ) : (
        <div className="border rounded-2xl bg-card p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-xl font-bold">New Shared Goal</h3>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Goal Title</Label>
              <Input
                placeholder="e.g. Achieve $5M ARR"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Strategic context..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Value</Label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Thrust Area</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={formData.thrustArea}
                onChange={e => setFormData({ ...formData, thrustArea: e.target.value })}
              >
                <option value="Core">Core Objectives</option>
                <option value="Innovation">Innovation</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>

            <div className="space-y-4 md:col-span-2 pt-4 border-t">
              <h4 className="font-semibold text-lg flex items-center gap-2"><Building2 className="size-5" /> Assignment Hierarchy</h4>
              
              <div className="space-y-2">
                <Label>Assign To Team</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formData.teamId}
                  onChange={e => setFormData({ ...formData, teamId: e.target.value, primaryOwnerId: "", participatingEmployeeIds: [] })}
                >
                  <option value="">Select a team...</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.teamName} (Mgr: {team.managerId?.name || "None"})</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Select the team that will be responsible for executing this goal.</p>
              </div>

              {selectedTeam && (
                <div className="p-4 bg-muted/20 border rounded-xl space-y-6 mt-4">
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle2 className="size-4" /> Primary Owner</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
                      value={formData.primaryOwnerId}
                      onChange={e => {
                        const newOwnerId = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          primaryOwnerId: newOwnerId,
                          // Auto select primary owner in participating employees
                          participatingEmployeeIds: prev.participatingEmployeeIds.includes(newOwnerId) 
                            ? prev.participatingEmployeeIds 
                            : [...prev.participatingEmployeeIds, newOwnerId]
                        }));
                      }}
                    >
                      <option value="">Select an employee from {selectedTeam.teamName}...</option>
                      {teamEmployees.map((emp: any) => (
                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">This user controls achievement updates synced across all linked goals.</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Linked Employees</Label>
                    {teamEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No employees in this team.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {teamEmployees.map((emp: any) => {
                          const isPrimaryOwner = formData.primaryOwnerId === emp._id;
                          const isSelected = formData.participatingEmployeeIds.includes(emp._id) || isPrimaryOwner;
                          return (
                            <div
                              key={emp._id}
                              className={`p-3 border rounded-lg transition-colors ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-card hover:bg-muted/50 cursor-pointer'} ${isPrimaryOwner ? 'opacity-80' : ''}`}
                              onClick={() => {
                                if (!isPrimaryOwner) handleToggleEmployee(emp._id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`size-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input bg-card'}`}>
                                  {isSelected && <div className="size-2 bg-white rounded-sm" />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{emp.name}</span>
                                  {isPrimaryOwner && <span className="text-[10px] uppercase font-bold text-primary">Primary Owner</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">These employees will receive a linked copy of this goal on their dashboard. They can only adjust their personal weightage.</p>
                  </div>

                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button onClick={handleCreate} disabled={loading}>
              <Save className="size-4 mr-2" /> Cascade Goal
            </Button>
          </div>
        </div>
      )}

      {/* Existing Shared Goals Table */}
      <div className="space-y-4">
        {goals.map((sg) => (
          <div key={sg._id} className="p-6 border rounded-xl bg-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold">{sg.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{sg.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-purple-500 text-white border-purple-500">Organization Goal</Badge>
                <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/shared-goals/${sg._id}`}>View Details</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Target</p>
                <p className="font-medium mt-1">{sg.target}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Assigned Team</p>
                <p className="font-medium mt-1">{sg.teamId?.teamName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Primary Owner</p>
                <p className="font-medium mt-1">{sg.primaryOwnerId?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Linked Employees</p>
                <div className="flex -space-x-2 mt-1">
                  {sg.participatingEmployeeIds && sg.participatingEmployeeIds.slice(0, 3).map((emp: any) => (
                    <div key={emp._id} className="size-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold" title={emp.name}>
                      {emp.name.charAt(0)}
                    </div>
                  ))}
                  {sg.participatingEmployeeIds && sg.participatingEmployeeIds.length > 3 && (
                    <div className="size-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                      +{sg.participatingEmployeeIds.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && !showForm && (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <Users className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="font-medium">No Shared Goals</h4>
            <p className="text-sm text-muted-foreground mt-1">Create one to cascade objectives across your team.</p>
          </div>
        )}
      </div>

    </div>
  );
}
