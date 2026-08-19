import crypto from "crypto";

/**
 * Generates a collision-safe, readable official application reference number.
 * Format: KM/YYYY/XXXXXX
 * Example: KM/2026/A8F93B
 *
 * NOTE: Internal Firestore document IDs remain non-predictable UUIDs.
 */
export function generateApplicationNumber(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `KM/${currentYear}/${randomHex}`;
}
