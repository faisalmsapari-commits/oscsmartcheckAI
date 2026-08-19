import type { PlanningRule, PlanningDataContext, RuleEvaluation, FactProvenance } from "../../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { formatRuleMessage } from "../messageCatalog.ts";
import { safeRound } from "../calculations.ts";

export class RatioRuleEvaluator implements PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean {
    return rule.ruleType === "RATIO";
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
        requiredValue: rule.parameters.maxRatio ?? null,
        unit: "nisbah",
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
    const maxRatio = Number(rule.parameters.maxRatio ?? rule.parameters.threshold ?? 2.5);
    const isCompliant = actual <= maxRatio;
    const diff = safeRound(actual - maxRatio, 2);

    return {
      ruleId: rule.ruleId,
      ruleCode: rule.code,
      ruleName: rule.name,
      ruleSetId: rule.ruleSetId,
      ruleSetVersion: "1.0.0",
      category: rule.category,
      status: isCompliant ? "COMPLIANT" : rule.failureStatus,
      severity: rule.severity,
      actualValue: `1:${actual}`,
      requiredValue: `1:${maxRatio}`,
      difference: diff,
      unit: "nisbah",
      calculation: {
        formulaType: "RATIO",
        inputs: { actualRatio: actual, maxAllowedRatio: maxRatio },
        steps: [`Semakan Nisbah Plot: 1:${actual} <= 1:${maxRatio}`],
        result: isCompliant ? "PATUH" : "TIDAK PATUH",
      },
      messageCode: isCompliant ? "RATIO_SATISFIED" : "RATIO_EXCEEDED",
      messageText: isCompliant
        ? `Nisbah plot 1:${actual} mematuhi had maksimum yang dibenarkan (1:${maxRatio}).`
        : `Nisbah plot 1:${actual} melebihi had maksimum 1:${maxRatio} (lebihan: ${diff}).`,
      inputEvidence,
      ruleEvidence,
      requiresOfficerReview: !isCompliant,
      evaluatedAt: now,
      engineVersion: PLANNING_RULE_ENGINE_VERSION,
    };
  }
}
