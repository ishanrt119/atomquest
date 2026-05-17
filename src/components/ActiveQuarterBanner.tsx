"use client";

import { useActiveQuarter } from "@/hooks/useActiveQuarter";
import { AlertCircle, Calendar, Lock, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ActiveQuarterBanner() {
  const { data, loading, error } = useActiveQuarter();

  if (loading || error || !data) return null;

  if (data.activeQuarter === "LOCKED") {
    return (
      <Alert className="mb-6 border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-200">
        <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">Quarter Window Closed</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400/90">
          Editing is currently locked. The system is awaiting the next active phase.
        </AlertDescription>
      </Alert>
    );
  }

  if (data.activeQuarter === "NOT_STARTED") {
    return (
      <Alert className="mb-6 border-muted bg-muted/50">
        <Calendar className="h-5 w-5" />
        <AlertTitle className="font-semibold">Cycle Not Started</AlertTitle>
        <AlertDescription>
          The goal cycle has not yet started. Check back later.
        </AlertDescription>
      </Alert>
    );
  }

  const isGoalSetting = data.activeQuarter === "GOAL_SETTING";
  const daysRemaining = data.nextWindow ? differenceInDays(new Date(data.nextWindow), new Date()) : 0;
  
  const getBannerConfig = () => {
    switch (data.activeQuarter) {
      case "GOAL_SETTING":
        return {
          title: "Goal Setting Window Open",
          desc: `You can create and submit goals until ${data.nextWindow ? format(new Date(data.nextWindow), "MMMM d") : "the deadline"}.`,
          icon: CheckCircle2,
          colorClass: "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-200",
          iconClass: "text-blue-600 dark:text-blue-400"
        };
      case "Q4":
        return {
          title: "Q4 / Annual Review Active",
          desc: `Final achievement capture is open until ${data.nextWindow ? format(new Date(data.nextWindow), "MMMM d") : "the deadline"}.`,
          icon: AlertCircle,
          colorClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
          iconClass: "text-emerald-600 dark:text-emerald-400"
        };
      default:
        return {
          title: `${data.activeQuarter} Check-in Window Active`,
          desc: `Update your planned vs actual achievements. Window closes on ${data.nextWindow ? format(new Date(data.nextWindow), "MMMM d") : "the deadline"}.`,
          icon: AlertCircle,
          colorClass: "border-purple-500/50 bg-purple-500/10 text-purple-900 dark:text-purple-200",
          iconClass: "text-purple-600 dark:text-purple-400"
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  return (
    <Alert className={`mb-6 ${config.colorClass}`}>
      <Icon className={`h-5 w-5 ${config.iconClass}`} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <AlertTitle className="font-semibold text-current">{config.title}</AlertTitle>
          <AlertDescription className="opacity-90">
            {config.desc}
          </AlertDescription>
        </div>
        {daysRemaining > 0 && (
          <div className="mt-2 sm:mt-0 font-medium whitespace-nowrap bg-background/50 px-3 py-1 rounded-md text-sm border shadow-sm">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
          </div>
        )}
      </div>
    </Alert>
  );
}
