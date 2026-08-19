import type { PlanningRule, PlanningDataContext, RuleEvaluation, FactProvenance } from "../../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { formatRuleMessage } from "../messageCatalog.ts";
import { safeRound } from "../calculations.ts";

export class RangeRuleEvaluator implements PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean {
    return rule.ruleType === "RANGE";
  }

  async evaluate(rule: PlanningRule, context: PlanningDataContext): Promise<RuleEvaluation> {
    const inputKey = rule.inputKeys[0];
    const prov = context.getProvenance(inputKey);
    const inputEvidence: FactProvenance[] = prov ? [prov] : [];
    const now = new Date().toISOString();

    const ruleEvidence = {
      sourceDocumentId: rule.sourceDocumentId,
      sourceDocumentVersion: rule.sourceDocumentVersion,
      sourceClause: rule.sourceClause,
      sourcePage: rule.sourcePage,
      sourceTextExcerpt: rule.sourceTextExcerpt,
    };

    if (!prov || prov.value === null || prov.value === undefined || prov.status === "NOT_FOUND") {
      return {
        ruleId: rule.ruleId,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleSetId: rule.ruleSetId,
        ruleSetVersion: "1.0.0",
        category: rule.category,
        status: rule.missingDataStatus,
        severity: rule.severity,
        actualValue: null,
        requiredValue: `${rule.parameters.minValue} - ${rule.parameters.maxValue}`,
        unit: (rule.parameters.unit as string) || null,
        messageCode: "MISSING_INPUT_FACT",
        messageText: formatRuleMessage("MISSING_INPUT_FACT", { key: inputKey }),
        inputEvidence,
        ruleEvidence,
        requiresOfficerReview: true,
        evaluatedAt: now,
        engineVersion: PLANNING_RULE_ENGINE_VERSION,
      };
    }

    const actual = Number(prov.normalizedValue ?? prov.value);
    const minVal = Number(rule.parameters.minValue ?? 0);
    const maxVal = Number(rule.parameters.maxValue ?? 100);
    const unit = prov.unit || (rule.parameters.unit as string) || null;

    const isCompliant = actual >= minVal && actual <= maxVal;
    const status = isCompliant ? "COMPLIANT" : rule.failureStatus;

    return {
      ruleId: rule.ruleId,
      ruleCode: rule.code,
      ruleName: rule.name,
      ruleSetId: rule.ruleSetId,
      ruleSetVersion: "1.0.0",
      category: rule.category,
      status,
      severity: rule.severity,
      actualValue: actual,
      requiredValue: `${minVal} - ${maxVal}`,
      difference: safeRound(actual - minVal, 2),
      unit,
      calculation: {
        formulaType: "RANGE",
        inputs: { actual, minVal, maxVal },
        steps: [`Semakan Julat: ${minVal} <= ${actual} <= ${maxVal}`],
        result: isCompliant ? "PATUH" : "TIDAK PATUH",
      },
      messageCode: isCompliant ? "RANGE_SATISFIED" : "OUTSIDE_RANGE",
      messageText: isCompliant
        ? `Nilai ${actual} ${unit || ""} berada dalam julat dibenarkan (${minVal} - ${maxVal}).`
        : `Nilai ${actual} ${unit || ""} di luar julat yang dibenarkan (${minVal} - ${maxVal}).`,
      inputEvidence,
      ruleEvidence,
      requiresOfficerReview: status !== "COMPLIANT",
      evaluatedAt: now,
      engineVersion: PLANNING_RULE_ENGINE_VERSION,
    };
  }
}
