import type { Timestamp } from "firebase/firestore";
import type { ApplicationStatus, DevelopmentType, PlanningApplicationCategory } from "./application.ts";
import type { RuleCategory, OverallPrecheckStatus } from "./rules.ts";

/**
 * Standard KPI Identifiers across OSC SmartCheck AI
 */
export type KpiCode =
  | "TOTAL_APPLICATIONS"
  | "ACTIVE_APPLICATIONS"
  | "SMARTCHECK_COMPLETED"
  | "REVISION_REQUIRED"
  | "OFFICER_REVIEW_REQUIRED"
  | "OPEN_ISSUES"
  | "AVG_SMARTCHECK_DURATION"
  | "AVG_OFFICER_REVIEW_DURATION"
  | "HUMAN_VERIFICATION_RATE"
  | "RULE_TRACEABILITY_RATE"
  | "MANUAL_CORRECTION_RATE"
  | "REPORT_INTEGRITY_RATE";

/**
 * Time preset for analytics filtering
 */
export type AnalyticsTimePreset =
  | "TODAY"
  | "7_DAYS"
  | "30_DAYS"
  | "THIS_MONTH"
  | "QUARTER"
  | "THIS_YEAR"
  | "CUSTOM";

/**
 * Global analytics filter criteria
 */
export interface AnalyticsFilter {
  timePreset?: AnalyticsTimePreset;
  dateFrom?: string;
  dateTo?: string;
  mukim?: string;
  developmentType?: DevelopmentType;
  planningCategory?: PlanningApplicationCategory;
  applicationStatus?: ApplicationStatus;
  smartCheckStatus?: OverallPrecheckStatus;
  ruleCategory?: RuleCategory;
  assignedOfficerUid?: string;
  rtdZone?: string;
}

/**
 * Centralized KPI Metadata Definition
 */
export interface KpiDefinition {
  kpiCode: KpiCode;
  name: string;
  description: string;
  formula: string;
  source: string;
  unit: string;
  aggregationType: "SUM" | "COUNT" | "AVG" | "MEDIAN" | "PERCENTAGE";
  allowedFilters: string[];
  version: string;
  status: "ACTIVE" | "DEPRECATED";
}

/**
 * Summary KPI Metrics Block
 */
export interface ManagementSummaryKpis {
  totalApplications: number;
  activeApplications: number;
  smartCheckCompletedCount: number;
  revisionRequiredCount: number;
  officerReviewRequiredCount: number;
  openIssuesCount: number;
  avgSmartCheckDurationSeconds: number;
  avgOfficerReviewDurationHours: number;
  humanVerificationRate: number; // Must be 100%
  ruleTraceabilityRate: number; // Must be 100%
}

/**
 * Application volume trend point
 */
export interface ApplicationTrendPoint {
  periodKey: string; // e.g. "2026-01", "2026-02" or "2026-08-19"
  periodLabel: string;
  totalCount: number;
  breakdownByDevelopmentType: Record<string, number>;
  breakdownByMukim: Record<string, number>;
  breakdownByStatus: Record<string, number>;
}

/**
 * Status distribution item
 */
export interface StatusDistributionItem {
  status: ApplicationStatus | string;
  label: string;
  count: number;
  percentage: number;
}

/**
 * Compliance evaluation per category
 */
export interface CategoryComplianceMetric {
  category: RuleCategory | string;
  categoryName: string;
  totalEvaluated: number;
  compliantCount: number;
  nonCompliantCount: number;
  requiresReviewCount: number;
  insufficientDataCount: number;
  complianceRate: number;
}

/**
 * Common non-compliance technical rule
 */
export interface TopNonComplianceRule {
  ruleCode: string;
  ruleName: string;
  category: RuleCategory | string;
  timesEvaluated: number;
  nonCompliantCount: number;
  nonComplianceRate: number;
  sampleDenominatorText: string;
  ruleVersion: string;
}

/**
 * Issue ageing buckets
 */
export interface IssueAgeingBuckets {
  bucket_0_3_days: number;
  bucket_4_7_days: number;
  bucket_8_14_days: number;
  bucket_15_30_days: number;
  bucket_over_30_days: number;
  totalOpenIssues: number;
  medianAgeDays: number;
}

/**
 * Operational officer workload (non-punitive aggregate queue metrics)
 */
export interface OfficerWorkloadItem {
  officerUid: string;
  officerName: string;
  role: string;
  assignedApplicationsCount: number;
  openIssuesCount: number;
  pendingReviewCount: number;
  verifiedCommentsCount: number;
  medianReviewDurationHours: number;
}

/**
 * Turnaround duration by stages
 */
export interface ProcessingTimeMetrics {
  avgSubmissionToDocCheckHours: number;
  avgDocCheckToSmartCheckMinutes: number;
  avgSmartCheckToReviewHours: number;
  avgReviewToCommentHours: number;
  avgCommentToPublicationHours: number;
  medianTotalTurnaroundDays: number;
}

/**
 * Document Intelligence & Extraction quality
 */
export interface DocumentIntelligenceMetrics {
  totalDocumentsProcessed: number;
  processingSuccessCount: number;
  processingFailureCount: number;
  successRate: number;
  avgProcessingDurationSeconds: number;
  avgPageCount: number;
  factsExtractedCount: number;
  factsManuallyCorrectedCount: number;
  factsConfirmedUnchangedCount: number;
  factsMarkedUnknownCount: number;
  factsWithConflictsCount: number;
  manualCorrectionRate: number;
}

/**
 * AI comment drafting governance metrics
 */
export interface AiGovernanceMetrics {
  aiDraftsGenerated: number;
  manualDraftsCreated: number;
  aiDraftsVerified: number;
  aiDraftsEdited: number;
  averageEditRatioPercent: number;
  verifiedWithoutHumanCount: number; // MUST be 0
  humanVerificationRate: number; // MUST be 100%
  governanceBreachDetected: boolean;
  ruleEvidenceTraceabilityRate: number;
}

/**
 * Spatial planning & zoning intelligence
 */
export interface SpatialPlanningMetric {
  mukimDistribution: Array<{
    mukim: string;
    applicationCount: number;
    activeCount: number;
    topDevelopmentType: string;
    totalSiteAreaSqm: number;
  }>;
  rtdZoneDistribution: Array<{
    zoneCode: string;
    zoneName: string;
    applicationCount: number;
    totalSiteAreaSqm: number;
  }>;
  verifiedSiteLocationsCount: number;
  unresolvedGisLocationsCount: number;
  multiLotApplicationsCount: number;
  multiZoneApplicationsCount: number;
  areaMismatchCount: number;
}

/**
 * Operational Management Alert Model (Collection: managementAlerts/{alertId})
 */
export type ManagementAlertType =
  | "CRITICAL_ISSUE_BACKLOG"
  | "SMARTCHECK_FAILURE_SPIKE"
  | "DOCUMENT_PROCESSING_FAILURE"
  | "COMMENT_VERIFICATION_GOVERNANCE"
  | "REPORT_FAILURE_SPIKE"
  | "GIS_SERVICE_DEGRADATION";

export type ManagementAlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type ManagementAlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface ManagementAlert {
  alertId: string;
  alertType: ManagementAlertType;
  severity: ManagementAlertSeverity;
  status: ManagementAlertStatus;
  title: string;
  message: string;
  metric: string;
  threshold: number;
  actualValue: number;
  period: string;
  createdAt: Timestamp | string;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Timestamp | string | null;
  resolvedBy?: string | null;
  resolvedAt?: Timestamp | string | null;
}

/**
 * Configurable Performance Target Model (Collection: managementTargets/{targetId})
 */
export interface ManagementTarget {
  targetId: string;
  kpiCode: KpiCode;
  targetName: string;
  targetValue: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  approvedBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Immutable Aggregated Snapshot Document (Collection: analyticsSnapshots/{snapshotId})
 */
export interface AnalyticsSnapshot {
  snapshotId: string;
  snapshotDate: string; // "YYYY-MM-DD"
  schemaVersion: string;
  generatedAt: Timestamp | string;
  summaryKpis: ManagementSummaryKpis;
  statusDistribution: StatusDistributionItem[];
  categoryCompliance: CategoryComplianceMetric[];
  topNonCompliance: TopNonComplianceRule[];
  issueAgeing: IssueAgeingBuckets;
  processingTimes: ProcessingTimeMetrics;
  documentMetrics: DocumentIntelligenceMetrics;
  aiGovernance: AiGovernanceMetrics;
  spatial: SpatialPlanningMetric;
}

/**
 * Complete Management Dashboard API Response DTO
 */
export interface ManagementDashboardResponse {
  metadata: {
    timeRange: {
      from: string;
      to: string;
      preset: AnalyticsTimePreset;
    };
    filtersApplied: AnalyticsFilter;
    dataFreshness: "REALTIME" | "NEAR_REALTIME" | "DAILY_SNAPSHOT";
    generatedAt: string;
    schemaVersion: string;
    sampleSize: number;
    hasInsufficientData: boolean;
  };
  summaryKpis: ManagementSummaryKpis;
  applicationTrend: ApplicationTrendPoint[];
  statusDistribution: StatusDistributionItem[];
  developmentTypeDistribution: Array<{ type: string; label: string; count: number; percentage: number }>;
  smartCheckStatusDistribution: Array<{ status: string; label: string; count: number; percentage: number }>;
  categoryCompliance: CategoryComplianceMetric[];
  topNonCompliance: TopNonComplianceRule[];
  issueAgeing: IssueAgeingBuckets;
  officerWorkload: OfficerWorkloadItem[];
  processingTimes: ProcessingTimeMetrics;
  spatialSummary: SpatialPlanningMetric;
  aiGovernance: AiGovernanceMetrics;
  activeAlerts: ManagementAlert[];
  targets: ManagementTarget[];
  descriptiveInsights: string[];
}

/**
 * Simplified Executive Summary Response
 */
export interface ExecutiveSummaryResponse {
  metadata: {
    generatedAt: string;
    period: string;
  };
  totalApplications: number;
  activeApplications: number;
  revisionRequiredCount: number;
  criticalOpenIssuesCount: number;
  avgSmartCheckDurationSeconds: number;
  humanVerificationRate: number;
  topMukim: string;
  topDevelopmentType: string;
  activeAlertsCount: number;
}
