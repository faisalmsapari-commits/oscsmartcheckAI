import type { Timestamp } from "firebase/firestore";

/**
 * Standard User Roles for OSC SmartCheck AI (MPLBP)
 */
export type UserRole =
  | "APPLICANT"
  | "OSC_OFFICER"
  | "PLANNING_OFFICER"
  | "GIS_OFFICER"
  | "OSC_MANAGER"
  | "PLANNING_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

/**
 * All permitted roles array for runtime validation
 */
export const ALLOWED_USER_ROLES: readonly UserRole[] = [
  "APPLICANT",
  "OSC_OFFICER",
  "PLANNING_OFFICER",
  "GIS_OFFICER",
  "OSC_MANAGER",
  "PLANNING_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

/**
 * Validates if an input string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return ALLOWED_USER_ROLES.includes(role as UserRole);
}

/**
 * Firebase Custom Claims Structure
 * Injected strictly by trusted server backend
 */
export interface CustomClaims {
  role?: UserRole;
  organizationId?: string;
  [key: string]: unknown;
}

/**
 * Firestore User Document: users/{uid}
 * Kept separately from authorization claims.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  department: string | null;
  designation: string | null;
  active: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  lastLoginAt: Timestamp | string | null;
}

/**
 * Compliance Evaluation Statuses
 * NOTE: AI cannot determine these statuses. They are computed by deterministic rules
 * and verified by authorized OSC Officers.
 */
export type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "CONDITIONAL" | "PENDING_REVIEW";

/**
 * Planning Application Status Lifecycle
 */
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "checking"
  | "requires_action"
  | "verified"
  | "rejected"
  | "approved";

/**
 * Navigation Item Definition for Header & Sidebar
 */
export interface NavItem {
  title: string;
  href: string;
  iconName?: string;
  badge?: string;
  allowedRoles?: UserRole[];
  disabled?: boolean;
}
