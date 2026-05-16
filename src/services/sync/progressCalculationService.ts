/**
 * Progress Calculation Service
 * 
 * SINGLE SOURCE OF TRUTH for all progress percentage calculations.
 * 
 * Calculates goal progress percentage dynamically based on the Unit of Measure (UoM)
 * type and the defined measurement directions.
 * 
 * ────────────────────────────────────────────────────────────────────
 * FORMULA REFERENCE
 * ────────────────────────────────────────────────────────────────────
 * 
 * MAX (Higher is better, e.g. revenue):
 *   rawProgress = (actual / target) × 100
 *   Example: 500 / 5000 × 100 = 10%
 * 
 * MIN (Lower is better, e.g. defects):
 *   rawProgress = (target / actual) × 100
 *   If actual === 0 → 100% (perfect score)
 *   Example: Target 10, Actual 5 → (10/5)×100 = 200%
 * 
 * TIMELINE:
 *   On/before deadline → 100%
 *   Delayed ≤ 30 days → scaled penalty
 *   Delayed > 30 days → 0%
 * 
 * ZERO (e.g. zero defects):
 *   actual === 0 → 100%
 *   else → 0%
 * ────────────────────────────────────────────────────────────────────
 */

export interface ProgressResult {
  rawProgressPercentage: number;
  displayProgressPercentage: number;
  progressStatusLabel: string;
}

export function calculateProgress(
  uomType: string,
  measurementDirection: string,
  targetValue: number | undefined,
  actualValue: number | null | undefined,
  targetDate: string | Date | undefined,
  actualDate: string | Date | null | undefined
): ProgressResult {
  let raw = 0;

  if (uomType === "timeline") {
    if (!targetDate || !actualDate) {
      raw = 0;
    } else {
      const targetTime = new Date(targetDate).getTime();
      const actualTime = new Date(actualDate).getTime();

      if (actualTime <= targetTime) {
        raw = 100;
      } else {
        const delayDays = (actualTime - targetTime) / (1000 * 60 * 60 * 24);
        if (delayDays > 30) raw = 0;
        else raw = Math.round(100 - (delayDays * 3.33));
      }
    }
  } else if (uomType === "zero") {
    // Zero-based: achievement of exactly 0 = success
    raw = Number(actualValue) === 0 ? 100 : 0;
  } else {
    // numeric & percentage UoM types
    const target = Number(targetValue);
    const actual = Number(actualValue);

    if (isNaN(target) || isNaN(actual)) {
      raw = 0;
    } else if (target === 0 && actual === 0) {
      raw = 100;
    } else if (target === 0) {
      // Divide-by-zero protection: target is 0 but actual is not
      raw = 0;
    } else if (measurementDirection === "max") {
      // MAX = Higher is better (e.g. increase revenue)
      // Formula: (actual / target) × 100
      raw = Math.round((actual / target) * 100);
    } else {
      // MIN = Lower is better (e.g. reduce defects)
      // Formula: (target / actual) × 100
      if (actual === 0) {
        raw = 100; // Perfect score — achieved zero
      } else {
        raw = Math.round((target / actual) * 100);
      }
    }
  }

  // Generate human-readable label
  let label: string;
  if (raw > 100) {
    label = `Exceeded Target (${raw}%)`;
  } else if (raw === 100) {
    label = "Target Completed";
  } else if (raw === 0) {
    label = "Not Started";
  } else {
    label = `${raw}% Achieved`;
  }

  return {
    rawProgressPercentage: raw,
    displayProgressPercentage: Math.min(raw, 100),
    progressStatusLabel: label,
  };
}

/**
 * Derives qualitative status from quantitative progress
 */
export function deriveStatusFromProgress(
  progress: number
): "not_started" | "at_risk" | "on_track" | "completed" | "exceeded" {
  if (progress > 100) return "exceeded";
  if (progress === 100) return "completed";
  if (progress >= 50) return "on_track";
  if (progress > 0) return "at_risk";
  return "not_started";
}
