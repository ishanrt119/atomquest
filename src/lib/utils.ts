import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFinancialQuarter(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  if (month >= 3 && month <= 5) return "Q1";
  if (month >= 6 && month <= 8) return "Q2";
  if (month >= 9 && month <= 11) return "Q3";
  return "Q4"; // Jan, Feb, Mar
}

export function getFinancialYear(date: Date = new Date()): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  // If the month is Jan, Feb, or Mar, it belongs to the previous financial year
  return month < 3 ? year - 1 : year;
}
