import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uomType, measurementDirection, targetValue, actualValue, targetDate, actualDate } = await req.json();

    let progressPercentage = 0;

    if (uomType === "numeric" || uomType === "percentage") {
      const tv = Number(targetValue);
      const av = Number(actualValue);

      if (tv && !isNaN(av)) {
        if (measurementDirection === "min") {
          // Lower is better (e.g. Target Cost 10, Actual 5 => 200%)
          // Prevent divide by zero if actual is 0 (though normally cost shouldn't be 0, if it is, that's infinite progress. Let's cap at 100%)
          if (av === 0) {
            progressPercentage = 100;
          } else {
            progressPercentage = Math.round((tv / av) * 100);
          }
        } else {
          // Higher is better (e.g. Target Rev 100, Actual 80 => 80%)
          progressPercentage = Math.round((av / tv) * 100);
        }
      }
    } else if (uomType === "timeline") {
      if (targetDate && actualDate) {
        const target = new Date(targetDate).getTime();
        const actual = new Date(actualDate).getTime();

        if (actual <= target) {
          progressPercentage = 100; // on time or early
        } else {
          // Calculate delay impact. Let's say if it's within 30 days late, it scales down. If >30 days, 0.
          const delayDays = (actual - target) / (1000 * 60 * 60 * 24);
          if (delayDays > 30) progressPercentage = 0;
          else progressPercentage = Math.round(100 - (delayDays * 3.33));
        }
      } else if (actualDate) {
        // Has actual date but no target date?? Just say 100%
        progressPercentage = 100;
      }
    } else if (uomType === "zero") {
      // 0 = Success (e.g., 0 defects)
      const av = Number(actualValue);
      if (av === 0) {
        progressPercentage = 100;
      } else {
        progressPercentage = 0;
      }
    }

    // Cap progress at 100% for the UI (or allow overflow for dashboards if requested)
    progressPercentage = Math.min(100, Math.max(0, progressPercentage));

    return NextResponse.json({ success: true, data: { progressPercentage } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
