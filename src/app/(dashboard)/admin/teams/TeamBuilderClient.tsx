"use client";

import { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, KeyboardSensor, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Users, Building2, UserCircle2, GripVertical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDroppable, useDraggable } from "@dnd-kit/core";

// Types
type UserType = { _id: string; name: string; email: string; role: string; designation: string; teamId?: string; managerId?: string };
type TeamType = { _id: string; teamName: string; description: string; manager: UserType | null; employees: UserType[] };

export function TeamBuilderClient({ initialTeams }: { initialTeams: TeamType[] }) {
  const [teams, setTeams] = useState<TeamType[]>(initialTeams);
  const [unassignedUsers, setUnassignedUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDragUser, setActiveDragUser] = useState<UserType | null>(null);

  // New Team Modal
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Fetch Unassigned Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/users/search?q=${searchQuery}&unassigned=true`);
        const { data } = await res.json();
        if (data) setUnassignedUsers(data);
      } catch (err) {
        console.error("Failed to fetch users");
      }
    };
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Create Team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: newTeamName, description: newTeamDesc })
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      
      setTeams([{ ...data, manager: null, employees: [] }, ...teams]);
      setIsTeamModalOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team? Unassigned employees will be moved to the pool.")) return;
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const { error } = await res.json();
      if (error) throw new Error(error);
      
      setTeams(teams.filter(t => t._id !== id));
      // Refresh unassigned users pool
      setSearchQuery(searchQuery + " "); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Drag Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const user = [...unassignedUsers, ...teams.flatMap(t => [...(t.manager ? [t.manager] : []), ...t.employees])]
      .find(u => u._id === active.id);
    if (user) setActiveDragUser(user);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragUser(null);
    if (!over) return;

    const userId = active.id as string;
    const overId = over.id as string; // e.g. "team-123-manager" or "team-123-employee" or "unassigned"

    if (overId === "unassigned") {
      await assignUser(userId, null, "unassigned");
      return;
    }

    const [prefix, teamId, slotType] = overId.split("-");
    if (prefix !== "team") return;

    await assignUser(userId, teamId, slotType);
  };

  const assignUser = async (userId: string, targetTeamId: string | null, slotType: string) => {
    try {
      // Optimistic UI Update
      setUnassignedUsers(prev => prev.filter(u => u._id !== userId));
      
      const res = await fetch("/api/teams/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetTeamId, slotType })
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);

      // Refresh data
      const fetchTeamsRes = await fetch("/api/teams");
      const { data: teamsData } = await fetchTeamsRes.json();
      const mappedTeams = teamsData.map((team: any) => ({
        ...team,
        manager: team.managerId ? { ...team.managerId, _id: team.managerId._id } : null,
        employees: team.employeeIds.map((emp: any) => ({ ...emp, _id: emp._id }))
      }));
      setTeams(mappedTeams);
      
      // Refresh unassigned pool
      const fetchUsersRes = await fetch(`/api/users/search?q=${searchQuery}&unassigned=true`);
      const { data: usersData } = await fetchUsersRes.json();
      setUnassignedUsers(usersData);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId: string, teamId: string, role: string) => {
    if (!confirm(`Are you sure you want to remove this ${role} from the team?`)) return;

    try {
      // Optimistic Update
      const removedUser = teams.flatMap(t => [...(t.manager ? [t.manager] : []), ...t.employees]).find(u => u._id === userId);
      if (removedUser) {
        setUnassignedUsers(prev => {
          if (prev.some(u => u._id === removedUser._id)) return prev;
          return [removedUser, ...prev];
        });
      }
      setTeams(prevTeams => prevTeams.map(t => {
        if (t._id === teamId) {
          if (role === 'manager') return { ...t, manager: null };
          if (role === 'employee') return { ...t, employees: t.employees.filter(e => e._id !== userId) };
        }
        return t;
      }));

      const res = await fetch("/api/teams/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId, role })
      });
      const { error } = await res.json();
      if (error) throw new Error(error);

    } catch (err: any) {
      alert(err.message);
      // Fallback refresh on error
      const fetchTeamsRes = await fetch("/api/teams");
      const { data: teamsData } = await fetchTeamsRes.json();
      const mappedTeams = teamsData.map((team: any) => ({
        ...team,
        manager: team.managerId ? { ...team.managerId, _id: team.managerId._id } : null,
        employees: team.employeeIds.map((emp: any) => ({ ...emp, _id: emp._id }))
      }));
      setTeams(mappedTeams);
    }
  };

  return (
    <DndContext id="dnd-team-builder" sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Panel: User Pool */}
        <div className="lg:col-span-1 bg-card border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2"><Users className="size-4 text-primary" /> Unassigned Staff</h3>
            <div className="mt-3 relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search name, email, role..." 
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
            <DroppableZone id="unassigned" className="min-h-full">
              {Array.from(new Map(unassignedUsers.map(user => [user._id, user])).values()).map(user => (
                <DraggableUser key={user._id} user={user} />
              ))}
              {unassignedUsers.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">No unassigned users found</div>
              )}
            </DroppableZone>
          </div>
        </div>

        {/* Right Panel: Teams Grid */}
        <div className="lg:col-span-3 bg-card border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2"><Building2 className="size-4 text-primary" /> Organization Teams</h3>
            <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
              <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" /> New Team</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team Name</label>
                    <Input placeholder="e.g. Frontend Engineering" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="Optional team description" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam} disabled={loading || !newTeamName}>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map(team => (
                <div key={team._id} className="bg-background border rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {/* Team Header */}
                  <div className="p-4 border-b flex justify-between items-start bg-primary/5">
                    <div>
                      <h4 className="font-semibold text-primary">{team.teamName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{team.description || "No description"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1" onClick={() => handleDeleteTeam(team._id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* Manager Slot */}
                  <div className="p-4 border-b bg-muted/10">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Manager Slot</h5>
                    <DroppableZone id={`team-${team._id}-manager`} className={`min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center p-2 ${team.manager ? 'border-transparent' : 'border-primary/20 bg-primary/5'}`}>
                      {team.manager ? (
                        <DraggableUser user={team.manager} isCompact onRemove={() => handleRemoveMember(team.manager!._id, team._id, 'manager')} />
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Info className="size-3" /> Drop a Manager here</div>
                      )}
                    </DroppableZone>
                  </div>

                  {/* Employees Slot */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employees</h5>
                      <Badge variant="secondary" className="text-[10px]">{team.employees.length}</Badge>
                    </div>
                    <DroppableZone id={`team-${team._id}-employee`} className="min-h-[120px] border-2 border-dashed border-primary/20 bg-primary/5 rounded-lg p-2 space-y-2">
                      {team.employees.map(emp => (
                        <DraggableUser key={emp._id} user={emp} isCompact onRemove={() => handleRemoveMember(emp._id, team._id, 'employee')} />
                      ))}
                      {team.employees.length === 0 && (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground py-6">
                          Drop Employees here
                        </div>
                      )}
                    </DroppableZone>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <Building2 className="size-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-medium">No teams built yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">Create your first team to start assigning users.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragUser ? <DraggableUser user={activeDragUser} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Wrapper
function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} transition-colors ${isOver ? 'bg-primary/10 border-primary/50' : ''}`}>
      {children}
    </div>
  );
}

// Draggable User Card
function DraggableUser({ user, isCompact = false, isOverlay = false, onRemove }: { user: UserType; isCompact?: boolean; isOverlay?: boolean; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: user._id,
    data: user
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  
  const roleColor = user.role === "manager" ? "bg-orange-500/10 text-orange-600 border-orange-200" : "bg-blue-500/10 text-blue-600 border-blue-200";

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`
        bg-background border rounded-lg p-3 flex items-center gap-3 shadow-sm transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-30 scale-95' : 'hover:border-primary/50'}
        ${isOverlay ? 'opacity-100 scale-105 shadow-xl rotate-2 z-50 cursor-grabbing border-primary' : ''}
        ${isCompact ? 'p-2' : ''}
      `}
    >
      <GripVertical className="size-4 text-muted-foreground/50 shrink-0" />
      <Avatar className={isCompact ? "size-8" : "size-10"}>
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {user.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h5 className={`font-medium truncate ${isCompact ? 'text-sm' : 'text-sm'}`}>{user.name}</h5>
        {!isCompact && <p className="text-xs text-muted-foreground truncate">{user.designation || user.email}</p>}
      </div>
      <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${roleColor}`}>
        {user.role}
      </Badge>
      {onRemove && !isOverlay && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive z-10"
          onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}
