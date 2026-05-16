/**
 * Progress Calculation Service
 * 
 * Calculates goal progress percentage dynamically based on the Unit of Measure (UoM)
 * type and the defined measurement directions.
 */

export function calculateProgress(
  uomType: string,
  measurementDirection: string,
  targetValue: number | undefined,
  actualValue: number | null | undefined,
  targetDate: string | undefined,
  actualDate: string | null | undefined
): { rawProgressPercentage: number; displayProgressPercentage: number } {
  let raw = 0;

  if (uomType === "timeline") {
    if (!targetDate || !actualDate) raw = 0;
    else {
      const targetTime = new Date(targetDate).getTime();
      const actualTime = new Date(actualDate).getTime();

      // Completed on or before target date = 100%
      if (actualTime <= targetTime) raw = 100;
      else {
        // Delayed calculate penalty
        const delayDays = (actualTime - targetTime) / (1000 * 60 * 60 * 24);

        // Over 30 days delayed = 0%
        if (delayDays > 30) raw = 0;
        else raw = Math.round(100 - delayDays * 3.33);
      }
    }
  } else if (uomType === "zero") {
    // 0 implies success, anything else is failure
    raw = Number(actualValue) === 0 ? 100 : 0;
  } else {
    const target = Number(targetValue);
    const actual = Number(actualValue);

    if (target && !isNaN(actual)) {
      if (measurementDirection === "min") {
        // Lower is better (e.g. reduce defects)
        if (actual === 0) raw = 100; // or infinite? Cap logic dictates 100 is target hit.
        else raw = Math.round((target / actual) * 100);
      } else {
        // measurementDirection === "max"
        // Higher is better (e.g. increase sales)
        raw = Math.round((actual / target) * 100);
      }
    }
  }

  return {
    rawProgressPercentage: raw,
    displayProgressPercentage: Math.min(raw, 100),
  };
}

/**
 * Derives qualitative status from quantitative progress
 */
export function deriveStatusFromProgress(progress: number): "not_started" | "at_risk" | "on_track" | "completed" | "exceeded" {
  if (progress > 100) return "exceeded";
  if (progress === 100) return "completed";
  if (progress >= 50) return "on_track";
  if (progress > 0) return "at_risk";
  return "not_started";
}
