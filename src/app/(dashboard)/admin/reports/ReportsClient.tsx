"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReportsClient() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (quarterFilter) params.append("quarter", quarterFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [quarterFilter, statusFilter]);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (quarterFilter) params.append("quarter", quarterFilter);
    window.location.href = `/api/reports/export/csv?${params.toString()}`;
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (quarterFilter) params.append("quarter", quarterFilter);
    window.location.href = `/api/reports/export/excel?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <CardTitle className="text-xl">Report Data Viewer</CardTitle>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
            >
              <option value="">All Quarters</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4 / Annual</option>
            </select>
            <select
              className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b text-left">
                <tr>
                  <th className="p-3 font-medium">Employee</th>
                  <th className="p-3 font-medium">Team</th>
                  <th className="p-3 font-medium">Goal</th>
                  <th className="p-3 font-medium">Target</th>
                  <th className="p-3 font-medium">Actual</th>
                  <th className="p-3 font-medium">Progress</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center">Loading...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center">No data available for the selected filters.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{row.employeeName}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{row.teamName || "N/A"}</td>
                      <td className="p-3 max-w-[300px] truncate" title={row.goalTitle}>{row.goalTitle}</td>
                      <td className="p-3">{row.targetValue} {row.uomType === 'percentage' ? '%' : ''}</td>
                      <td className="p-3 font-semibold">{row.currentAchievement ?? "-"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={row.progressPercentage === 100 ? "border-green-500 text-green-600" : ""}>
                          {row.progressPercentage ?? 0}%
                        </Badge>
                      </td>
                      <td className="p-3 capitalize">{row.status.replace("_", " ")}</td>
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
