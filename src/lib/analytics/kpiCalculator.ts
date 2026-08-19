import type { AnalyticsTimePreset } from "../../types/analytics.ts";

/**
 * Calculates arithmetic mean safely
 */
export function calculateAverage(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / numbers.length).toFixed(2));
}

/**
 * Calculates statistical median safely
 */
export function calculateMedian(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }
  return Number(sorted[mid].toFixed(2));
}

/**
 * Calculates percentile (e.g. p=75, p=90)
 */
export function calculatePercentile(numbers: number[], p: number): number {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return Number(sorted[lower].toFixed(2));
  return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
}

/**
 * Calculates percentage with 1 decimal precision
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

/**
 * Formats sample denominator text (e.g. "30% (3 daripada 10 permohonan)")
 */
export function formatSampleDenominator(count: number, total: number): string {
  if (total === 0) return "0 daripada 0";
  return `${count} daripada ${total}`;
}

/**
 * Computes standard date range from preset
 */
export function computeDateRangeFromPreset(
  preset: AnalyticsTimePreset = "30_DAYS",
  customFrom?: string,
  customTo?: string,
  nowDate: Date = new Date()
): { from: string; to: string } {
  const to = customTo || nowDate.toISOString();
  let fromDate = new Date(nowDate);

  switch (preset) {
    case "TODAY":
      fromDate.setHours(0, 0, 0, 0);
      break;
    case "7_DAYS":
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case "30_DAYS":
      fromDate.setDate(fromDate.getDate() - 30);
      break;
    case "THIS_MONTH":
      fromDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      break;
    case "QUARTER":
      fromDate.setDate(fromDate.getDate() - 90);
      break;
    case "THIS_YEAR":
      fromDate = new Date(nowDate.getFullYear(), 0, 1);
      break;
    case "CUSTOM":
      if (customFrom) {
        return { from: customFrom, to: customTo || nowDate.toISOString() };
      }
      fromDate.setDate(fromDate.getDate() - 30);
      break;
  }

  return { from: fromDate.toISOString(), to };
}

/**
 * Determines age bucket for an issue
 */
export function bucketIssueAge(
  createdAtStr: string | Date | number,
  nowDate: Date = new Date()
): "0_3" | "4_7" | "8_14" | "15_30" | "OVER_30" {
  const created = new Date(createdAtStr);
  const diffMs = nowDate.getTime() - created.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays <= 3) return "0_3";
  if (diffDays <= 7) return "4_7";
  if (diffDays <= 14) return "8_14";
  if (diffDays <= 30) return "15_30";
  return "OVER_30";
}
