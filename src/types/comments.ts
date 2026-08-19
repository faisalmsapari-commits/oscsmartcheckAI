import type { Timestamp } from "firebase/firestore";
import type {
  RuleCategory,
  RuleSeverity,
  ComplianceStatus,
  OverallPrecheckStatus,
  FactProvenance,
} from "./rules.ts";
import type { IssueType, IssueStatus, IssueVisibility } from "./issues.ts";

export interface RuleEvidence {
  sourceDocumentId: string;
  sourceDocumentVersion: string | number;
  sourceClause: string;
  sourcePage: number;
  sourceTextExcerpt: string;
}

export type CommentDraftType =
  | "RESULT_EXPLANATION"
  | "ISSUE_COMMENT"
  | "OSC_FULL_DRAFT"
  | "EXECUTIVE_SUMMARY";

export type DraftStatus =
  | "GENERATING"
  | "AI_DRAFT"
  | "OFFICER_EDITING"
  | "READY_FOR_VERIFICATION"
  | "VERIFIED"
  | "SUPERSEDED"
  | "FAILED";

export type DraftStyle = "CONCISE" | "STANDARD" | "DETAILED";

export type VerifiedCommentStatus = "VERIFIED" | "SUPERSEDED" | "REVOKED";

export type CommentVisibility = "INTERNAL" | "READY_FOR_PUBLICATION" | "APPLICANT_VISIBLE";

export type DraftFreshness =
  | "CURRENT"
  | "STALE_SMARTCHECK_CHANGED"
  | "STALE_ISSUES_CHANGED"
  | "STALE_OFFICER_REVIEW_CHANGED"
  | "STALE_SOURCE_CHANGED"
  | "STALE_MULTIPLE";

/**
 * Compact, PII-Minimized Structured Context for Gemini / Genkit
 */
export interface PlanningCommentContext {
  application: {
    applicationId: string;
    applicationNo: string;
    projectTitle: string;
    developmentType: string;
    lotNumbers: string[];
    mukim: string;
  };
  sourceVersions: {
    lcpVersion: number;
    siteVersion: number;
    smartCheckVersion: string;
    ruleEngineVersion: string;
    ruleSetVersions: string[];
    gisDatasetVersions: string[];
    promptVersion: string;
  };
  smartCheck: {
    smartCheckId: string;
    overallStatus: OverallPrecheckStatus;
    totalRulesEvaluated: number;
    compliantCount: number;
    nonCompliantCount: number;
    requiresReviewCount: number;
    insufficientDataCount: number;
    categorySummaries: Record<string, { total: number; compliant: number; nonCompliant: number; requiresReview: number }>;
  };
  results: Array<{
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    category: RuleCategory;
    machineStatus: ComplianceStatus;
    severity: RuleSeverity;
    actualValue: unknown;
    requiredValue: unknown;
    difference: number | null;
    unit?: string | null;
    ruleEvidence: RuleEvidence;
    inputEvidence: FactProvenance[];
  }>;
  officerAssessments: Array<{
    resultId: string;
    assessment: "AGREE" | "DISAGREE";
    reason: string;
  }>;
  issues: Array<{
    issueId: string;
    ruleCode: string;
    category: RuleCategory;
    issueType: IssueType;
    severity: RuleSeverity;
    status: IssueStatus;
    visibility: IssueVisibility;
    title: string;
    description: string;
    officerCommentDraft?: string | null;
    resolutionNote?: string | null;
  }>;
  verifiedFacts: Array<{
    key: string;
    value: unknown;
    unit?: string;
    source: string;
  }>;
  spatialFacts: Array<{
    key: string;
    value: unknown;
    unit?: string;
    datasetVersion: string;
  }>;
  reviewCompleteness: {
    completenessPercent: number;
    criticalOpenIssues: number;
    readyForDraftComment: boolean;
  };
}

export interface SourceReference {
  type: "RULE" | "LCP" | "GIS" | "FACT";
  ruleCode?: string;
  document?: string;
  clause?: string;
  page?: number;
  documentVersion?: number;
  description?: string;
}

export interface CategoryCommentSection {
  category: string;
  summary: string;
  findings: string[];
  actionRequired: string | null;
  evidenceRefs: string[];
}

export interface StructuredOscDraft {
  executiveSummary: string;
  planningContext: string;
  categoryComments: CategoryCommentSection[];
  issuesRequiringAction: Array<{
    issueId?: string;
    ruleCode: string;
    description: string;
    recommendedAction: string;
  }>;
  officerJudgementItems: Array<{
    ruleCode: string;
    finding: string;
    officerAssessment: string;
    implication: string;
  }>;
  recommendedApplicantActions: string[];
  conclusionDraft: string;
  sourceReferences: SourceReference[];
  warnings: string[];
}

/**
 * Comment Draft Document (applications/{applicationId}/commentDrafts/{draftId})
 */
export interface CommentDraft {
  id?: string;
  draftId: string;
  applicationId: string;
  smartCheckId: string;
  draftType: CommentDraftType;
  draftStyle: DraftStyle;
  status: DraftStatus;
  version: number;
  revisionNumber: number;
  sourceFingerprint: string;
  sourceVersions: {
    lcpVersion: number;
    siteVersion: number;
    smartCheckId: string;
    engineVersion: string;
    promptVersion: string;
  };
  aiModel: string;
  promptVersion: string;
  generatedSections: StructuredOscDraft;
  aiGeneratedText: string;
  officerEditedText: string | null;
  createdBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  lastEditedBy?: string | null;
  editingLock?: {
    lockedBy: string;
    lockedAt: string;
    expiresAt: string;
  } | null;
}

/**
 * Verified Comment Snapshot (applications/{applicationId}/verifiedComments/{commentId})
 */
export interface VerifiedComment {
  id?: string;
  commentId: string;
  applicationId: string;
  smartCheckId: string;
  draftId: string;
  version: number;
  status: VerifiedCommentStatus;
  visibility: CommentVisibility;
  finalText: string;
  structuredSections: StructuredOscDraft;
  sourceSnapshot: {
    lcpVersion: number;
    siteVersion: number;
    smartCheckId: string;
    ruleSetVersions: string[];
    gisDatasetVersions: string[];
    engineVersion: string;
    promptVersion: string;
    sourceFingerprint: string;
  };
  checksum: string;
  verifiedBy: string;
  verifiedAt: Timestamp | string;
  publishedBy?: string | null;
  publishedAt?: Timestamp | string | null;
  revokedBy?: string | null;
  revokedAt?: Timestamp | string | null;
  revocationReason?: string | null;
  supersededByCommentId?: string | null;
  createdAt: Timestamp | string;
}

export interface CommentReadinessResult {
  ready: boolean;
  smartCheckReady: boolean;
  officerReviewReady: boolean;
  sourceReady: boolean;
  unresolvedCriticalErrors: string[];
  warnings: string[];
  blockingIssues: string[];
}

export interface DraftFreshnessResult {
  freshness: DraftFreshness;
  isStale: boolean;
  message: string;
  reasons: string[];
  currentFingerprint: string;
  draftFingerprint: string;
}

export interface CommentDiffResult {
  draftId: string;
  aiGeneratedText: string;
  officerEditedText: string;
  hasChanges: boolean;
  addedLines: string[];
  removedLines: string[];
}

export interface StandardPhraseTemplate {
  id?: string;
  templateId: string;
  name: string;
  category: string;
  text: string;
  isLocked: boolean;
  status: "ACTIVE" | "INACTIVE";
  version: number;
  approvedBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
