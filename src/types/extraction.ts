import type { Timestamp } from "firebase/firestore";

export type FactCategory =
  | "SITE"
  | "PROJECT"
  | "LAND_USE"
  | "BUILDING"
  | "HOUSING"
  | "PARKING"
  | "OPEN_SPACE"
  | "ACCESS"
  | "AREA"
  | "INTENSITY"
  | "FACILITY"
  | "OTHER";

export const ALLOWED_FACT_CATEGORIES: readonly FactCategory[] = [
  "SITE",
  "PROJECT",
  "LAND_USE",
  "BUILDING",
  "HOUSING",
  "PARKING",
  "OPEN_SPACE",
  "ACCESS",
  "AREA",
  "INTENSITY",
  "FACILITY",
  "OTHER",
] as const;

export type FactStatus =
  | "EXTRACTED"
  | "NOT_FOUND"
  | "AMBIGUOUS"
  | "CONFLICT"
  | "MANUALLY_CONFIRMED"
  | "MANUALLY_CORRECTED"
  | "AI_DETECTED" // Backwards compatibility
  | "CONFIRMED"   // Backwards compatibility
  | "CORRECTED"   // Backwards compatibility
  | "REJECTED";   // Backwards compatibility

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface FactEvidence {
  documentId: string;
  documentVersion: number;
  pageNumber: number;
  quotedText: string;
  tableReference: string | null;
}

export interface FactConflictCandidate {
  value: unknown;
  pageNumber: number;
  quotedText: string;
}

export interface FactConflict {
  key: string;
  candidateValues: FactConflictCandidate[];
}

/**
 * Strongly-typed Planning Fact Entity
 * Stored at: applications/{applicationId}/extractedFacts/{factId}
 */
export interface PlanningFact<T = unknown> {
  id?: string;
  factId: string;
  applicationId: string;
  documentId: string;
  documentVersion: number;
  key: string;
  label: string;
  category: FactCategory;
  value: T | null;
  unit: string | null;
  normalizedValue: number | string | boolean | null;
  status: FactStatus;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  sourceEvidence: FactEvidence[];
  aiGenerated: boolean;
  confirmedValue: T | null;
  confirmedBy: string | null;
  confirmedAt: Timestamp | string | null;
  rejectionReason?: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type ProcessingJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ProcessingStage =
  | "DOCUMENT_AI"
  | "TEXT_NORMALIZATION"
  | "AI_EXTRACTION"
  | "VALIDATION"
  | "PERSISTENCE"
  | "COMPLETED";

/**
 * Processing Job Entity
 * Stored at: applications/{applicationId}/processingJobs/{jobId}
 */
export interface ProcessingJob {
  id?: string;
  jobId: string;
  applicationId: string;
  documentId: string;
  documentVersion: number;
  jobType: "LCP_EXTRACTION";
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  progressPercent: number;
  startedBy: string;
  startedAt: Timestamp | string;
  completedAt: Timestamp | string | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  documentHash: string | null;
  processorVersion: string;
  aiModel: string | null;
  promptVersion: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Normalized Page and Document structure extracted from Document AI
 */
export interface NormalizedPage {
  pageNumber: number;
  text: string;
  blocks?: unknown[];
  tables?: Array<{
    rowCount: number;
    columnCount: number;
    headerRows: string[][];
    bodyRows: string[][];
  }>;
}

export interface NormalizedDocument {
  documentId: string;
  totalPages: number;
  pages: NormalizedPage[];
  rawTextLength: number;
}

/**
 * Document Analysis record stored in Firestore
 * applications/{applicationId}/documentAnalysis/{analysisId}
 */
export interface DocumentAnalysisRecord {
  id?: string;
  analysisId: string;
  applicationId: string;
  documentId: string;
  documentVersion: number;
  totalPages: number;
  processor: string;
  processorVersion: string;
  rawOutputStoragePath?: string | null;
  createdAt: Timestamp | string;
}

/**
 * Summary and Completeness structures
 */
export interface ExtractionSummary {
  documentVersion: number;
  documentId: string;
  totalPages: number;
  totalExtracted: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  conflictCount: number;
  notFoundCount: number;
  confirmedCount: number;
  correctedCount: number;
}

export interface ExtractionCompleteness {
  documentVersion: number;
  totalRequiredFacts: number;
  extractedFacts: number;
  confirmedFacts: number;
  missingFacts: string[];
  conflicts: FactConflict[];
  lowConfidenceFacts: string[];
  readyForSmartCheck: boolean; // Informational only in Module 07
}

/**
 * AI Run Audit Entry: aiRuns/{aiRunId}
 */
export interface AIRunRecord {
  id?: string;
  aiRunId: string;
  applicationId: string;
  documentId: string;
  documentVersion: number;
  flowName: string;
  model: string;
  modelVersion: string | null;
  promptVersion: string | null;
  startedAt: Timestamp | string;
  completedAt: Timestamp | string | null;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  inputHash?: string | null;
  outputHash?: string | null;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;
  errorCode?: string | null;
  createdBy: string;
}
