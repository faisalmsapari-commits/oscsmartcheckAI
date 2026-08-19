import type { Timestamp } from "firebase/firestore";

export const PLANNING_RULE_ENGINE_VERSION = "1.0.0";

export type RuleCategory =
  | "RTD"
  | "PARKING"
  | "OPEN_SPACE"
  | "HOUSING"
  | "SETBACK"
  | "DENSITY"
  | "PLOT_RATIO"
  | "BUILDING_HEIGHT"
  | "ROAD_ACCESS"
  | "COMMUNITY_FACILITY"
  | "LANDSCAPE"
  | "ENVIRONMENT"
  | "HERITAGE"
  | "TOURISM"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "OTHER";

export type RuleType =
  | "THRESHOLD_MIN"
  | "THRESHOLD_MAX"
  | "RANGE"
  | "RATIO"
  | "FORMULA"
  | "BOOLEAN"
  | "ENUM_ALLOWED"
  | "ENUM_PROHIBITED"
  | "SPATIAL_ZONE"
  | "REQUIRED_VALUE"
  | "CUSTOM";

export type RuleSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "INFORMATIONAL";

export type RuleSetStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "ARCHIVED";

export type ComplianceStatus =
  | "COMPLIANT" // PATUH
  | "NON_COMPLIANT" // TIDAK PATUH
  | "REQUIRES_REVIEW" // PERLU PENGESAHAN
  | "NOT_APPLICABLE" // TIDAK BERKENAAN
  | "INSUFFICIENT_DATA" // MAKLUMAT TIDAK MENCUKUPI
  | "ERROR"; // RALAT SEMAKAN

export type OverallPrecheckStatus =
  | "PASS_PRECHECK" // PRA-SEMAKAN MEMATUHI KRITERIA AUTOMATIK
  | "REVISION_REQUIRED"
  | "OFFICER_REVIEW_REQUIRED"
  | "INSUFFICIENT_DATA"
  | "PROCESSING_ERROR";

export type SmartCheckStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "SUPERSEDED";

export type OfficerAssessment = "AGREE" | "DISAGREE" | "REQUIRES_FURTHER_REVIEW";

/**
 * Controlled Rule DSL Condition Block
 */
export interface DslCondition {
  field: string;
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "IN"
    | "NOT_IN"
    | "EXISTS"
    | "NOT_EXISTS"
    | "BETWEEN"
    | "CONTAINS";
  value?: unknown;
  minValue?: unknown;
  maxValue?: unknown;
}

export interface RuleApplicabilityDsl {
  all?: DslCondition[];
  any?: DslCondition[];
}

/**
 * Formula Definition Model
 */
export type FormulaType =
  | "CEIL_DIVIDE_MULTIPLY"
  | "PERCENT_OF"
  | "UNITS_TIMES_RATE"
  | "RATIO_COMPARE"
  | "DIRECT_MINIMUM"
  | "DIRECT_MAXIMUM"
  | "SUM_COMPONENTS"
  | "CUSTOM_REGISTERED_FUNCTION";

export interface FormulaDefinition {
  formulaType: FormulaType;
  customFunctionName?: string;
  parameters: Record<string, unknown>;
}

/**
 * Planning Rule Set (Collection: planningRuleSets/{ruleSetId})
 */
export interface PlanningRuleSet {
  id?: string;
  ruleSetId: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  jurisdiction: string; // e.g. MPLBP
  authority: string; // e.g. Majlis Perbandaran Langkawi
  version: string; // e.g. 1.0.0
  status: RuleSetStatus;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceDocumentIds: string[];
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  checksum: string;
  isTestOnly?: boolean;
  notes?: string | null;
}

/**
 * Individual Planning Rule (Subcollection: planningRuleSets/{ruleSetId}/rules/{ruleId})
 */
export interface PlanningRule {
  id?: string;
  ruleId: string;
  ruleSetId: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  developmentTypes: string[];
  applicability: RuleApplicabilityDsl;
  ruleType: RuleType;
  inputKeys: string[];
  formula?: FormulaDefinition;
  parameters: Record<string, unknown>;
  severity: RuleSeverity;
  failureStatus: "NON_COMPLIANT" | "REQUIRES_REVIEW";
  missingDataStatus: "INSUFFICIENT_DATA" | "REQUIRES_REVIEW";
  sourceDocumentId: string;
  sourceDocumentVersion: string | number;
  sourceClause: string;
  sourcePage: number;
  sourceTextExcerpt: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  priority: number;
  enabled: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Fact Provenance Model
 */
export interface FactProvenance {
  key: string;
  value: unknown;
  normalizedValue?: unknown;
  unit?: string | null;
  sourceType: "LCP_CONFIRMED_FACT" | "LCP_EXTRACTED_FACT" | "VERIFIED_SPATIAL_FACT" | "APPLICATION_METADATA";
  documentId?: string | null;
  documentVersion?: number | null;
  datasetId?: string | null;
  datasetVersion?: string | null;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  status?: string;
  isConfirmed: boolean;
}

/**
 * Complete Planning Data Context for Rule Evaluation
 */
export interface PlanningDataContext {
  applicationId: string;
  applicationNo: string;
  applicationDate: string;
  developmentType: string;
  developmentSubtype?: string | null;
  facts: Map<string, FactProvenance>;
  site: {
    lotCount: number;
    lotNumbers: string[];
    siteAreaSqm: number;
    mukim: string;
    district: string;
    isOfficerVerified: boolean;
  };
  rtd: {
    primaryZoneCode: string | null;
    primaryZoneName: string | null;
    primaryZonePercent: number;
    zones: Array<{
      zoneCode: string;
      zoneName: string;
      intersectionPercent: number;
      intersectionAreaSqm: number;
    }>;
  };
  get(key: string): unknown;
  getProvenance(key: string): FactProvenance | undefined;
}

/**
 * Structured Calculation Trace for Explainability
 */
export interface CalculationTrace {
  formulaType: string;
  inputs: Record<string, unknown>;
  steps: string[];
  result: unknown;
}

/**
 * Individual Rule Evaluation Result
 */
export interface RuleEvaluation {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  ruleSetId: string;
  ruleSetVersion: string;
  category: RuleCategory;
  status: ComplianceStatus;
  severity: RuleSeverity;
  actualValue: unknown;
  requiredValue: unknown;
  difference?: number | null;
  unit: string | null;
  calculation?: CalculationTrace | null;
  messageCode: string;
  messageText: string;
  inputEvidence: FactProvenance[];
  ruleEvidence: {
    sourceDocumentId: string;
    sourceDocumentVersion: string | number;
    sourceClause: string;
    sourcePage: number;
    sourceTextExcerpt: string;
  };
  requiresOfficerReview: boolean;
  evaluatedAt: string;
  engineVersion: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/**
 * Category Summary Breakdown
 */
export interface CategorySummary {
  category: RuleCategory;
  categoryName: string;
  status: ComplianceStatus;
  totalRules: number;
  compliantCount: number;
  nonCompliantCount: number;
  requiresReviewCount: number;
  insufficientDataCount: number;
  notApplicableCount: number;
  errorCount: number;
}

/**
 * Officer Assessment Overrides (Subcollection under results)
 */
export interface OfficerRuleAssessment {
  id?: string;
  resultId: string;
  officerUid: string;
  officerRole: string;
  assessment: OfficerAssessment;
  reason: string;
  assessedAt: Timestamp | string;
}

/**
 * SmartCheck Run Document (Collection: applications/{applicationId}/smartChecks/{smartCheckId})
 */
export interface SmartCheckRecord {
  id?: string;
  smartCheckId: string;
  applicationId: string;
  applicationVersion: number;
  siteVersion: number;
  lcpDocumentId: string;
  lcpDocumentVersion: number;
  status: SmartCheckStatus;
  overallStatus: OverallPrecheckStatus;
  engineVersion: string;
  ruleSetSnapshots: Array<{
    ruleSetId: string;
    code: string;
    version: string;
    checksum: string;
  }>;
  fingerprint: string;
  startedBy: string;
  startedAt: Timestamp | string;
  completedAt: Timestamp | string | null;
  categorySummaries: Record<string, CategorySummary>;
  totalRulesEvaluated: number;
  compliantCount: number;
  nonCompliantCount: number;
  requiresReviewCount: number;
  insufficientDataCount: number;
  notApplicableCount: number;
  errorCount: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * SmartCheck Readiness Result
 */
export interface SmartCheckReadiness {
  ready: boolean;
  documentReady: boolean;
  factReady: boolean;
  spatialReady: boolean;
  ruleSetsReady: boolean;
  issues: string[];
}
