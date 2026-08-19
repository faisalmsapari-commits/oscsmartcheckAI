import type { Timestamp } from "firebase/firestore";

export type FactStatus = "AI_DETECTED" | "CONFIRMED" | "CORRECTED" | "REJECTED";

export interface FactSource {
  documentId: string;
  page: number | null;
  textReference: string | null;
}

/**
 * Extracted Fact Schema: applications/{applicationId}/extractedFacts/{factId}
 */
export interface ExtractedFact {
  id?: string;
  parameterCode: string;
  parameterName: string;
  detectedValue: unknown;
  confirmedValue: unknown | null;
  unit: string | null;
  confidence: number | null;
  source: FactSource;
  status: FactStatus;
  createdAt: Timestamp | string;
  confirmedBy: string | null;
  confirmedAt: Timestamp | string | null;
}

export type SmartCheckStatus = "RUNNING" | "COMPLETED" | "FAILED";

export type SmartCheckOverallResult =
  | "PATUH"
  | "TIDAK_PATUH"
  | "PERLU_PENGESAHAN"
  | "TIDAK_BERKENAAN";

/**
 * SmartCheck Run Schema: applications/{applicationId}/smartChecks/{smartCheckId}
 */
export interface SmartCheckRun {
  id?: string;
  ruleSetVersion: string;
  status: SmartCheckStatus;
  overallResult: SmartCheckOverallResult;
  score: number | null;
  createdAt: Timestamp | string;
  completedAt: Timestamp | string | null;
}

/**
 * AI Run Audit Entry: aiRuns/{aiRunId}
 */
export interface AIRunRecord {
  id?: string;
  applicationId: string;
  documentId: string;
  modelName: string;
  modelVersion: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  createdAt: Timestamp | string;
  completedAt?: Timestamp | string | null;
}
