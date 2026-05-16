import { NextRequest, NextResponse } from "next/server";
import { calculateProgress, deriveStatusFromProgress } from "@/services/sync/progressCalculationService";

/**
 * POST /api/progress/calculate
 *
 * Stateless progress calculation endpoint.
 * Takes goal parameters and returns standardized progress fields.
 *
 * Used by UI components that need to preview progress before persisting.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      uomType,
      measurementDirection,
      targetValue,
      actualValue,
      targetDate,
      actualDate,
    } = await req.json();

    const result = calculateProgress(
      uomType || "numeric",
      measurementDirection || "max",
      targetValue,
      actualValue,
      targetDate,
      actualDate
    );

    const status = deriveStatusFromProgress(result.rawProgressPercentage);

    return NextResponse.json({
      success: true,
      data: {
        rawProgressPercentage: result.rawProgressPercentage,
        displayProgressPercentage: result.displayProgressPercentage,
        progressStatusLabel: result.progressStatusLabel,
        status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
