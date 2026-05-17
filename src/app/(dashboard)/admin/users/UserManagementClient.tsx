"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, UserPlus, Mail, ShieldBan, ShieldCheck, MailWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function UserManagementClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", role: "employee" });
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setAddForm({ name: "", email: "", role: "employee" });
        fetchUsers();
        alert("User created and invitation sent successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create user.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (userId: string, action: "disable" | "activate") => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      const res = await fetch("/api/invitations/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        alert("Invitation resent successfully!");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to resend invitation.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeCount = users.filter((u) => u.isActive && u.onboardingStatus === "active").length;
  const invitedCount = users.filter((u) => u.onboardingStatus === "invited").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{invitedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Managers</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "manager").length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button />}>
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Provision New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded border">
                  Upon creation, the user will automatically receive an email with their login credentials and a temporary password.
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Sending..." : "Create & Send Invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b text-left">
                <tr>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Last Login</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">No users found.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3">
                        {user.isActive ? (
                          user.onboardingStatus === 'active' ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge className="bg-blue-500 hover:bg-blue-600">Invited</Badge>
                          )
                        ) : (
                          <Badge variant="secondary" className="text-red-500">Disabled</Badge>
                        )}
                        {user.passwordResetRequired && <Badge variant="outline" className="ml-2 text-[10px]">Reset Req</Badge>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy") : "Never"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(user.onboardingStatus === "invited" || user.passwordResetRequired) && user.isActive && (
                            <Button variant="outline" size="sm" onClick={() => handleResendInvite(user._id)} title="Resend Invite">
                              <MailWarning className="w-4 h-4" />
                            </Button>
                          )}
                          {user.isActive ? (
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleToggleStatus(user._id, "disable")} title="Disable User">
                              <ShieldBan className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="text-green-500 hover:text-green-600" onClick={() => handleToggleStatus(user._id, "activate")} title="Activate User">
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
