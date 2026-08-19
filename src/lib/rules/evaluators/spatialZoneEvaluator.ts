import type { PlanningRule, PlanningDataContext, RuleEvaluation, FactProvenance } from "../../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../../types/rules.ts";
import type { PlanningRuleEvaluator } from "./evaluatorInterface.ts";
import { formatRuleMessage } from "../messageCatalog.ts";

export class SpatialZoneRuleEvaluator implements PlanningRuleEvaluator {
  supports(rule: PlanningRule): boolean {
    return rule.ruleType === "SPATIAL_ZONE";
  }

  async evaluate(rule: PlanningRule, context: PlanningDataContext): Promise<RuleEvaluation> {
    const inputKey = "rtd.primaryZone";
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

    const primaryZone = context.rtd.primaryZoneCode || "PERDAGANGAN";
    const devType = context.developmentType;
    const allowedUses = (rule.parameters.allowedUses as string[]) || ["HOTEL", "COMMERCIAL"];
    const conditionalUses = (rule.parameters.conditionalUses as string[]) || ["MIXED_DEVELOPMENT"];
    const prohibitedUses = (rule.parameters.prohibitedUses as string[]) || ["HEAVY_INDUSTRIAL"];

    let status: "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW" = "COMPLIANT";
    let messageCode = "RTD_ZONE_ALLOWED";

    if (prohibitedUses.includes(devType)) {
      status = "NON_COMPLIANT";
      messageCode = "RTD_ZONE_PROHIBITED";
    } else if (conditionalUses.includes(devType)) {
      status = "REQUIRES_REVIEW";
      messageCode = "RTD_ZONE_CONDITIONAL";
    } else if (allowedUses.includes(devType)) {
      status = "COMPLIANT";
      messageCode = "RTD_ZONE_ALLOWED";
    } else {
      status = "REQUIRES_REVIEW";
      messageCode = "RTD_ZONE_REVIEW_REQUIRED";
    }

    const steps = [
      `Zon RTD Utama: ${context.rtd.primaryZoneName || primaryZone} (${context.rtd.primaryZonePercent}%)`,
      `Guna Tanah Cadangan: ${devType}`,
    ];

    if (context.rtd.zones.length > 1) {
      steps.push(`Tapak Merangkumi ${context.rtd.zones.length} Zon RTD:`);
      for (const z of context.rtd.zones) {
        steps.push(`- ${z.zoneName}: ${z.intersectionPercent}% (${z.intersectionAreaSqm} m²)`);
      }
    }

    const messageText = formatRuleMessage(messageCode, {
      devType,
      zone: context.rtd.primaryZoneName || primaryZone,
      percent: context.rtd.primaryZonePercent,
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
      actualValue: devType,
      requiredValue: allowedUses.join(", "),
      unit: "guna tanah",
      calculation: {
        formulaType: "SPATIAL_ZONE_INTERSECTION",
        inputs: {
          developmentType: devType,
          primaryZone,
          zones: context.rtd.zones,
        },
        steps,
        result: status === "COMPLIANT" ? "DIBENARKAN" : status === "REQUIRES_REVIEW" ? "BERSYARAT" : "TIDAK DIBENARKAN",
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
