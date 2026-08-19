import type {
  SmartCheckRecord,
  RuleEvaluation,
  CategorySummary,
  OverallPrecheckStatus,
  ComplianceStatus,
} from "./rules.ts";
import type { SmartCheckIssue, ApplicationIssueSummary } from "./issues.ts";

export type FreshnessStatus =
  | "CURRENT"
  | "STALE_INPUT_CHANGED"
  | "STALE_RULE_CHANGED"
  | "STALE_SITE_CHANGED"
  | "STALE_MULTIPLE";

export interface SmartCheckFreshnessResult {
  freshness: FreshnessStatus;
  isStale: boolean;
  message: string;
  reasons: string[];
  currentLcpVersion: number;
  evaluatedLcpVersion: number;
  currentSiteVersion: number;
  evaluatedSiteVersion: number;
}

export interface RuleComparisonDiff {
  ruleCode: string;
  ruleName: string;
  category: string;
  statusA: ComplianceStatus;
  statusB: ComplianceStatus;
  actualValueA: unknown;
  actualValueB: unknown;
  requiredValueA: unknown;
  requiredValueB: unknown;
  differenceA?: number | null;
  differenceB?: number | null;
  changeType: "RESOLVED" | "DEGRADED" | "UNCHANGED" | "NEW_RULE" | "REMOVED_RULE";
}

export interface SmartCheckComparisonResult {
  applicationId: string;
  runA: {
    smartCheckId: string;
    overallStatus: OverallPrecheckStatus;
    lcpVersion: number;
    createdAt: string;
  };
  runB: {
    smartCheckId: string;
    overallStatus: OverallPrecheckStatus;
    lcpVersion: number;
    createdAt: string;
  };
  diffs: RuleComparisonDiff[];
  summary: {
    totalDiffs: number;
    resolvedCount: number;
    degradedCount: number;
    unchangedCount: number;
  };
}

export interface OfficerReviewCompleteness {
  smartCheckId: string;
  totalResults: number;
  resultsRequiringReview: number;
  reviewedResults: number;
  unreviewedResults: number;
  openIssues: number;
  criticalOpenIssues: number;
  readyForDraftComment: boolean;
  completenessPercent: number;
}

export interface OfficerQueueItem {
  applicationId: string;
  applicationNo: string;
  projectName: string;
  developmentType: string;
  applicantName: string;
  smartCheckId: string;
  overallStatus: OverallPrecheckStatus;
  totalIssues: number;
  criticalIssues: number;
  assignedOfficer: string | null;
  lastUpdated: string;
}

export interface SmartCheckDashboardData {
  application: {
    id: string;
    applicationNo: string;
    projectName: string;
    developmentType: string;
    applicantName: string;
    mukim: string;
    lotNumbers: string[];
    status: string;
  };
  smartCheck: SmartCheckRecord | null;
  results: RuleEvaluation[];
  categorySummaries: Record<string, CategorySummary>;
  issues: SmartCheckIssue[];
  issueSummary: ApplicationIssueSummary;
  freshness: SmartCheckFreshnessResult;
  reviewCompleteness: OfficerReviewCompleteness;
}
