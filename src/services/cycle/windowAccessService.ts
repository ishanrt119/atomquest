import { getActiveCycleStatus, CyclePhase } from "./activeQuarterService";

export type ActionType = 
  | "CREATE_GOAL" 
  | "EDIT_GOAL" 
  | "SUBMIT_GOALS" 
  | "APPROVE_GOALS"
  | "UPDATE_ACHIEVEMENTS" 
  | "SUBMIT_CHECKIN" 
  | "APPROVE_CHECKIN"
  | "FINAL_SUBMISSION" 
  | "ANNUAL_REVIEW";

export const validateActionAccess = async (action: ActionType, employeeId?: string): Promise<{ allowed: boolean; reason?: string; phase: CyclePhase }> => {
  const status = await getActiveCycleStatus(employeeId);

  if (status.activePhase === "LOCKED") {
    return { allowed: false, reason: "The current window is closed. Editing is currently locked.", phase: status.activePhase };
  }

  if (status.activePhase === "NOT_STARTED") {
    return { allowed: false, reason: "The cycle has not started yet.", phase: status.activePhase };
  }

  if (status.allowedActions.includes(action)) {
    return { allowed: true, phase: status.activePhase };
  }

  return { allowed: false, reason: `Action ${action} is not allowed during the ${status.activePhase} phase.`, phase: status.activePhase };
};
