import { GoalCycle, IGoalCycle } from "@/models/GoalCycle";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export type CyclePhase = "GOAL_SETTING" | "Q1" | "Q2" | "Q3" | "Q4" | "LOCKED" | "NOT_STARTED";

export interface ActiveQuarterResponse {
  cycleId: string | null;
  activePhase: CyclePhase;
  allowedActions: string[];
  currentWindowEnd: Date | null;
  cycleYear: number | null;
  adminOverrideActive: boolean;
}

export const getActiveCycleStatus = async (employeeId?: string): Promise<ActiveQuarterResponse> => {
  await connectToDatabase();

  const activeCycle = await GoalCycle.findOne({ isActive: true }).exec();

  if (!activeCycle) {
    return {
      cycleId: null,
      activePhase: "LOCKED",
      allowedActions: [],
      currentWindowEnd: null,
      cycleYear: null,
      adminOverrideActive: false
    };
  }

  const now = new Date();

  // Check admin overrides first
  if (
    activeCycle.adminOverride?.isOverridden &&
    activeCycle.adminOverride.overrideEndDate &&
    new Date(activeCycle.adminOverride.overrideEndDate) > now
  ) {
    // If specific employees are targeted for unlock, check if employeeId is included
    const unlockedEmployees = activeCycle.adminOverride.unlockedEmployeeIds || [];
    const isGloballyUnlocked = unlockedEmployees.length === 0;
    const isEmployeeUnlocked = employeeId && unlockedEmployees.some((id: mongoose.Types.ObjectId) => id.toString() === employeeId);

    if (isGloballyUnlocked || isEmployeeUnlocked) {
      const phase = activeCycle.adminOverride.overriddenPhase as CyclePhase || "LOCKED";
      return {
        cycleId: activeCycle._id.toString(),
        activePhase: phase,
        allowedActions: getAllowedActions(phase),
        currentWindowEnd: activeCycle.adminOverride.overrideEndDate,
        cycleYear: activeCycle.cycleYear,
        adminOverrideActive: true
      };
    }
  }

  // Normal date-based logic
  let activePhase: CyclePhase = "LOCKED";
  let currentWindowEnd: Date | null = null;

  if (now >= new Date(activeCycle.goalSettingStart) && now <= new Date(activeCycle.goalSettingEnd)) {
    activePhase = "GOAL_SETTING";
    currentWindowEnd = activeCycle.goalSettingEnd;
  } else if (now >= new Date(activeCycle.q1Start) && now <= new Date(activeCycle.q1End)) {
    activePhase = "Q1";
    currentWindowEnd = activeCycle.q1End;
  } else if (now >= new Date(activeCycle.q2Start) && now <= new Date(activeCycle.q2End)) {
    activePhase = "Q2";
    currentWindowEnd = activeCycle.q2End;
  } else if (now >= new Date(activeCycle.q3Start) && now <= new Date(activeCycle.q3End)) {
    activePhase = "Q3";
    currentWindowEnd = activeCycle.q3End;
  } else if (now >= new Date(activeCycle.q4Start) && now <= new Date(activeCycle.q4End)) {
    activePhase = "Q4";
    currentWindowEnd = activeCycle.q4End;
  } else if (now < new Date(activeCycle.goalSettingStart)) {
    activePhase = "NOT_STARTED";
  }

  return {
    cycleId: activeCycle._id.toString(),
    activePhase,
    allowedActions: getAllowedActions(activePhase),
    currentWindowEnd,
    cycleYear: activeCycle.cycleYear,
    adminOverrideActive: false
  };
};

const getAllowedActions = (phase: CyclePhase): string[] => {
  switch (phase) {
    case "GOAL_SETTING":
      return ["CREATE_GOAL", "EDIT_GOAL", "SUBMIT_GOALS", "APPROVE_GOALS"];
    case "Q1":
    case "Q2":
    case "Q3":
      return ["UPDATE_ACHIEVEMENTS", "SUBMIT_CHECKIN", "APPROVE_CHECKIN"];
    case "Q4":
      return ["UPDATE_ACHIEVEMENTS", "SUBMIT_CHECKIN", "APPROVE_CHECKIN", "FINAL_SUBMISSION", "ANNUAL_REVIEW"];
    case "LOCKED":
    case "NOT_STARTED":
    default:
      return ["READ_ONLY"];
  }
};
