import { z } from "zod";

export const ALLOWED_RULE_CATEGORIES = [
  "RTD",
  "PARKING",
  "OPEN_SPACE",
  "HOUSING",
  "SETBACK",
  "DENSITY",
  "PLOT_RATIO",
  "BUILDING_HEIGHT",
  "ROAD_ACCESS",
  "COMMUNITY_FACILITY",
  "LANDSCAPE",
  "ENVIRONMENT",
  "HERITAGE",
  "TOURISM",
  "COMMERCIAL",
  "INDUSTRIAL",
  "OTHER",
] as const;

export const ALLOWED_RULE_TYPES = [
  "THRESHOLD_MIN",
  "THRESHOLD_MAX",
  "RANGE",
  "RATIO",
  "FORMULA",
  "BOOLEAN",
  "ENUM_ALLOWED",
  "ENUM_PROHIBITED",
  "SPATIAL_ZONE",
  "REQUIRED_VALUE",
  "CUSTOM",
] as const;

export const ALLOWED_SEVERITIES = ["CRITICAL", "MAJOR", "MODERATE", "MINOR", "INFORMATIONAL"] as const;

export const DslConditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "EQUALS",
    "NOT_EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "IN",
    "NOT_IN",
    "EXISTS",
    "NOT_EXISTS",
    "BETWEEN",
    "CONTAINS",
  ]),
  value: z.unknown().optional(),
  minValue: z.unknown().optional(),
  maxValue: z.unknown().optional(),
});

export const RuleApplicabilityDslSchema = z.object({
  all: z.array(DslConditionSchema).optional(),
  any: z.array(DslConditionSchema).optional(),
});

export const PlanningRuleSetSchema = z.object({
  ruleSetId: z.string().min(3).max(64),
  code: z.string().min(3).max(64),
  name: z.string().min(3).max(255),
  description: z.string().max(1000),
  category: z.enum(ALLOWED_RULE_CATEGORIES),
  jurisdiction: z.string().default("MPLBP"),
  authority: z.string().default("Majlis Perbandaran Langkawi"),
  version: z.string().min(1).max(32),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "ARCHIVED"]),
  effectiveFrom: z.string().nullable().default(null),
  effectiveTo: z.string().nullable().default(null),
  sourceDocumentIds: z.array(z.string()).default([]),
  approvedBy: z.string().nullable().default(null),
  approvedAt: z.string().nullable().default(null),
  createdBy: z.string(),
  checksum: z.string().default(""),
  isTestOnly: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});

export const PlanningRuleSchema = z.object({
  ruleId: z.string().min(3).max(64),
  ruleSetId: z.string().min(3).max(64),
  code: z.string().min(3).max(64),
  name: z.string().min(3).max(255),
  description: z.string().max(1000),
  category: z.enum(ALLOWED_RULE_CATEGORIES),
  developmentTypes: z.array(z.string()).default([]),
  applicability: RuleApplicabilityDslSchema,
  ruleType: z.enum(ALLOWED_RULE_TYPES),
  inputKeys: z.array(z.string()).min(1),
  formula: z
    .object({
      formulaType: z.enum([
        "CEIL_DIVIDE_MULTIPLY",
        "PERCENT_OF",
        "UNITS_TIMES_RATE",
        "RATIO_COMPARE",
        "DIRECT_MINIMUM",
        "DIRECT_MAXIMUM",
        "SUM_COMPONENTS",
        "CUSTOM_REGISTERED_FUNCTION",
      ]),
      customFunctionName: z.string().optional(),
      parameters: z.record(z.string(), z.unknown()).default({}),
    })
    .optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  severity: z.enum(ALLOWED_SEVERITIES).default("MAJOR"),
  failureStatus: z.enum(["NON_COMPLIANT", "REQUIRES_REVIEW"]).default("NON_COMPLIANT"),
  missingDataStatus: z.enum(["INSUFFICIENT_DATA", "REQUIRES_REVIEW"]).default("INSUFFICIENT_DATA"),
  sourceDocumentId: z.string().min(1),
  sourceDocumentVersion: z.union([z.string(), z.number()]),
  sourceClause: z.string().min(1),
  sourcePage: z.number().int().positive(),
  sourceTextExcerpt: z.string().min(1),
  effectiveFrom: z.string().nullable().default(null),
  effectiveTo: z.string().nullable().default(null),
  priority: z.number().int().default(100),
  enabled: z.boolean().default(true),
});

export const OfficerAssessmentRequestSchema = z.object({
  assessment: z.enum(["AGREE", "DISAGREE", "REQUIRES_FURTHER_REVIEW"]),
  reason: z.string().min(3, "Sebab/Ulasan ulasan pegawai wajib diisi").max(1000),
});

export const StartSmartCheckRequestSchema = z.object({
  forceRerun: z.boolean().default(false),
});
