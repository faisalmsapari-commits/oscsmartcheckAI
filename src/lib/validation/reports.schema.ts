import { z } from "zod";

export const ReportTypeSchema = z.enum([
  "SMARTCHECK_INTERNAL",
  "SMARTCHECK_APPLICANT",
  "SMARTCHECK_AUDIT_PACKAGE",
  "MANAGEMENT_SUMMARY",
  "TECHNICAL_AGENCY_REPORT",
  "APPLICATION_HISTORY_REPORT",
  "OTHER",
]);

export const ReportClassificationSchema = z.enum(["INTERNAL", "APPLICANT", "AUDIT"]);

export const ReportMetadataSchema = z.object({
  reportId: z.string().min(1),
  reportType: ReportTypeSchema,
  reportVersion: z.number().int().positive(),
  applicationId: z.string().min(1),
  applicationNo: z.string().min(1),
  smartCheckId: z.string().min(1),
  verifiedCommentId: z.string().nullable().optional(),
  generatedAt: z.string(),
  generatedBy: z.string().min(1),
  systemVersion: z.string().min(1),
  templateVersion: z.string().min(1),
  language: z.string().default("ms-MY"),
  classification: ReportClassificationSchema,
});

export const ReportDocumentItemSchema = z.object({
  documentId: z.string().min(1),
  documentType: z.string().min(1),
  title: z.string().min(1),
  version: z.number().int().positive(),
  fileName: z.string().min(1),
  uploadedAt: z.string(),
  status: z.string(),
  checksum: z.string().nullable().optional(),
});

export const ReportSpatialSummarySchema = z.object({
  lotNumbers: z.array(z.string()),
  mukim: z.string(),
  district: z.string(),
  state: z.string(),
  gisSiteAreaSqm: z.number().nonnegative(),
  lcpSiteAreaSqm: z.number().nonnegative().nullable().optional(),
  differencePercent: z.number().nullable().optional(),
  siteVerificationStatus: z.string(),
  verifiedBy: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  rtdDatasetName: z.string(),
  rtdDatasetVersion: z.string(),
  primaryZoneCode: z.string().nullable(),
  primaryZoneName: z.string().nullable(),
  primaryZonePercent: z.number(),
  additionalZones: z.array(
    z.object({
      zoneCode: z.string(),
      zoneName: z.string(),
      intersectionPercent: z.number(),
      intersectionAreaSqm: z.number(),
    })
  ),
});

export const ReportCategorySummarySchema = z.object({
  category: z.string(),
  categoryName: z.string(),
  status: z.string(),
  totalRules: z.number().int().nonnegative(),
  compliantCount: z.number().int().nonnegative(),
  nonCompliantCount: z.number().int().nonnegative(),
  requiresReviewCount: z.number().int().nonnegative(),
  insufficientDataCount: z.number().int().nonnegative(),
});

export const ReportResultItemSchema = z.object({
  ruleId: z.string().min(1),
  ruleCode: z.string().min(1),
  ruleName: z.string().min(1),
  category: z.string(),
  machineStatus: z.string(),
  severity: z.string(),
  actualValue: z.unknown(),
  requiredValue: z.unknown(),
  difference: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  sourceClause: z.string(),
  sourcePage: z.number().nullable().optional(),
  calculationTrace: z.array(z.string()).nullable().optional(),
  officerAssessment: z
    .object({
      assessment: z.enum(["AGREE", "DISAGREE"]),
      reason: z.string().optional(),
      assessedBy: z.string().optional(),
    })
    .nullable()
    .optional(),
  inputEvidence: z.array(z.any()).optional(),
});

export const ReportIssueItemSchema = z.object({
  issueId: z.string().min(1),
  ruleCode: z.string().nullable().optional(),
  title: z.string().min(1),
  issueType: z.string(),
  severity: z.string(),
  status: z.string(),
  visibility: z.enum(["INTERNAL", "APPLICANT_VISIBLE"]),
  description: z.string(),
  requiredAction: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  internalOfficerNotes: z.array(z.string()).optional(),
});

export const ReportVerifiedCommentSchema = z.object({
  commentId: z.string().min(1),
  version: z.number().int().positive(),
  status: z.string(),
  finalText: z.string().min(10),
  structuredSections: z.any().nullable().optional(),
  verifiedBy: z.string().min(1),
  verifiedAt: z.string(),
  checksum: z.string(),
});

export const ReportSourceVersionsSchema = z.object({
  lcpVersion: z.number().int().positive(),
  siteVersion: z.number().int().positive(),
  smartCheckId: z.string().min(1),
  ruleEngineVersion: z.string().min(1),
  ruleSetVersions: z.array(z.string()),
  gisDatasetVersions: z.array(z.string()),
  promptVersion: z.string().optional(),
  templateVersion: z.string().min(1),
});

export const SmartCheckReportDataSchema = z.object({
  reportMetadata: ReportMetadataSchema,
  application: z.object({
    applicationId: z.string().min(1),
    applicationNo: z.string().min(1),
    projectTitle: z.string().min(1),
    applicationType: z.string().min(1),
    category: z.string(),
    developmentType: z.string().min(1),
    submittedAt: z.string().nullable().optional(),
    status: z.string(),
    version: z.number().int().positive(),
  }),
  applicant: z.object({
    applicantName: z.string().min(1),
    companyName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }),
  consultant: z
    .object({
      principalSubmittingPerson: z.string().nullable().optional(),
      consultantCompany: z.string().nullable().optional(),
      registrationNo: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  site: z.object({
    mukim: z.string(),
    district: z.string(),
    state: z.string(),
    lotNumbers: z.array(z.string()),
    siteAreaSqm: z.number().nonnegative(),
    isOfficerVerified: z.boolean(),
  }),
  documents: z.array(ReportDocumentItemSchema),
  spatialSummary: ReportSpatialSummarySchema,
  smartCheckSummary: z.object({
    smartCheckId: z.string().min(1),
    overallStatus: z.string(),
    totalRulesEvaluated: z.number().int().nonnegative(),
    compliantCount: z.number().int().nonnegative(),
    nonCompliantCount: z.number().int().nonnegative(),
    requiresReviewCount: z.number().int().nonnegative(),
    insufficientDataCount: z.number().int().nonnegative(),
    evaluatedAt: z.string(),
  }),
  categorySummaries: z.array(ReportCategorySummarySchema),
  results: z.array(ReportResultItemSchema),
  issues: z.array(ReportIssueItemSchema),
  verifiedComment: ReportVerifiedCommentSchema.nullable().optional(),
  sourceVersions: ReportSourceVersionsSchema,
  verification: z.object({
    siteVerifiedBy: z.string().nullable().optional(),
    siteVerifiedAt: z.string().nullable().optional(),
    lcpFactsConfirmedBy: z.string().nullable().optional(),
    commentVerifiedBy: z.string().nullable().optional(),
    commentVerifiedAt: z.string().nullable().optional(),
  }),
  auditSummary: z
    .object({
      totalEvents: z.number().int().nonnegative(),
      keyEvents: z.array(
        z.object({
          eventType: z.string(),
          actorRole: z.string(),
          timestamp: z.string(),
          description: z.string().optional(),
        })
      ),
    })
    .optional(),
});

export const GenerateReportRequestSchema = z.object({
  reportType: ReportTypeSchema.default("SMARTCHECK_INTERNAL"),
  classification: ReportClassificationSchema.optional(),
});

export const PublishReportRequestSchema = z.object({
  publicationNote: z.string().max(500).optional(),
});

export const UnpublishReportRequestSchema = z.object({
  reason: z.string().min(5, "Sila nyatakan alasan penarikan balik laporan."),
});
