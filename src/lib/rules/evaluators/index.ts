import type { PlanningRule, PlanningDataContext, RuleEvaluation } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { ThresholdRuleEvaluator } from "./thresholdEvaluator.ts";
import { RangeRuleEvaluator } from "./rangeEvaluator.ts";
import { RatioRuleEvaluator } from "./ratioEvaluator.ts";
import { FormulaRuleEvaluator } from "./formulaEvaluator.ts";
import { SpatialZoneRuleEvaluator } from "./spatialZoneEvaluator.ts";

export * from "./evaluatorInterface.ts";
export * from "./thresholdEvaluator.ts";
export * from "./rangeEvaluator.ts";
export * from "./ratioEvaluator.ts";
export * from "./formulaEvaluator.ts";
export * from "./spatialZoneEvaluator.ts";

const EVALUATORS: PlanningRuleEvaluator[] = [
  new ThresholdRuleEvaluator(),
  new RangeRuleEvaluator(),
  new RatioRuleEvaluator(),
  new FormulaRuleEvaluator(),
  new SpatialZoneRuleEvaluator(),
];

export async function evaluateRule(
  rule: PlanningRule,
  context: PlanningDataContext
): Promise<RuleEvaluation> {
  const evaluator = EVALUATORS.find((e) => e.supports(rule));
  if (!evaluator) {
    throw new Error(`Tiada evaluator dijumpai untuk jenis peraturan: ${rule.ruleType}`);
  }
  return await evaluator.evaluate(rule, context);
}
