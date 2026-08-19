import type { PlanningRule, PlanningDataContext, RuleEvaluation } from "../../../types/rules.ts";

export interface PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean;
  evaluate(rule: PlanningRule, context: PlanningDataContext): Promise<RuleEvaluation>;
}
