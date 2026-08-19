import { z } from "zod";

export const AnalyticsTimePresetSchema = z.enum([
  "TODAY",
  "7_DAYS",
  "30_DAYS",
  "THIS_MONTH",
  "QUARTER",
  "THIS_YEAR",
  "CUSTOM",
]);

export const AnalyticsFilterSchema = z.object({
  timePreset: AnalyticsTimePresetSchema.optional().default("30_DAYS"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  mukim: z.string().optional(),
  developmentType: z.string().optional(),
  planningCategory: z.string().optional(),
  applicationStatus: z.string().optional(),
  smartCheckStatus: z.string().optional(),
  ruleCategory: z.string().optional(),
  assignedOfficerUid: z.string().optional(),
  rtdZone: z.string().optional(),
});

export const ManagementAlertSeveritySchema = z.enum(["CRITICAL", "WARNING", "INFO"]);
export const ManagementAlertStatusSchema = z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]);
export const ManagementAlertTypeSchema = z.enum([
  "CRITICAL_ISSUE_BACKLOG",
  "SMARTCHECK_FAILURE_SPIKE",
  "DOCUMENT_PROCESSING_FAILURE",
  "COMMENT_VERIFICATION_GOVERNANCE",
  "REPORT_FAILURE_SPIKE",
  "GIS_SERVICE_DEGRADATION",
]);

export const ManagementAlertSchema = z.object({
  alertId: z.string().min(1),
  alertType: ManagementAlertTypeSchema,
  severity: ManagementAlertSeveritySchema,
  status: ManagementAlertStatusSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  metric: z.string().min(1),
  threshold: z.number(),
  actualValue: z.number(),
  period: z.string(),
  createdAt: z.any(),
  acknowledgedBy: z.string().nullable().optional(),
  acknowledgedAt: z.any().nullable().optional(),
  resolvedBy: z.string().nullable().optional(),
  resolvedAt: z.any().nullable().optional(),
});

export const ManagementTargetSchema = z.object({
  targetId: z.string().min(1),
  kpiCode: z.string().min(1),
  targetName: z.string().min(1),
  targetValue: z.number(),
  unit: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().nullable().optional(),
  approvedBy: z.string().min(1),
});

export const ExportManagementDataRequestSchema = z.object({
  format: z.enum(["CSV", "JSON"]).default("CSV"),
  datasetType: z.enum([
    "SUMMARY_KPIS",
    "APPLICATIONS_SUMMARY",
    "COMPLIANCE_BY_CATEGORY",
    "TOP_NON_COMPLIANCE",
    "ISSUE_AGEING",
    "OFFICER_WORKLOAD",
    "SPATIAL_PLANNING",
    "AI_GOVERNANCE",
  ]).default("SUMMARY_KPIS"),
  filter: AnalyticsFilterSchema.optional(),
});
