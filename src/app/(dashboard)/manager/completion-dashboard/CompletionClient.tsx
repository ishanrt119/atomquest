"use client";

import { useState, useEffect } from "react";
import { Users, FileCheck2, UserCheck2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CompletionClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");

  const fetchCompletion = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/completion?quarter=${q}` : "/api/completion";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletion();
  }, []);

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const q = e.target.value;
    setQuarter(q);
    fetchCompletion(q);
  };

  if (loading) {
    return <div className="text-center py-10">Loading real-time data...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={quarter}
          onChange={handleQuarterChange}
        >
          <option value="">Auto (Active)</option>
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.submittedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Employees completed check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviewed</CardTitle>
            <UserCheck2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reviewedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Manager reviews completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending submissions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Submission Progress</CardTitle>
            <CardDescription>Percentage of team that has submitted their check-ins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm font-medium">{data.completionPercentage}%</span>
            </div>
            <Progress value={data.completionPercentage} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manager Review Progress</CardTitle>
            <CardDescription>Percentage of submitted check-ins that have been reviewed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reviews Done</span>
              <span className="text-sm font-medium">{data.reviewPercentage}%</span>
            </div>
            <Progress value={data.reviewPercentage} className="h-3" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b text-left">
                <tr>
                  <th className="p-3 font-medium">Employee Name</th>
                  <th className="p-3 font-medium">Quarter</th>
                  <th className="p-3 font-medium">Progress %</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {data.checkins.map((ci: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{ci.employee?.name || 'Unknown'}</td>
                    <td className="p-3">{ci.quarter}</td>
                    <td className="p-3">{ci.progressPercentage ?? 0}%</td>
                    <td className="p-3 capitalize">{ci.status}</td>
                    <td className="p-3 text-muted-foreground">
                      {ci.checkinSubmittedAt ? new Date(ci.checkinSubmittedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
                {data.checkins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">No check-ins found for this quarter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
