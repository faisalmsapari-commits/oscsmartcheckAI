import type { Timestamp } from "firebase/firestore";
import type { ApplicationStatus } from "./application.ts";
import type { UserRole } from "./common.ts";

/**
 * Request for Information (RFI) Models
 * Collection: applications/{applicationId}/requests/{requestId}
 */
export type RfiRequestType =
  | "DOCUMENT"
  | "CLARIFICATION"
  | "PLAN_AMENDMENT"
  | "TECHNICAL_INFORMATION"
  | "GIS_INFORMATION"
  | "OTHER";

export type RfiStatus =
  | "DRAFT"
  | "ISSUED"
  | "VIEWED"
  | "RESPONDED"
  | "PARTIALLY_RESPONDED"
  | "UNDER_REVIEW"
  | "SATISFIED"
  | "REJECTED_RESPONSE"
  | "SUPERSEDED"
  | "CANCELLED";

export type RfiVisibility = "INTERNAL" | "APPLICANT_VISIBLE";

export interface RequestForInformation {
  requestId: string;
  applicationId: string;
  requestType: RfiRequestType;
  title: string;
  description: string;
  status: RfiStatus;
  visibility: RfiVisibility;
  relatedIssueIds?: string[];
  relatedResultIds?: string[];
  requiredDocumentTypes?: string[];
  requestedFields?: string[];
  responseDeadline?: string | null;
  issuedBy?: string | null;
  issuedAt?: Timestamp | string | null;
  viewedByApplicantAt?: Timestamp | string | null;
  respondedAt?: Timestamp | string | null;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  previousDeadlines?: Array<{
    previousDeadline: string;
    newDeadline: string;
    changedBy: string;
    changedAt: Timestamp | string;
    reason: string;
  }>;
}

/**
 * Applicant Response Model
 * Collection: applications/{applicationId}/requests/{requestId}/responses/{responseId}
 */
export type ApplicantResponseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "PARTIALLY_ACCEPTED"
  | "REQUIRES_FURTHER_RESPONSE"
  | "SUPERSEDED";

export interface ApplicantResponse {
  responseId: string;
  requestId: string;
  applicationId: string;
  responseText: string;
  status: ApplicantResponseStatus;
  submittedBy: string;
  submittedAt?: Timestamp | string | null;
  relatedDocumentIds?: string[];
  relatedDocumentVersions?: Record<string, number>;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | string | null;
  reviewComment?: string | null;
}

/**
 * Resubmission Package Model
 */
export type ResubmissionPackageStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "REVIEWED"
  | "SUPERSEDED";

export interface ResubmissionPackage {
  packageId: string;
  applicationId: string;
  requestId?: string | null;
  documentIds: string[];
  responseId?: string | null;
  submittedBy: string;
  submittedAt: Timestamp | string;
  status: ResubmissionPackageStatus;
}

/**
 * Resubmission Impact Analysis
 */
export interface ResubmissionImpact {
  newDocuments: string[];
  supersededDocuments: string[];
  affectedExtractedFactsCount: number;
  affectedSmartChecksCount: number;
  affectedIssuesCount: number;
  affectedDraftCommentsCount: number;
  affectedReportsCount: number;
  requiresReprocessing: boolean;
}

/**
 * Provider-Neutral Notification Model
 * Collection: notifications/{notificationId}
 */
export type NotificationType =
  | "APPLICATION_SUBMITTED"
  | "DOCUMENT_REQUIRED"
  | "RFI_ISSUED"
  | "RFI_DEADLINE_APPROACHING"
  | "RFI_OVERDUE"
  | "APPLICANT_RESPONSE_SUBMITTED"
  | "NEW_DOCUMENT_VERSION"
  | "SMARTCHECK_COMPLETED"
  | "OFFICER_REVIEW_REQUIRED"
  | "ISSUE_PUBLISHED"
  | "COMMENT_PUBLISHED"
  | "REPORT_PUBLISHED"
  | "APPLICATION_COMPLETED"
  | "WORKFLOW_ESCALATION"
  | "SYSTEM_PROCESSING_FAILED";

export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "SMS";
export type NotificationStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "READ" | "CANCELLED";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationRecord {
  notificationId: string;
  recipientUserId: string;
  applicationId?: string | null;
  notificationType: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionUrl?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  deduplicationKey?: string;
  createdAt: Timestamp | string;
  sentAt?: Timestamp | string | null;
  readAt?: Timestamp | string | null;
  retryCount: number;
}

/**
 * Notification Template Model
 * Collection: notificationTemplates/{templateId}
 */
export interface NotificationTemplate {
  templateId: string;
  eventType: NotificationType;
  channel: NotificationChannel;
  language: "ms" | "en";
  subject: string;
  body: string;
  version: string;
  status: "ACTIVE" | "DEPRECATED";
  allowedVariables: string[];
}

/**
 * Internal Service Level Policy Model
 * Collection: serviceLevelPolicies/{policyId}
 */
export type ServiceDurationUnit = "HOURS" | "BUSINESS_HOURS" | "DAYS" | "BUSINESS_DAYS";

export interface ServiceLevelPolicy {
  policyId: string;
  code: string;
  name: string;
  description: string;
  appliesTo: "APPLICATION" | "RFI" | "OFFICER_REVIEW" | "DOCUMENT_CHECK" | "SMARTCHECK" | "REPORT" | "OTHER";
  triggerEvent: string;
  targetDuration: number;
  durationUnit: ServiceDurationUnit;
  warningThresholdPercent: number; // e.g. 80
  escalationThresholdPercent: number; // e.g. 100
  calendarId?: string | null;
  status: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
  effectiveFrom: string;
  effectiveTo?: string | null;
  approvedBy: string;
  approvedAt: Timestamp | string;
}

/**
 * Service Timer Instance
 * Collection: applications/{applicationId}/serviceTimers/{timerId}
 */
export type ServiceTimerStatus = "RUNNING" | "PAUSED" | "COMPLETED" | "BREACHED" | "CANCELLED";

export interface ServiceTimer {
  timerId: string;
  applicationId: string;
  policyId: string;
  entityType: string;
  entityId: string;
  startedAt: Timestamp | string;
  dueAt: Timestamp | string;
  pausedAt?: Timestamp | string | null;
  resumedAt?: Timestamp | string | null;
  completedAt?: Timestamp | string | null;
  status: ServiceTimerStatus;
  elapsedDurationSeconds: number;
  remainingDurationSeconds: number;
  breachedAt?: Timestamp | string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  pauseHistory?: Array<{
    pausedAt: Timestamp | string;
    resumedAt?: Timestamp | string | null;
    reason: string;
  }>;
}

/**
 * Operational Escalation Model
 * Collection: escalations/{escalationId}
 */
export type EscalationReason =
  | "SERVICE_TARGET_WARNING"
  | "SERVICE_TARGET_BREACH"
  | "CRITICAL_ISSUE_UNREVIEWED"
  | "RFI_OVERDUE"
  | "PROCESSING_FAILURE"
  | "OTHER";

export type EscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface EscalationRecord {
  escalationId: string;
  applicationId: string;
  entityType: string;
  entityId: string;
  reason: EscalationReason;
  severity: EscalationSeverity;
  status: EscalationStatus;
  title: string;
  description: string;
  assignedTo: string;
  assignedRole: UserRole;
  createdAt: Timestamp | string;
  acknowledgedAt?: Timestamp | string | null;
  resolvedAt?: Timestamp | string | null;
  resolvedBy?: string | null;
}

/**
 * Unified Work Item Queue Model
 * Collection: workItems/{workItemId}
 */
export type WorkItemType =
  | "DOCUMENT_REVIEW"
  | "LCP_EXTRACTION_REVIEW"
  | "GIS_VERIFICATION"
  | "SMARTCHECK_REVIEW"
  | "ISSUE_REVIEW"
  | "RFI_RESPONSE_REVIEW"
  | "COMMENT_VERIFICATION"
  | "REPORT_PUBLICATION"
  | "OTHER";

export type WorkItemStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "COMPLETED"
  | "CANCELLED"
  | "SUPERSEDED";

export interface WorkItem {
  workItemId: string;
  applicationId: string;
  workType: WorkItemType;
  entityId: string;
  title: string;
  description?: string;
  status: WorkItemStatus;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedTo?: string | null;
  assignedRole: UserRole;
  dueAt?: Timestamp | string | null;
  createdAt: Timestamp | string;
  completedAt?: Timestamp | string | null;
}

/**
 * Case Closure Snapshot & Readiness
 * Collection: applications/{applicationId}/closureSnapshots/{snapshotId}
 */
export interface CaseClosureReadiness {
  ready: boolean;
  currentSmartCheckExists: boolean;
  verifiedCommentExists: boolean;
  reportPublished: boolean;
  openApplicantVisibleRequestsCount: number;
  unresolvedCriticalIssuesCount: number;
  activeWorkItemsCount: number;
  blockingErrors: string[];
  warnings: string[];
}

export interface CaseClosureSnapshot {
  snapshotId: string;
  applicationId: string;
  createdAt: Timestamp | string;
  completedBy: string;
  completedByRole: string;
  sourceVersions: {
    applicationVersion: number;
    documentVersions: Record<string, number>;
    smartCheckId: string;
    verifiedCommentId: string;
    reportId: string;
    reportChecksumSha256: string;
  };
  finalWorkflowState: ApplicationStatus;
  summary: {
    totalIssuesEvaluated: number;
    resolvedIssuesCount: number;
    complianceSummary: string;
  };
  checksumSha256: string;
  statutoryNotice: string; // "Penyelesaian proses SmartCheck ini BUKAN merupakan kelulusan Kebenaran Merancang (KM)."
}

/**
 * Application Workflow Cycle Model
 * Collection: applications/{applicationId}/cycles/{cycleId}
 */
export interface WorkflowCycle {
  cycleId: string;
  cycleNumber: number;
  reason: string;
  startedAt: Timestamp | string;
  startedBy: string;
  completedAt?: Timestamp | string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
}

/**
 * Workflow Transition Record
 * Collection: applications/{applicationId}/workflowHistory/{transitionId}
 */
export interface WorkflowTransitionRecord {
  transitionId: string;
  applicationId: string;
  fromState: ApplicationStatus;
  toState: ApplicationStatus;
  transitionType: "MANUAL" | "AUTOMATIC" | "EXCEPTION";
  reasonCode?: string | null;
  reasonText?: string | null;
  triggeredBy: string;
  triggeredByRole: UserRole | "SYSTEM";
  automatic: boolean;
  createdAt: Timestamp | string;
  relatedIssueIds?: string[];
  relatedDocumentIds?: string[];
}
