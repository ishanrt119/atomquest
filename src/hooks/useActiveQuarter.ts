import { useState, useEffect } from "react";

export type CyclePhase = "GOAL_SETTING" | "Q1" | "Q2" | "Q3" | "Q4" | "LOCKED" | "NOT_STARTED";

export interface ActiveQuarterData {
  activeQuarter: CyclePhase;
  allowedActions: string[];
  cycleStatus: "ACTIVE" | "INACTIVE";
  nextWindow: string | null;
  adminOverrideActive: boolean;
  cycleYear: number | null;
}

export function useActiveQuarter() {
  const [data, setData] = useState<ActiveQuarterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveQuarter = async () => {
      try {
        const res = await fetch("/api/active-quarter");
        if (!res.ok) throw new Error("Failed to fetch active quarter");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveQuarter();
  }, []);

  const canPerformAction = (action: string) => {
    if (!data) return false;
    return data.allowedActions.includes(action);
  };

  return { data, loading, error, canPerformAction };
}
