import { z } from "zod";

export const ExtractedFactSchema = z.object({
  parameterCode: z.string().min(2).max(100),
  parameterName: z.string().min(2).max(200),
  detectedValue: z.unknown(),
  confirmedValue: z.unknown().nullable().default(null),
  unit: z.string().max(50).nullable().default(null),
  confidence: z.number().min(0).max(1).nullable().default(null),
  source: z.object({
    documentId: z.string().min(1),
    page: z.number().int().positive().nullable().default(null),
    textReference: z.string().max(500).nullable().default(null),
  }),
  status: z.enum(["AI_DETECTED", "CONFIRMED", "CORRECTED", "REJECTED"]).default("AI_DETECTED"),
  confirmedBy: z.string().nullable().default(null),
});

export const SmartCheckRunSchema = z.object({
  ruleSetVersion: z.string().min(1),
  status: z.enum(["RUNNING", "COMPLETED", "FAILED"]).default("RUNNING"),
  overallResult: z
    .enum(["PATUH", "TIDAK_PATUH", "PERLU_PENGESAHAN", "TIDAK_BERKENAAN"])
    .default("PERLU_PENGESAHAN"),
  score: z.number().min(0).max(100).nullable().default(null),
});
