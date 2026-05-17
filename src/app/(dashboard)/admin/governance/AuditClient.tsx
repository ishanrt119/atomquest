"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { History, Search, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuditClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.append("entityType", entityFilter);
      if (actionFilter) params.append("actionType", actionFilter);
      params.append("limit", "50"); // Get latest 50

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="w-5 h-5" /> Audit Log Explorer
          </CardTitle>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Entity Type (e.g. GoalCycle)"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="UPDATED">Updated</option>
              <option value="ADMIN_OVERRIDE">Admin Override</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">Loading audit trail...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No audit logs found.</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="relative border rounded-lg p-4 bg-card shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{log.userId?.name || "System"}</span>
                        <Badge variant="outline" className="text-xs uppercase">{log.userRole}</Badge>
                        <span className="text-muted-foreground text-sm">performed</span>
                        <Badge className={log.actionType === 'ADMIN_OVERRIDE' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}>
                          {log.actionType}
                        </Badge>
                        <span className="text-muted-foreground text-sm">on</span>
                        <Badge variant="secondary">{log.entityType}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(log.changedAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
                      </div>

                      {log.reason && (
                        <div className="flex items-start gap-2 bg-muted/50 p-2 rounded-md border text-sm">
                          <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Reason: </span>
                            <span className="text-muted-foreground">{log.reason}</span>
                          </div>
                        </div>
                      )}

                      {(log.oldValue || log.newValue) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-muted/20 p-3 rounded-md border text-sm">
                          {log.fieldChanged && (
                            <div className="col-span-full font-medium mb-1 border-b pb-1">Field: {log.fieldChanged}</div>
                          )}
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase font-semibold">Previous Value</div>
                            <div className="font-mono text-red-500 bg-red-500/10 p-2 rounded break-all whitespace-pre-wrap">
                              {renderValue(log.oldValue)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase font-semibold">New Value</div>
                            <div className="font-mono text-green-600 bg-green-500/10 p-2 rounded break-all whitespace-pre-wrap">
                              {renderValue(log.newValue)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
