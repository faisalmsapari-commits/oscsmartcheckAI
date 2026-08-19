/**
 * Deterministic Normalization Utilities for Malaysian Planning Information
 * Never uses stochastic AI where simple deterministic math and regex parsing is possible.
 */

/**
 * Normalizes an area value into square meters (m²)
 */
export function normalizeArea(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return input > 0 ? Number(input.toFixed(2)) : null;

  const str = String(input).trim().toLowerCase().replace(/,/g, "");
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch || !numMatch[1]) return null;

  const val = parseFloat(numMatch[1]);
  if (isNaN(val) || val <= 0) return null;

  // Hectare detection
  if (str.includes("hektar") || str.includes("hectare") || str.includes("ha")) {
    return Number((val * 10000.0).toFixed(2));
  }

  // Acre detection
  if (str.includes("ekar") || str.includes("acre") || str.includes("ac")) {
    return Number((val * 4046.86).toFixed(2));
  }

  // Default to SQM
  return Number(val.toFixed(2));
}

/**
 * Normalizes plot ratio string (e.g. "1:2.5", "1:3", "2.5") to float value
 */
export function normalizePlotRatio(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return input > 0 ? Number(input.toFixed(2)) : null;

  const str = String(input).trim();
  if (str.includes(":")) {
    const parts = str.split(":");
    if (parts.length === 2 && parts[1]) {
      const parsed = parseFloat(parts[1].trim());
      return isNaN(parsed) || parsed <= 0 ? null : Number(parsed.toFixed(2));
    }
  }

  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch || !numMatch[1]) return null;
  const val = parseFloat(numMatch[1]);
  return isNaN(val) || val <= 0 ? null : Number(val.toFixed(2));
}

/**
 * Normalizes percentage values (e.g. "10%", "45 %", "0.45") to a 0-100 range number
 */
export function normalizePercentage(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    // If between 0 and 1 (decimal), convert to 0-100%
    if (input > 0 && input <= 1) return Number((input * 100).toFixed(2));
    return input >= 0 && input <= 100 ? Number(input.toFixed(2)) : null;
  }

  const str = String(input).trim();
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch || !numMatch[1]) return null;

  const val = parseFloat(numMatch[1]);
  if (isNaN(val) || val < 0) return null;

  // Decimal percentage e.g. 0.35
  if (val > 0 && val < 1 && !str.includes("%")) {
    return Number((val * 100).toFixed(2));
  }

  return val <= 100 ? Number(val.toFixed(2)) : null;
}

/**
 * Normalizes integer quantities (units, parking spaces, floors, rooms)
 */
export function normalizeInteger(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Math.floor(input) >= 0 ? Math.floor(input) : null;

  const str = String(input).trim().replace(/,/g, "");
  const numMatch = str.match(/([0-9]+)/);
  if (!numMatch || !numMatch[1]) return null;

  const val = parseInt(numMatch[1], 10);
  return isNaN(val) || val < 0 ? null : val;
}

/**
 * Normalizes distance or width (e.g. road reserves) to meters
 */
export function normalizeDistance(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return input > 0 ? Number(input.toFixed(2)) : null;

  const str = String(input).trim().toLowerCase();
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch || !numMatch[1]) return null;

  const val = parseFloat(numMatch[1]);
  if (isNaN(val) || val <= 0) return null;

  // Feet detection (e.g. "66 kaki", "66 ft")
  if (str.includes("kaki") || str.includes("ft") || str.includes("feet") || str.includes("'")) {
    return Number((val * 0.3048).toFixed(2));
  }

  // Default to meters
  return Number(val.toFixed(2));
}

/**
 * Cleans and standardizes unit text
 */
export function normalizeUnitText(rawUnit: string | null | undefined): string | null {
  if (!rawUnit) return null;
  const str = rawUnit.trim().toLowerCase();

  if (str.includes("sqm") || str.includes("m2") || str.includes("m²") || str.includes("meter persegi")) {
    return "m²";
  }
  if (str.includes("hektar") || str.includes("ha")) {
    return "hektar";
  }
  if (str.includes("ekar") || str.includes("acre")) {
    return "ekar";
  }
  if (str.includes("petak") || str.includes("bay") || str.includes("parking")) {
    return "petak";
  }
  if (str.includes("unit") || str.includes("pintu")) {
    return "unit";
  }
  if (str.includes("tingkat") || str.includes("storey") || str.includes("floor")) {
    return "tingkat";
  }
  if (str.includes("meter") || str.includes("m")) {
    return "meter";
  }
  if (str.includes("kaki") || str.includes("ft")) {
    return "kaki";
  }
  if (str.includes("%") || str.includes("peratus")) {
    return "%";
  }
  if (str.includes("nisbah") || str.includes("ratio")) {
    return "nisbah";
  }

  return rawUnit.trim();
}
