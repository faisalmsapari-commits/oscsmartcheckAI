import type { FormulaDefinition, CalculationTrace } from "../../types/rules.ts";

export function safeCeil(val: number): number {
  return Math.ceil(val);
}

export function safeFloor(val: number): number {
  return Math.floor(val);
}

export function safeRound(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function safeDivide(a: number, b: number): number {
  if (b === 0) throw new Error("Pembahagian dengan sifar tidak dibenarkan.");
  return a / b;
}

/**
 * Deterministic formula evaluation engine with step-by-step trace for explainability
 */
export function evaluateFormula(
  formula: FormulaDefinition,
  inputs: Record<string, unknown>
): { result: number; trace: CalculationTrace } {
  const { formulaType, parameters } = formula;
  const steps: string[] = [];
  let result = 0;

  switch (formulaType) {
    case "CEIL_DIVIDE_MULTIPLY": {
      // e.g. requiredParking = ceil(hotelRooms / roomsPerUnit) * rate
      const baseVal = Number(inputs.baseValue ?? inputs.rooms ?? inputs.units ?? 0);
      const divisor = Number(parameters.divisor ?? parameters.roomsPerUnit ?? parameters.perUnits ?? 1);
      const multiplier = Number(parameters.multiplier ?? parameters.rate ?? parameters.parkingRequired ?? 1);

      const divided = safeDivide(baseVal, divisor);
      const ceiled = safeCeil(divided);
      result = ceiled * multiplier;

      steps.push(`${baseVal} / ${divisor} = ${safeRound(divided, 4)}`);
      steps.push(`ceil(${safeRound(divided, 4)}) = ${ceiled}`);
      steps.push(`${ceiled} × ${multiplier} = ${result}`);
      break;
    }

    case "PERCENT_OF": {
      // e.g. requiredOpenSpace = siteArea * (percent / 100)
      const baseArea = Number(inputs.baseArea ?? inputs.siteAreaSqm ?? 0);
      const percent = Number(parameters.percent ?? parameters.requiredPercent ?? 10);

      result = safeRound(baseArea * (percent / 100), 2);
      steps.push(`${baseArea} × (${percent} / 100) = ${result}`);
      break;
    }

    case "UNITS_TIMES_RATE": {
      const units = Number(inputs.units ?? inputs.totalUnits ?? 0);
      const rate = Number(parameters.rate ?? 1);

      result = safeRound(units * rate, 2);
      steps.push(`${units} × ${rate} = ${result}`);
      break;
    }

    case "RATIO_COMPARE": {
      const gfa = Number(inputs.gfa ?? inputs.grossFloorAreaSqm ?? 0);
      const siteArea = Number(inputs.siteAreaSqm ?? 1);

      const ratio = safeRound(safeDivide(gfa, siteArea), 2);
      result = ratio;
      steps.push(`Nisbah Plot = ${gfa} m² / ${siteArea} m² = 1:${ratio}`);
      break;
    }

    case "DIRECT_MINIMUM":
    case "DIRECT_MAXIMUM": {
      result = Number(parameters.value ?? parameters.threshold ?? 0);
      steps.push(`Nilai had langsung: ${result}`);
      break;
    }

    case "SUM_COMPONENTS": {
      const componentKeys = (parameters.components as string[]) || [];
      let sum = 0;
      for (const k of componentKeys) {
        const val = Number(inputs[k] || 0);
        sum += val;
        steps.push(`+ ${k}: ${val}`);
      }
      result = sum;
      steps.push(`Jumlah komponen = ${sum}`);
      break;
    }

    default:
      result = Number(parameters.value ?? 0);
      steps.push(`Nilai parameter lalai: ${result}`);
  }

  const trace: CalculationTrace = {
    formulaType,
    inputs,
    steps,
    result,
  };

  return { result, trace };
}
