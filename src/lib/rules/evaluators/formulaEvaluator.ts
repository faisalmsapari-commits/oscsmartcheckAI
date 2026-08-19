import type { PlanningRule, PlanningDataContext, RuleEvaluation, FactProvenance } from "../../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { evaluateFormula, safeRound } from "../calculations.ts";
import { formatRuleMessage } from "../messageCatalog.ts";

export class FormulaRuleEvaluator implements PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean {
    return rule.ruleType === "FORMULA";
  }

  async evaluate(rule: PlanningRule, context: PlanningDataContext): Promise<RuleEvaluation> {
    const inputEvidence: FactProvenance[] = [];
    const formulaInputs: Record<string, unknown> = {};
    const now = new Date().toISOString();

    const ruleEvidence = {
      sourceDocumentId: rule.sourceDocumentId,
      sourceDocumentVersion: rule.sourceDocumentVersion,
      sourceClause: rule.sourceClause,
      sourcePage: rule.sourcePage,
      sourceTextExcerpt: rule.sourceTextExcerpt,
    };

    // 1. Gather Inputs and Provenance
    let hasMissing = false;
    let hasConflict = false;
    let missingKey = "";

    for (const key of rule.inputKeys) {
      const prov = context.getProvenance(key);
      if (!prov || prov.value === null || prov.value === undefined || prov.status === "NOT_FOUND") {
        hasMissing = true;
        missingKey = key;
      } else {
        inputEvidence.push(prov);
        formulaInputs[key] = prov.normalizedValue ?? prov.value;
        if (prov.status === "CONFLICT" || prov.status === "AMBIGUOUS") {
          hasConflict = true;
        }
      }
    }

    if (hasMissing) {
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
        requiredValue: null,
        unit: (rule.parameters.unit as string) || null,
        messageCode: "MISSING_INPUT_FACT",
        messageText: formatRuleMessage("MISSING_INPUT_FACT", { key: missingKey }),
        inputEvidence,
        ruleEvidence,
        requiresOfficerReview: true,
        evaluatedAt: now,
        engineVersion: PLANNING_RULE_ENGINE_VERSION,
      };
    }

    if (hasConflict) {
      return {
        ruleId: rule.ruleId,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleSetId: rule.ruleSetId,
        ruleSetVersion: "1.0.0",
        category: rule.category,
        status: "REQUIRES_REVIEW",
        severity: rule.severity,
        actualValue: formulaInputs[rule.inputKeys[0]],
        requiredValue: null,
        unit: (rule.parameters.unit as string) || null,
        messageCode: "INPUT_FACT_CONFLICT",
        messageText: formatRuleMessage("INPUT_FACT_CONFLICT", { key: rule.inputKeys[0] }),
        inputEvidence,
        ruleEvidence,
        requiresOfficerReview: true,
        evaluatedAt: now,
        engineVersion: PLANNING_RULE_ENGINE_VERSION,
      };
    }

    // 2. Evaluate Formula to compute Required Value
    const formulaDef = rule.formula || {
      formulaType: "CEIL_DIVIDE_MULTIPLY",
      parameters: rule.parameters,
    };

    // Populate standard baseValue from first parameter if needed
    if (!formulaInputs.baseValue && rule.inputKeys[0]) {
      formulaInputs.baseValue = formulaInputs[rule.inputKeys[0]];
    }

    const { result: requiredVal, trace } = evaluateFormula(formulaDef, formulaInputs);

    // 3. Compare with Provided Value
    // If multiple input keys, the last key is typically the provided entity (e.g. parking.carProvided)
    const providedKey = rule.inputKeys.length > 1 ? rule.inputKeys[rule.inputKeys.length - 1] : rule.inputKeys[0];
    const actualProvided = Number(formulaInputs[providedKey] ?? formulaInputs.baseValue ?? 0);
    const unit = (rule.parameters.unit as string) || "petak";

    const isCompliant = actualProvided >= requiredVal;
    const diff = safeRound(actualProvided - requiredVal, 2);
    const status = isCompliant ? "COMPLIANT" : rule.failureStatus;

    const messageCode = isCompliant ? "FORMULA_REQUIREMENT_SATISFIED" : "FORMULA_REQUIREMENT_FAILED";
    const messageText = isCompliant
      ? `Nilai disediakan (${actualProvided} ${unit}) mematuhi keperluan minimum kiraan piawai (${requiredVal} ${unit}).`
      : `Nilai disediakan (${actualProvided} ${unit}) kurang ${Math.abs(diff)} ${unit} daripada keperluan minimum (${requiredVal} ${unit}).`;

    return {
      ruleId: rule.ruleId,
      ruleCode: rule.code,
      ruleName: rule.name,
      ruleSetId: rule.ruleSetId,
      ruleSetVersion: "1.0.0",
      category: rule.category,
      status,
      severity: rule.severity,
      actualValue: actualProvided,
      requiredValue: requiredVal,
      difference: diff,
      unit,
      calculation: trace,
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
