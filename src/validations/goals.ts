import { z } from "zod";

export const GoalZodSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  thrustArea: z.string().optional(),
  uomType: z.enum(["numeric", "percentage", "timeline", "zero"]),
  measurementDirection: z.enum(["min", "max"]),
  weightage: z.coerce.number().min(10, "Weightage must be at least 10%"),
  isSharedGoal: z.boolean().optional(),
  
  targetValue: z.coerce.number().optional(),
  targetDate: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if (data.uomType === "percentage") {
    if (data.targetValue === undefined || data.targetValue < 0 || data.targetValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "Percentage target must be between 0 and 100",
      });
    }
  } else if (data.uomType === "zero") {
    if (data.targetValue !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "Target must be exactly 0 for zero-based goals",
      });
    }
  } else if (data.uomType === "numeric") {
    if (data.targetValue === undefined || isNaN(data.targetValue) || data.targetValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "Numeric target must be a positive number",
      });
    }
  } else if (data.uomType === "timeline") {
    if (!data.targetDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDate"],
        message: "Timeline goals require a target date",
      });
    } else if (data.targetDate < new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDate"],
        message: "Target date must be in the future",
      });
    }
  }
});

export const GoalArrayZodSchema = z.object({
  goals: z.array(GoalZodSchema)
    .min(1, "At least one goal is required")
    .max(8, "Maximum of 8 goals allowed")
}).superRefine((data, ctx) => {
  const totalWeightage = data.goals.reduce((acc, goal) => acc + (goal.weightage || 0), 0);
  if (totalWeightage !== 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["goals"],
      message: `Total weightage must equal exactly 100%. Current total is ${totalWeightage}%.`,
    });
  }
});

export type GoalFormValues = z.infer<typeof GoalArrayZodSchema>;

// Keep the old validateGoalsArray for backward compatibility with existing backend routes if needed
export type GoalInput = {
  title: string;
  description?: string;
  thrustArea?: string;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  measurementDirection: "min" | "max";
  targetValue?: number;
  targetDate?: Date;
  weightage: number;
};

export function validateGoalsArray(goals: GoalInput[]): { isValid: boolean; error?: string } {
  try {
    GoalArrayZodSchema.parse({ goals });
    return { isValid: true };
  } catch (err: any) {
    // Return first error message
    const firstError = err.errors[0];
    return { isValid: false, error: firstError.message };
  }
}
