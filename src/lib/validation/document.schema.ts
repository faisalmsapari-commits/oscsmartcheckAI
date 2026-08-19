import { z } from "zod";

export const ALLOWED_DOCUMENT_TYPES = [
  "LCP",
  "SITE_PLAN",
  "LOCATION_PLAN",
  "LAYOUT_PLAN",
  "BUILDING_PLAN",
  "SUPPORTING_DOCUMENT",
  "OTHER",
] as const;

export const ALLOWED_DOCUMENT_STATUSES = [
  "ACTIVE",
  "SUPERSEDED",
  "REJECTED",
  "ARCHIVED",
] as const;

export const ALLOWED_PROCESSING_STATUSES = [
  "NOT_STARTED",
  "UPLOADED",
  "QUEUED",
  "PROCESSING",
  "PROCESSED",
  "COMPLETED",
  "FAILED",
] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 52428800; // 50MB

export const DocumentMetadataSchema = z
  .object({
    documentId: z.string().optional(),
    applicationId: z.string().optional(),
    documentType: z.enum(ALLOWED_DOCUMENT_TYPES),
    fileName: z.string().min(1).max(255),
    originalFileName: z.string().min(1).max(255).optional(),
    storagePath: z.string().min(5),
    mimeType: z.string().refine((val) => val === "application/pdf", {
      message: "Format fail tidak sah. Hanya fail PDF dibenarkan.",
    }),
    fileSize: z.number().int().positive().max(MAX_DOCUMENT_FILE_SIZE_BYTES, "Saiz fail dokumen melebihi 50 MB.").optional(),
    sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_FILE_SIZE_BYTES, "Saiz fail dokumen melebihi 50 MB.").optional(),
    version: z.number().int().positive().default(1).optional(),
    versionNumber: z.number().int().positive().default(1).optional(),
    status: z.enum(ALLOWED_DOCUMENT_STATUSES).default("ACTIVE").optional(),
    uploadedBy: z.string().min(1),
    isCurrent: z.boolean().default(true).optional(),
    supersedesDocumentId: z.string().nullable().default(null).optional(),
    checksum: z.string().length(64).nullable().default(null).optional(),
    sha256: z.string().length(64).nullable().default(null).optional(),
    processingStatus: z.enum(ALLOWED_PROCESSING_STATUSES).default("UPLOADED"),
    rejectionReason: z.string().nullable().optional(),
    rejectedBy: z.string().nullable().optional(),
  })
  .refine((data) => data.fileSize !== undefined || data.sizeBytes !== undefined, {
    message: "Saiz fail (fileSize atau sizeBytes) diperlukan.",
  })
  .transform((data) => ({
    ...data,
    documentId: data.documentId || "",
    applicationId: data.applicationId || "",
    fileSize: data.fileSize ?? data.sizeBytes ?? 0,
    sizeBytes: data.sizeBytes ?? data.fileSize ?? 0,
    version: data.version ?? data.versionNumber ?? 1,
    versionNumber: data.versionNumber ?? data.version ?? 1,
    checksum: data.checksum ?? data.sha256 ?? null,
    sha256: data.sha256 ?? data.checksum ?? null,
    originalFileName: data.originalFileName ?? data.fileName,
  }));

export const UploadDocumentRequestSchema = z.object({
  documentType: z.enum(ALLOWED_DOCUMENT_TYPES),
  originalFileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_DOCUMENT_FILE_SIZE_BYTES, "Saiz fail dokumen tidak boleh melebihi 50 MB."),
  mimeType: z.literal("application/pdf"),
});
