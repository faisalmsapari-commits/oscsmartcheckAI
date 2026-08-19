import type { Timestamp } from "firebase/firestore";
import type { RuleCategory, RuleSeverity } from "./rules.ts";

export type IssueType =
  | "NON_COMPLIANCE"
  | "OFFICER_REVIEW"
  | "MISSING_INFORMATION"
  | "DATA_CONFLICT"
  | "GIS_REVIEW"
  | "PROCESSING_ERROR"
  | "OTHER";

export type IssueStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "WAITING_APPLICANT"
  | "RESOLVED"
  | "CLOSED"
  | "SUPERSEDED";

export type IssueSource = "AUTO_SMARTCHECK" | "OFFICER_CREATED" | "SYSTEM";

export type IssueVisibility = "INTERNAL" | "APPLICANT_VISIBLE";

export type IssueResolutionType =
  | "APPLICANT_AMENDED_DOCUMENT"
  | "OFFICER_ACCEPTED_JUSTIFICATION"
  | "DATA_CORRECTED"
  | "GIS_CORRECTED"
  | "RULE_REVIEW_REQUIRED"
  | "NOT_APPLICABLE_CONFIRMED"
  | "SYSTEM_ERROR_RESOLVED"
  | "SUPERSEDED_BY_NEW_SMARTCHECK"
  | "OTHER";

export type NoteType = "INTERNAL" | "APPLICANT_VISIBLE" | "TECHNICAL" | "RESOLUTION";

export type OfficerPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

/**
 * SmartCheck Issue Document (Collection: applications/{applicationId}/issues/{issueId})
 */
export interface SmartCheckIssue {
  id?: string;
  issueId: string;
  applicationId: string;
  smartCheckId: string;
  resultId: string;
  ruleId: string;
  ruleCode: string;
  category: RuleCategory;
  issueType: IssueType;
  title: string;
  description: string;
  severity: RuleSeverity;
  officerPriority?: OfficerPriority;
  status: IssueStatus;
  source: IssueSource;
  visibility: IssueVisibility;
  assignedTo: string | null;
  assignedRole: string | null;
  officerCommentDraft?: string | null;
  applicantComment?: string | null;
  supersedesIssueId?: string | null;
  resolutionType?: IssueResolutionType | null;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Timestamp | string | null;
  publishedBy?: string | null;
  publishedAt?: Timestamp | string | null;
  createdBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Issue Note Subcollection (applications/{applicationId}/issues/{issueId}/notes/{noteId})
 */
export interface IssueNote {
  id?: string;
  noteId: string;
  issueId: string;
  authorId: string;
  authorName?: string;
  authorRole: string;
  noteType: NoteType;
  content: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Application Issue Summary Breakdown
 */
export interface ApplicationIssueSummary {
  totalIssues: number;
  openIssues: number;
  inReviewIssues: number;
  waitingApplicantIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  majorIssues: number;
}
