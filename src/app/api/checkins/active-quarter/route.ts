import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const month = now.getMonth(); // 0-11

  // Financial Year starts May (Month 4). Q1: July, Q2: Oct, Q3: Jan, Q4: Apr.
  // We'll simplify quarter logic for the demo:
  let activeQuarter = "Q1";
  
  if (month >= 3 && month <= 5) {
    activeQuarter = "Q4"; // April, May, June
  } else if (month >= 6 && month <= 8) {
    activeQuarter = "Q1"; // July, August, September
  } else if (month >= 9 && month <= 11) {
    activeQuarter = "Q2"; // October, November, December
  } else {
    activeQuarter = "Q3"; // January, February, March
  }

  // To simulate restrictions, let's assume the window is ALWAYS open for demonstration.
  // In reality, we'd check if `month === 6` (July) for Q1 window, etc.
  const isWindowOpen = true; 

  return NextResponse.json({
    activeQuarter,
    isWindowOpen,
    currentMonth: month,
    message: isWindowOpen ? "Quarterly Check-in window is OPEN." : "Quarterly Check-in window is CLOSED."
  });
}
