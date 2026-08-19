import { z } from "zod";

export const ALLOWED_FACT_CATEGORIES = [
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

export const FactEvidenceSchema = z.object({
  documentId: z.string().min(1),
  documentVersion: z.number().int().positive(),
  pageNumber: z.number().int().positive(),
  quotedText: z.string().min(1),
  tableReference: z.string().nullable().default(null),
});

export const PlanningFactSchema = z.object({
  factId: z.string().min(1),
  applicationId: z.string().min(1),
  documentId: z.string().min(1),
  documentVersion: z.number().int().positive(),
  key: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(ALLOWED_FACT_CATEGORIES),
  value: z.unknown(),
  unit: z.string().nullable().default(null),
  normalizedValue: z.union([z.number(), z.string(), z.boolean()]).nullable().default(null),
  status: z.enum([
    "EXTRACTED",
    "NOT_FOUND",
    "AMBIGUOUS",
    "CONFLICT",
    "MANUALLY_CONFIRMED",
    "MANUALLY_CORRECTED",
    "AI_DETECTED",
    "CONFIRMED",
    "CORRECTED",
    "REJECTED",
  ]),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  sourceEvidence: z.array(FactEvidenceSchema).default([]),
  aiGenerated: z.boolean().default(true),
  confirmedValue: z.unknown().nullable().default(null),
  confirmedBy: z.string().nullable().default(null),
  confirmedAt: z.string().nullable().default(null),
  rejectionReason: z.string().nullable().optional(),
});

export const ProcessingJobSchema = z.object({
  jobId: z.string().min(1),
  applicationId: z.string().min(1),
  documentId: z.string().min(1),
  documentVersion: z.number().int().positive(),
  jobType: z.literal("LCP_EXTRACTION"),
  status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]),
  stage: z.enum(["DOCUMENT_AI", "TEXT_NORMALIZATION", "AI_EXTRACTION", "VALIDATION", "PERSISTENCE", "COMPLETED"]),
  progressPercent: z.number().min(0).max(100),
  startedBy: z.string().min(1),
  startedAt: z.string(),
  completedAt: z.string().nullable().default(null),
  errorCode: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  retryCount: z.number().int().nonnegative().default(0),
  documentHash: z.string().nullable().default(null),
  processorVersion: z.string(),
  aiModel: z.string().nullable().default(null),
  promptVersion: z.string().nullable().default(null),
});

export const ConfirmFactRequestSchema = z.object({
  confirmedValue: z.unknown().optional(),
});

export const CorrectFactRequestSchema = z.object({
  correctedValue: z.unknown(),
  reason: z.string().max(500).optional(),
});
