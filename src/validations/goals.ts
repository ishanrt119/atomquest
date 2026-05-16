export type GoalInput = {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  measurementDirection: "min" | "max";
  target: number;
  weightage: number;
};

export function validateGoalsArray(goals: GoalInput[]): { isValid: boolean; error?: string } {
  if (!goals || goals.length === 0) {
    return { isValid: false, error: "You must add at least one goal to the sheet." };
  }

  if (goals.length > 8) {
    return { isValid: false, error: "You cannot exceed a maximum of 8 goals per cycle." };
  }

  let totalWeightage = 0;

  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    
    if (!goal.title || goal.title.trim() === "") {
      return { isValid: false, error: `Goal #${i + 1} is missing a title.` };
    }
    
    if (goal.target === undefined || goal.target === null || isNaN(goal.target)) {
      return { isValid: false, error: `Goal #${i + 1} must have a valid target.` };
    }

    if (goal.weightage < 10) {
      return { isValid: false, error: `Goal "${goal.title}" has a weightage below the 10% minimum.` };
    }

    totalWeightage += goal.weightage;
  }

  if (totalWeightage !== 100) {
    return { isValid: false, error: `Total weightage must equal exactly 100%. Current total is ${totalWeightage}%.` };
  }

  return { isValid: true };
}
