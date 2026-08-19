import { z } from "zod";
import { ALLOWED_RULE_CATEGORIES, ALLOWED_SEVERITIES } from "./rules.schema.ts";

export const ALLOWED_ISSUE_TYPES = [
  "NON_COMPLIANCE",
  "OFFICER_REVIEW",
  "MISSING_INFORMATION",
  "DATA_CONFLICT",
  "GIS_REVIEW",
  "PROCESSING_ERROR",
  "OTHER",
] as const;

export const ALLOWED_ISSUE_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "WAITING_APPLICANT",
  "RESOLVED",
  "CLOSED",
  "SUPERSEDED",
] as const;

export const ALLOWED_RESOLUTION_TYPES = [
  "APPLICANT_AMENDED_DOCUMENT",
  "OFFICER_ACCEPTED_JUSTIFICATION",
  "DATA_CORRECTED",
  "GIS_CORRECTED",
  "RULE_REVIEW_REQUIRED",
  "NOT_APPLICABLE_CONFIRMED",
  "SYSTEM_ERROR_RESOLVED",
  "SUPERSEDED_BY_NEW_SMARTCHECK",
  "OTHER",
] as const;

export const CreateIssueSchema = z.object({
  resultId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleCode: z.string().min(1),
  category: z.enum(ALLOWED_RULE_CATEGORIES),
  issueType: z.enum(ALLOWED_ISSUE_TYPES),
  title: z.string().min(3).max(255),
  description: z.string().min(3).max(2000),
  severity: z.enum(ALLOWED_SEVERITIES).default("MAJOR"),
  officerPriority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().nullable().optional(),
  assignedRole: z.string().nullable().optional(),
  visibility: z.enum(["INTERNAL", "APPLICANT_VISIBLE"]).default("INTERNAL"),
});

export const UpdateIssueStatusSchema = z.object({
  status: z.enum(ALLOWED_ISSUE_STATUSES),
  reason: z.string().min(3).max(1000).optional(),
});

export const AssignIssueSchema = z.object({
  assignedTo: z.string().min(1),
  assignedRole: z.string().min(1),
});

export const AddIssueNoteSchema = z.object({
  noteType: z.enum(["INTERNAL", "APPLICANT_VISIBLE", "TECHNICAL", "RESOLUTION"]),
  content: z.string().min(2).max(2000),
});

export const PublishIssueSchema = z.object({
  officerCommentDraft: z.string().max(2000).optional(),
});

export const ResolveIssueSchema = z.object({
  resolutionType: z.enum(ALLOWED_RESOLUTION_TYPES),
  resolutionNote: z.string().min(3, "Catatan penyelesaian wajib diisi").max(2000),
});
