import type { Timestamp } from "firebase/firestore";
import type {
  RuleCategory,
  RuleSeverity,
  ComplianceStatus,
  OverallPrecheckStatus,
  FactProvenance,
} from "./rules.ts";
import type { IssueStatus, IssueType } from "./issues.ts";
import type { StructuredOscDraft } from "./comments.ts";

export type ReportType =
  | "SMARTCHECK_INTERNAL"
  | "SMARTCHECK_APPLICANT"
  | "SMARTCHECK_AUDIT_PACKAGE"
  | "MANAGEMENT_SUMMARY"
  | "TECHNICAL_AGENCY_REPORT"
  | "APPLICATION_HISTORY_REPORT"
  | "OTHER";

export type ReportStatus =
  | "GENERATING"
  | "GENERATED"
  | "FAILED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type ReportVisibility = "INTERNAL" | "APPLICANT_VISIBLE";

export type ReportClassification = "INTERNAL" | "APPLICANT" | "AUDIT";

export type ReportFreshness =
  | "CURRENT"
  | "STALE_SMARTCHECK_CHANGED"
  | "STALE_COMMENT_CHANGED"
  | "STALE_SOURCE_CHANGED"
  | "STALE_TEMPLATE_CHANGED"
  | "STALE_MULTIPLE";

export interface ReportMetadata {
  reportId: string;
  reportType: ReportType;
  reportVersion: number;
  applicationId: string;
  applicationNo: string;
  smartCheckId: string;
  verifiedCommentId?: string | null;
  generatedAt: string;
  generatedBy: string;
  systemVersion: string;
  templateVersion: string;
  language: string;
  classification: ReportClassification;
}

export interface ReportDocumentItem {
  documentId: string;
  documentType: string;
  title: string;
  version: number;
  fileName: string;
  uploadedAt: string;
  status: string;
  checksum?: string | null;
}

export interface ReportSpatialSummary {
  lotNumbers: string[];
  mukim: string;
  district: string;
  state: string;
  gisSiteAreaSqm: number;
  lcpSiteAreaSqm?: number | null;
  differencePercent?: number | null;
  siteVerificationStatus: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rtdDatasetName: string;
  rtdDatasetVersion: string;
  primaryZoneCode: string | null;
  primaryZoneName: string | null;
  primaryZonePercent: number;
  additionalZones: Array<{
    zoneCode: string;
    zoneName: string;
    intersectionPercent: number;
    intersectionAreaSqm: number;
  }>;
}

export interface ReportCategorySummary {
  category: RuleCategory;
  categoryName: string;
  status: ComplianceStatus;
  totalRules: number;
  compliantCount: number;
  nonCompliantCount: number;
  requiresReviewCount: number;
  insufficientDataCount: number;
}

export interface ReportResultItem {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  category: RuleCategory;
  machineStatus: ComplianceStatus;
  severity: RuleSeverity;
  actualValue: unknown;
  requiredValue: unknown;
  difference?: number | null;
  unit?: string | null;
  sourceClause: string;
  sourcePage?: number | null;
  calculationTrace?: string[] | null;
  officerAssessment?: {
    assessment: "AGREE" | "DISAGREE";
    reason?: string;
    assessedBy?: string;
  } | null;
  inputEvidence?: FactProvenance[];
}

export interface ReportIssueItem {
  issueId: string;
  ruleCode?: string | null;
  title: string;
  issueType: IssueType;
  severity: RuleSeverity;
  status: IssueStatus;
  visibility: "INTERNAL" | "APPLICANT_VISIBLE";
  description: string;
  requiredAction?: string | null;
  resolutionNote?: string | null;
  internalOfficerNotes?: string[];
}

export interface ReportVerifiedComment {
  commentId: string;
  version: number;
  status: string;
  finalText: string;
  structuredSections?: StructuredOscDraft | null;
  verifiedBy: string;
  verifiedAt: string;
  checksum: string;
}

export interface ReportSourceVersions {
  lcpVersion: number;
  siteVersion: number;
  smartCheckId: string;
  ruleEngineVersion: string;
  ruleSetVersions: string[];
  gisDatasetVersions: string[];
  promptVersion?: string;
  templateVersion: string;
}

export interface SmartCheckReportData {
  reportMetadata: ReportMetadata;
  application: {
    applicationId: string;
    applicationNo: string;
    projectTitle: string;
    applicationType: string;
    category: string;
    developmentType: string;
    submittedAt?: string | null;
    status: string;
    version: number;
  };
  applicant: {
    applicantName: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null; // Filtered in applicant report
  };
  consultant?: {
    principalSubmittingPerson?: string | null;
    consultantCompany?: string | null;
    registrationNo?: string | null;
  } | null;
  site: {
    mukim: string;
    district: string;
    state: string;
    lotNumbers: string[];
    siteAreaSqm: number;
    isOfficerVerified: boolean;
  };
  documents: ReportDocumentItem[];
  spatialSummary: ReportSpatialSummary;
  smartCheckSummary: {
    smartCheckId: string;
    overallStatus: OverallPrecheckStatus;
    totalRulesEvaluated: number;
    compliantCount: number;
    nonCompliantCount: number;
    requiresReviewCount: number;
    insufficientDataCount: number;
    evaluatedAt: string;
  };
  categorySummaries: ReportCategorySummary[];
  results: ReportResultItem[];
  issues: ReportIssueItem[];
  verifiedComment?: ReportVerifiedComment | null;
  sourceVersions: ReportSourceVersions;
  verification: {
    siteVerifiedBy?: string | null;
    siteVerifiedAt?: string | null;
    lcpFactsConfirmedBy?: string | null;
    commentVerifiedBy?: string | null;
    commentVerifiedAt?: string | null;
  };
  auditSummary?: {
    totalEvents: number;
    keyEvents: Array<{
      eventType: string;
      actorRole: string;
      timestamp: string;
      description?: string;
    }>;
  };
}

export interface ReportRecord {
  id?: string;
  reportId: string;
  applicationId: string;
  applicationNo: string;
  reportType: ReportType;
  version: number;
  smartCheckId: string;
  verifiedCommentId?: string | null;
  status: ReportStatus;
  visibility: ReportVisibility;
  classification: ReportClassification;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  checksumAlgorithm: "SHA-256";
  checksum: string;
  templateVersion: string;
  systemVersion: string;
  sourceFingerprint: string;
  generatedBy: string;
  generatedAt: Timestamp | string;
  publishedBy?: string | null;
  publishedAt?: Timestamp | string | null;
  unpublishReason?: string | null;
  supersededByReportId?: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface ReportJob {
  jobId: string;
  reportId: string;
  applicationId: string;
  reportType: ReportType;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  stage:
    | "BUILD_SNAPSHOT"
    | "VALIDATE_SNAPSHOT"
    | "RENDER_HTML"
    | "RENDER_PDF"
    | "CHECKSUM"
    | "STORE_FILE"
    | "FINALIZE_RECORD"
    | "COMPLETED";
  progressPercent: number;
  startedBy: string;
  startedAt: Timestamp | string;
  completedAt?: Timestamp | string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryCount: number;
}

export interface ReportReadinessResult {
  ready: boolean;
  smartCheckReady: boolean;
  verifiedCommentReady: boolean;
  siteReady: boolean;
  sourceReady: boolean;
  publicationReady: boolean;
  blockingIssues: string[];
  warnings: string[];
}

export interface ReportFreshnessResult {
  freshness: ReportFreshness;
  isStale: boolean;
  message: string;
  reasons: string[];
  currentFingerprint: string;
  reportFingerprint: string;
}

export interface ReportIntegrityResult {
  reportId: string;
  status: "VALID" | "INVALID" | "FILE_MISSING";
  calculatedChecksum?: string;
  expectedChecksum?: string;
  algorithm: string;
  checkedAt: string;
  message: string;
}

export interface AuditManifest {
  manifestVersion: string;
  applicationId: string;
  reportId: string;
  generatedAt: string;
  sourceVersions: ReportSourceVersions;
  files: Array<{
    fileName: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    sha256: string;
  }>;
}
