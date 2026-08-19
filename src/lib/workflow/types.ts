import type { ApplicationStatus } from "../../types/application.ts";
import type { UserRole } from "../../types/common.ts";

/**
 * Standardized Workflow Error Codes
 */
export type WorkflowErrorCode =
  | "UNAUTHENTICATED"
  | "PERMISSION_DENIED"
  | "APPLICATION_NOT_FOUND"
  | "INVALID_TRANSITION"
  | "VALIDATION_FAILED"
  | "APPLICATION_LOCKED"
  | "CONFLICT";

export class WorkflowError extends Error {
  public readonly code: WorkflowErrorCode;
  public readonly statusCode: number;

  constructor(code: WorkflowErrorCode, message: string, statusCode: number = 400) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Server Authenticated Actor Context
 */
export interface WorkflowActorContext {
  uid: string;
  role: UserRole | "SYSTEM";
  email: string;
  organizationId?: string;
}

/**
 * Input Parameters for Status Transition
 */
export interface TransitionStatusParams {
  applicationId: string;
  targetStatus: ApplicationStatus;
  remarks?: string;
  actor: WorkflowActorContext;
}

/**
 * Result of a Successful Transition
 */
export interface TransitionStatusResult {
  success: boolean;
  applicationId: string;
  applicationNo: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  currentVersion: number;
  updatedAt: string;
  statusHistoryId: string;
  auditLogId: string;
}
