import type { PlanningRule, PlanningDataContext, DslCondition } from "../../types/rules.ts";

/**
 * Safe Structured Rule DSL Evaluator
 * Evaluates whether a rule is applicable to a specific development proposal context without arbitrary eval().
 */
export function isRuleApplicable(rule: PlanningRule, context: PlanningDataContext): boolean {
  if (!rule.enabled) return false;

  // Check Development Type Filter
  if (rule.developmentTypes && rule.developmentTypes.length > 0) {
    const matchesDevType = rule.developmentTypes.includes(context.developmentType);
    if (!matchesDevType) return false;
  }

  const { applicability } = rule;
  if (!applicability) return true;

  // ALL conditions must evaluate to true
  if (applicability.all && applicability.all.length > 0) {
    const allMatch = applicability.all.every((cond) => evaluateCondition(cond, context));
    if (!allMatch) return false;
  }

  // ANY condition must evaluate to true
  if (applicability.any && applicability.any.length > 0) {
    const anyMatch = applicability.any.some((cond) => evaluateCondition(cond, context));
    if (!anyMatch) return false;
  }

  return true;
}

function evaluateCondition(condition: DslCondition, context: PlanningDataContext): boolean {
  const { field, operator, value, minValue, maxValue } = condition;
  const actualVal = context.get(field);

  switch (operator) {
    case "EQUALS":
      return String(actualVal).toLowerCase() === String(value).toLowerCase();

    case "NOT_EQUALS":
      return String(actualVal).toLowerCase() !== String(value).toLowerCase();

    case "GREATER_THAN":
      return actualVal !== null && actualVal !== undefined && Number(actualVal) > Number(value);

    case "GREATER_THAN_OR_EQUAL":
      return actualVal !== null && actualVal !== undefined && Number(actualVal) >= Number(value);

    case "LESS_THAN":
      return actualVal !== null && actualVal !== undefined && Number(actualVal) < Number(value);

    case "LESS_THAN_OR_EQUAL":
      return actualVal !== null && actualVal !== undefined && Number(actualVal) <= Number(value);

    case "IN": {
      if (!Array.isArray(value)) return false;
      return value.map(String).includes(String(actualVal));
    }

    case "NOT_IN": {
      if (!Array.isArray(value)) return true;
      return !value.map(String).includes(String(actualVal));
    }

    case "EXISTS":
      return actualVal !== null && actualVal !== undefined && actualVal !== "";

    case "NOT_EXISTS":
      return actualVal === null || actualVal === undefined || actualVal === "";

    case "BETWEEN":
      return (
        actualVal !== null &&
        actualVal !== undefined &&
        Number(actualVal) >= Number(minValue) &&
        Number(actualVal) <= Number(maxValue)
      );

    case "CONTAINS":
      return String(actualVal).toLowerCase().includes(String(value).toLowerCase());

    default:
      return false;
  }
}
