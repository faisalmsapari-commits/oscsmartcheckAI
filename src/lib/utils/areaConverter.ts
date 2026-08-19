import type { AreaUnit } from "@/types/application";

export const SQM_PER_HECTARE = 10000;
export const SQM_PER_ACRE = 4046.86;

/**
 * Calculates normalized site area in square meters (sqm) from any supported unit.
 */
export function convertToSqm(value: number | null | undefined, unit: AreaUnit): number | null {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return null;
  }

  switch (unit) {
    case "HECTARE":
      return Math.round(value * SQM_PER_HECTARE * 100) / 100;
    case "ACRE":
      return Math.round(value * SQM_PER_ACRE * 100) / 100;
    case "SQM":
    default:
      return Math.round(value * 100) / 100;
  }
}

/**
 * Formats an area value with standard localized unit labels.
 */
export function formatArea(value: number | null | undefined, unit: AreaUnit = "SQM"): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }

  const formattedNum = new Intl.NumberFormat("ms-MY", {
    maximumFractionDigits: 2,
  }).format(value);

  switch (unit) {
    case "HECTARE":
      return `${formattedNum} Hektar`;
    case "ACRE":
      return `${formattedNum} Ekar`;
    case "SQM":
    default:
      return `${formattedNum} m²`;
  }
}
