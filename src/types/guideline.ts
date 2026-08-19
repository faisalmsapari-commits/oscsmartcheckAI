import type { Timestamp } from "firebase/firestore";

/**
 * Statutory Planning Guideline: guidelines/{guidelineId}
 */
export interface Guideline {
  id?: string;
  title: string;
  code: string;
  version: string;
  effectiveFrom: Timestamp | string;
  effectiveTo: Timestamp | string | null;
  active: boolean;
  sourceDocumentPath: string | null;
  createdAt: Timestamp | string;
  createdBy: string;
}

export type RuleSetStatus = "DRAFT" | "ACTIVE" | "RETIRED";

/**
 * Rule Set Definition: ruleSets/{ruleSetId}
 */
export interface RuleSet {
  id?: string;
  code: string;
  name: string;
  version: string;
  status: RuleSetStatus;
  effectiveFrom: Timestamp | string;
  effectiveTo: Timestamp | string | null;
  createdAt: Timestamp | string;
  createdBy: string;
}

/**
 * Organization Record: organizations/{organizationId}
 */
export interface Organization {
  id?: string;
  name: string;
  code: string;
  type: "LOCAL_AUTHORITY" | "TECHNICAL_AGENCY" | "PRIVATE_FIRM" | "PUBLIC";
  active: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * System Parameter Configuration: systemConfig/{configId}
 */
export interface SystemConfig {
  id?: string;
  configKey: string;
  configValue: unknown;
  updatedAt: Timestamp | string;
  updatedBy: string;
}
