import type { Timestamp } from "firebase/firestore";

export type DocumentType =
  | "LCP"
  | "SITE_PLAN"
  | "LOCATION_PLAN"
  | "LAYOUT_PLAN"
  | "BUILDING_PLAN"
  | "SUPPORTING_DOCUMENT"
  | "OTHER";

export const ALLOWED_DOCUMENT_TYPES: readonly DocumentType[] = [
  "LCP",
  "SITE_PLAN",
  "LOCATION_PLAN",
  "LAYOUT_PLAN",
  "BUILDING_PLAN",
  "SUPPORTING_DOCUMENT",
  "OTHER",
] as const;

export type DocumentStatus = "ACTIVE" | "SUPERSEDED" | "REJECTED" | "ARCHIVED";

export const ALLOWED_DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  "ACTIVE",
  "SUPERSEDED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ProcessingStatus =
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export const ALLOWED_PROCESSING_STATUSES: readonly ProcessingStatus[] = [
  "NOT_STARTED",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

/**
 * Complete Document Metadata Schema: applications/{applicationId}/documents/{documentId}
 * NOTE: Raw binary PDF content is stored in Cloud Storage, NEVER in Firestore.
 */
export interface DocumentMetadata {
  id?: string;
  documentId: string;
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  originalFileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number; // in bytes, max 50MB (52428800)
  version: number;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: Timestamp | string;
  isCurrent: boolean;
  supersedesDocumentId: string | null;
  checksum: string | null;
  processingStatus: ProcessingStatus;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: Timestamp | string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Result structure for Document Completeness Check
 */
export interface DocumentCompletenessResult {
  complete: boolean;
  missingDocuments: DocumentType[];
  uploadedDocuments: DocumentType[];
  totalUploaded: number;
}
