import type { PlanningRule, PlanningDataContext, RuleEvaluation, FactProvenance } from "../../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { formatRuleMessage } from "../messageCatalog.ts";
import { safeRound } from "../calculations.ts";

export class ThresholdRuleEvaluator implements PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean {
    return rule.ruleType === "THRESHOLD_MIN" || rule.ruleType === "THRESHOLD_MAX";
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

    // 1. Missing Data Check
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
        requiredValue: rule.parameters.threshold ?? rule.parameters.value ?? null,
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

    // 2. Conflict or Ambiguous Fact Status Check
    if (prov.status === "CONFLICT" || prov.status === "AMBIGUOUS") {
      return {
        ruleId: rule.ruleId,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleSetId: rule.ruleSetId,
        ruleSetVersion: "1.0.0",
        category: rule.category,
        status: "REQUIRES_REVIEW",
        severity: rule.severity,
        actualValue: prov.value,
        requiredValue: rule.parameters.threshold ?? rule.parameters.value ?? null,
        unit: prov.unit || (rule.parameters.unit as string) || null,
        messageCode: "INPUT_FACT_CONFLICT",
        messageText: formatRuleMessage("INPUT_FACT_CONFLICT", { key: inputKey }),
        inputEvidence,
        ruleEvidence,
        requiresOfficerReview: true,
        evaluatedAt: now,
        engineVersion: PLANNING_RULE_ENGINE_VERSION,
      };
    }

    const actual = Number(prov.normalizedValue ?? prov.value);
    const required = Number(rule.parameters.threshold ?? rule.parameters.value ?? 0);
    const unit = prov.unit || (rule.parameters.unit as string) || null;
    const diff = safeRound(actual - required, 2);

    let isCompliant = false;
    if (rule.ruleType === "THRESHOLD_MIN") {
      isCompliant = actual >= required;
    } else {
      isCompliant = actual <= required;
    }

    const status = isCompliant ? "COMPLIANT" : rule.failureStatus;
    const messageCode = isCompliant
      ? "THRESHOLD_SATISFIED"
      : rule.ruleType === "THRESHOLD_MIN"
      ? "BELOW_MINIMUM_THRESHOLD"
      : "EXCEEDS_MAXIMUM_THRESHOLD";

    const messageText = formatRuleMessage(messageCode, {
      actual,
      required,
      difference: Math.abs(diff),
      unit: unit || "",
    });

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
      requiredValue: required,
      difference: diff,
      unit,
      calculation: {
        formulaType: rule.ruleType,
        inputs: { actual, threshold: required },
        steps: [`Semakan Had: ${actual} ${rule.ruleType === "THRESHOLD_MIN" ? ">=" : "<="} ${required}`],
        result: isCompliant ? "PATUH" : "TIDAK PATUH",
      },
      messageCode,
      messageText,
      inputEvidence,
      ruleEvidence,
      requiresOfficerReview: status !== "COMPLIANT",
      evaluatedAt: now,
      engineVersion: PLANNING_RULE_ENGINE_VERSION,
    };
  }
}
