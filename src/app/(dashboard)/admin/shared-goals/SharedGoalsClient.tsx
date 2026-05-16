"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Link as LinkIcon, Save, Users, AlertTriangle } from "lucide-react";

export function SharedGoalsClient({ initialSharedGoals, employees }: { initialSharedGoals: any[], employees: any[] }) {
  const [goals, setGoals] = useState(initialSharedGoals);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thrustArea: "Core",
    target: "",
    primaryOwnerId: "",
    assignedEmployees: [] as string[]
  });

  const handleToggleEmployee = (empId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(empId)
        ? prev.assignedEmployees.filter(id => id !== empId)
        : [...prev.assignedEmployees, empId]
    }));
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.target || !formData.primaryOwnerId) {
      alert("Title, target, and primary owner are required.");
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
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Strategic context..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Target Value</Label>
              <Input 
                type="number" 
                placeholder="e.g. 5000000" 
                value={formData.target} 
                onChange={e => setFormData({...formData, target: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Thrust Area</Label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={formData.thrustArea}
                onChange={e => setFormData({...formData, thrustArea: e.target.value})}
              >
                <option value="Core">Core Objectives</option>
                <option value="Innovation">Innovation</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Primary Owner (Who controls the achievement?)</Label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={formData.primaryOwnerId}
                onChange={e => setFormData({...formData, primaryOwnerId: e.target.value})}
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Cascade To (Select Employees)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {employees.map(emp => (
                  <div 
                    key={emp._id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${formData.assignedEmployees.includes(emp._id) ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => handleToggleEmployee(emp._id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`size-4 rounded-sm border flex items-center justify-center ${formData.assignedEmployees.includes(emp._id) ? 'bg-primary border-primary' : 'border-input'}`}>
                        {formData.assignedEmployees.includes(emp._id) && <div className="size-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-sm font-medium">{emp.name}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                <Badge variant="outline" className="border-blue-500 text-blue-500"><LinkIcon className="size-3 mr-1" /> Cascaded</Badge>
                <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/shared-goals/${sg._id}`}>View Details</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Target</p>
                <p className="font-medium mt-1">{sg.target}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Thrust Area</p>
                <p className="font-medium mt-1">{sg.thrustArea}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Primary Owner</p>
                <p className="font-medium mt-1">{sg.primaryOwnerId?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Assigned To</p>
                <div className="flex -space-x-2 mt-1">
                  {sg.assignedEmployees.slice(0, 3).map((emp: any) => (
                    <div key={emp._id} className="size-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold" title={emp.name}>
                      {emp.name.charAt(0)}
                    </div>
                  ))}
                  {sg.assignedEmployees.length > 3 && (
                    <div className="size-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                      +{sg.assignedEmployees.length - 3}
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
