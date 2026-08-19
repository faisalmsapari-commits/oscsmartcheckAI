import type { Application, ApplicationStatus } from "../../types/application.ts";
import type { UserRole } from "../../types/common.ts";
import type { WorkflowActorContext } from "./types.ts";
import { WorkflowError } from "./types.ts";

export interface StateTransitionRule {
  from: ApplicationStatus;
  to: ApplicationStatus;
  allowedRoles: Array<UserRole | "SYSTEM">;
  requiresOwnership?: boolean;
  requiresRemarks?: boolean;
}

/**
 * Authoritative State Transition Matrix
 */
export const WORKFLOW_TRANSITION_RULES: readonly StateTransitionRule[] = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    allowedRoles: ["APPLICANT", "SUPER_ADMIN"],
    requiresOwnership: true,
  },
  {
    from: "SUBMITTED",
    to: "DOCUMENT_CHECK",
    allowedRoles: ["OSC_OFFICER", "OSC_MANAGER", "SUPER_ADMIN"],
  },
  {
    from: "DOCUMENT_CHECK",
    to: "AWAITING_DOCUMENT_COMPLETION",
    allowedRoles: ["OSC_OFFICER", "OSC_MANAGER", "SUPER_ADMIN"],
    requiresRemarks: true,
  },
  {
    from: "AWAITING_DOCUMENT_COMPLETION",
    to: "RESUBMITTED",
    allowedRoles: ["APPLICANT", "SUPER_ADMIN"],
    requiresOwnership: true,
  },
  {
    from: "DOCUMENT_CHECK",
    to: "DOCUMENT_COMPLETE",
    allowedRoles: ["OSC_OFFICER", "OSC_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "DOCUMENT_COMPLETE",
    to: "AI_PROCESSING",
    allowedRoles: ["OSC_OFFICER", "OSC_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "DOCUMENT_CHECK",
    to: "AI_PROCESSING",
    allowedRoles: ["OSC_OFFICER", "OSC_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "AI_PROCESSING",
    to: "SMARTCHECK_READY",
    allowedRoles: ["SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "SMARTCHECK_READY",
    to: "SMARTCHECK_COMPLETED",
    allowedRoles: ["SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "AI_PROCESSING",
    to: "SMARTCHECK_COMPLETED",
    allowedRoles: ["SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "SMARTCHECK_COMPLETED",
    to: "OFFICER_REVIEW",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "OFFICER_REVIEW",
    to: "REQUEST_INFORMATION",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
    requiresRemarks: true,
  },
  {
    from: "OFFICER_REVIEW",
    to: "WAITING_APPLICANT",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
    requiresRemarks: true,
  },
  {
    from: "REQUEST_INFORMATION",
    to: "WAITING_APPLICANT",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "REQUEST_INFORMATION",
    to: "RESUBMITTED",
    allowedRoles: ["APPLICANT", "SUPER_ADMIN"],
    requiresOwnership: true,
  },
  {
    from: "WAITING_APPLICANT",
    to: "RESUBMITTED",
    allowedRoles: ["APPLICANT", "SUPER_ADMIN"],
    requiresOwnership: true,
  },
  {
    from: "RESUBMITTED",
    to: "RECHECK_REQUIRED",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "RESUBMITTED",
    to: "OFFICER_REVIEW",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
  },
  {
    from: "RECHECK_REQUIRED",
    to: "AI_PROCESSING",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "RECHECK_REQUIRED",
    to: "OFFICER_REVIEW",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
  },
  {
    from: "OFFICER_REVIEW",
    to: "VERIFIED",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
  },
  {
    from: "OFFICER_REVIEW",
    to: "VERIFIED_COMMENT_READY",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "SUPER_ADMIN"],
  },
  {
    from: "VERIFIED",
    to: "VERIFIED_COMMENT_READY",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "VERIFIED_COMMENT_READY",
    to: "REPORT_READY",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "VERIFIED",
    to: "REPORT_READY",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "SYSTEM", "SUPER_ADMIN"],
  },
  {
    from: "VERIFIED",
    to: "COMPLETED",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    from: "REPORT_READY",
    to: "COMPLETED",
    allowedRoles: ["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
] as const;

/**
 * Validates whether a transition from fromStatus to targetStatus is structurally permitted
 * and whether the actor is authorized.
 */
export function validateStateTransition(
  application: Application,
  targetStatus: ApplicationStatus,
  actor: WorkflowActorContext,
  remarks?: string
): StateTransitionRule {
  if (!actor || !actor.uid || !actor.role) {
    throw new WorkflowError(
      "UNAUTHENTICATED",
      "Authentication required to perform workflow transitions.",
      401
    );
  }

  // 1. Find matching transition rule
  const rule = WORKFLOW_TRANSITION_RULES.find(
    (r) => r.from === application.status && r.to === targetStatus
  );

  if (!rule) {
    throw new WorkflowError(
      "INVALID_TRANSITION",
      `Illegal transition from '${application.status}' to '${targetStatus}'.`,
      400
    );
  }

  // 2. Validate actor role
  const isSuperAdmin = actor.role === "SUPER_ADMIN";
  const isRoleAllowed = isSuperAdmin || rule.allowedRoles.includes(actor.role);

  if (!isRoleAllowed) {
    throw new WorkflowError(
      "PERMISSION_DENIED",
      `Actor with role '${actor.role}' is not authorized to transition from '${application.status}' to '${targetStatus}'.`,
      403
    );
  }

  // 3. Validate ownership constraint (e.g. Applicant submitting own draft or resubmitting)
  if (rule.requiresOwnership && !isSuperAdmin) {
    if (application.applicantUid !== actor.uid) {
      throw new WorkflowError(
        "PERMISSION_DENIED",
        "Ownership violation: You may only modify planning applications lodged by your account.",
        403
      );
    }
  }

  // 4. Validate remarks constraint (e.g. REQUEST_INFORMATION requires explanation)
  if (rule.requiresRemarks) {
    if (!remarks || remarks.trim().length === 0) {
      throw new WorkflowError(
        "VALIDATION_FAILED",
        `Transition to '${targetStatus}' requires explanatory remarks.`,
        400
      );
    }
  }

  // 5. Validate mandatory submission prerequisites for DRAFT -> SUBMITTED
  if (application.status === "DRAFT" && targetStatus === "SUBMITTED") {
    validateDraftSubmissionPayload(application);
  }

  return rule;
}

/**
 * Validates required planning fields before an application can be transitioned to SUBMITTED
 */
export function validateDraftSubmissionPayload(app: Application): void {
  const missing: string[] = [];

  if (!app.title || app.title.trim().length < 5) missing.push("title (minimum 5 characters)");
  if (!app.developmentType) missing.push("developmentType");
  if (!app.district || app.district.trim().length === 0) missing.push("district");
  if (!app.state || app.state.trim().length === 0) missing.push("state");
  if (!app.applicantUid) missing.push("applicantUid");

  const hasLotNo = !!app.lotNo && app.lotNo.trim().length > 0;
  const hasCoordinates =
    app.location &&
    typeof app.location.latitude === "number" &&
    typeof app.location.longitude === "number";

  if (!hasLotNo && !hasCoordinates) {
    missing.push("lotNo OR valid location coordinates (latitude & longitude)");
  }

  if (missing.length > 0) {
    throw new WorkflowError(
      "VALIDATION_FAILED",
      `Cannot submit application. Missing required statutory fields: ${missing.join(", ")}.`,
      400
    );
  }
}
