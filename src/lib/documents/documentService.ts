import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  DocumentMetadata,
  DocumentType,
  DocumentCompletenessResult,
} from "@/types/document";
import {
  DocumentMetadataSchema,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "@/lib/validation/document.schema";
import crypto from "crypto";

export interface UploadDocumentParams {
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  originalFileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
}

/**
 * Evaluates document completeness for KM applications.
 * Mandatory MVP document requirement: LCP
 */
export async function getDocumentCompleteness(
  applicationId: string,
  customDb?: Firestore
): Promise<DocumentCompletenessResult> {
  const db = customDb || getAdminDb();
  const docsSnap = await db
    .collection(`applications/${applicationId}/documents`)
    .where("isCurrent", "==", true)
    .where("status", "==", "ACTIVE")
    .get();

  const uploadedTypes = new Set<DocumentType>();
  docsSnap.forEach((doc) => {
    const data = doc.data() as DocumentMetadata;
    if (data.documentType) {
      uploadedTypes.add(data.documentType);
    }
  });

  const mandatoryTypes: DocumentType[] = ["LCP"];
  const missing = mandatoryTypes.filter((t) => !uploadedTypes.has(t));

  return {
    complete: missing.length === 0,
    missingDocuments: missing,
    uploadedDocuments: Array.from(uploadedTypes),
    totalUploaded: docsSnap.size,
  };
}

/**
 * Retrieves all documents for an application (both active and superseded)
 */
export async function getApplicationDocuments(
  applicationId: string,
  customDb?: Firestore
): Promise<DocumentMetadata[]> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection(`applications/${applicationId}/documents`)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentMetadata));
}

/**
 * Retrieves the current active document for a specific document type
 */
export async function getCurrentDocument(
  applicationId: string,
  documentType: DocumentType,
  customDb?: Firestore
): Promise<DocumentMetadata | null> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection(`applications/${applicationId}/documents`)
    .where("documentType", "==", documentType)
    .where("isCurrent", "==", true)
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as DocumentMetadata;
}

/**
 * Retrieves version history for a specific document type
 */
export async function getDocumentHistory(
  applicationId: string,
  documentType: DocumentType,
  customDb?: Firestore
): Promise<DocumentMetadata[]> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection(`applications/${applicationId}/documents`)
    .where("documentType", "==", documentType)
    .orderBy("version", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentMetadata));
}

/**
 * Computes next version number for a document type
 */
export async function getNextDocumentVersion(
  applicationId: string,
  documentType: DocumentType,
  customDb?: Firestore
): Promise<{ nextVersion: number; previousDoc: DocumentMetadata | null }> {
  const currentDoc = await getCurrentDocument(applicationId, documentType, customDb);
  if (!currentDoc) {
    return { nextVersion: 1, previousDoc: null };
  }
  return {
    nextVersion: (currentDoc.version || 1) + 1,
    previousDoc: currentDoc,
  };
}

/**
 * Atomically creates a document metadata record in Firestore and supersedes previous version
 */
export async function createDocumentRecord(
  params: Omit<DocumentMetadata, "createdAt" | "updatedAt" | "uploadedAt">,
  customDb?: Firestore
): Promise<DocumentMetadata> {
  const db = customDb || getAdminDb();
  const { applicationId, documentType, documentId } = params;

  return await db.runTransaction(async (tx) => {
    // 1. Check for existing active document of the same type
    const existingSnap = await tx.get(
      db
        .collection(`applications/${applicationId}/documents`)
        .where("documentType", "==", documentType)
        .where("isCurrent", "==", true)
    );

    let supersedesId: string | null = null;
    let computedVersion = params.version || 1;

    existingSnap.forEach((existingDoc) => {
      const exData = existingDoc.data() as DocumentMetadata;
      supersedesId = existingDoc.id;
      computedVersion = (exData.version || 1) + 1;

      // Supersede previous version
      tx.update(existingDoc.ref, {
        isCurrent: false,
        status: "SUPERSEDED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const newDocRef = db.collection(`applications/${applicationId}/documents`).doc(documentId);

    const fullDocData = {
      ...params,
      version: computedVersion,
      isCurrent: true,
      status: "ACTIVE" as const,
      supersedesDocumentId: supersedesId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      uploadedAt: FieldValue.serverTimestamp(),
    };

    tx.set(newDocRef, fullDocData);

    // Write audit log
    const auditRef = db.collection("auditLogs").doc();
    tx.set(auditRef, {
      eventType: supersedesId ? "DOCUMENT_VERSION_CREATED" : "DOCUMENT_UPLOADED",
      resourceType: "documents",
      resourceId: documentId,
      applicationId,
      actorUid: params.uploadedBy,
      actorRole: "APPLICANT",
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        documentType,
        fileName: params.fileName,
        originalFileName: params.originalFileName,
        version: computedVersion,
        fileSize: params.fileSize,
        supersedesDocumentId: supersedesId,
      },
    });

    return {
      ...params,
      version: computedVersion,
      isCurrent: true,
      status: "ACTIVE",
      supersedesDocumentId: supersedesId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
    } as DocumentMetadata;
  });
}

/**
 * Handles complete document upload: validation, storage write, and metadata registration
 */
export async function uploadDocument(
  params: UploadDocumentParams,
  customDb?: Firestore
): Promise<DocumentMetadata> {
  const {
    applicationId,
    documentType,
    fileName,
    originalFileName,
    fileBuffer,
    mimeType,
    fileSize,
    uploadedBy,
  } = params;

  // 1. Validation: MIME Type
  if (mimeType !== "application/pdf") {
    throw new Error("Format fail mestilah PDF (application/pdf) sahaja.");
  }

  // 2. Validation: File Size (Max 50MB)
  if (fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES || fileBuffer.length > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error("Saiz fail dokumen melebihi had maksimum 50 MB.");
  }

  const db = customDb || getAdminDb();

  // 3. Validation: Application state
  const appRef = db.collection("applications").doc(applicationId);
  const appDoc = await appRef.get();
  if (!appDoc.exists) {
    throw new Error("Permohonan tidak dijumpai.");
  }

  const appData = appDoc.data()!;
  if (appData.status === "VERIFIED" || appData.status === "COMPLETED") {
    throw new Error(`Permohonan berstatus '${appData.status}' tidak lagi menerima muat naik dokumen baharu.`);
  }

  // 4. Calculate Version & Storage Path
  const { nextVersion } = await getNextDocumentVersion(applicationId, documentType, db);
  const safeFileName = `${documentType.toLowerCase()}_v${nextVersion}.pdf`;
  const storagePath = `applications/${applicationId}/documents/${documentType}/v${nextVersion}/${safeFileName}`;

  // 5. Compute SHA-256 Checksum
  const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // 6. Upload file buffer to Firebase Cloud Storage
  try {
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    await file.save(fileBuffer, {
      contentType: "application/pdf",
      metadata: {
        applicationId,
        documentType,
        version: nextVersion.toString(),
        uploadedBy,
        originalFileName,
        checksum,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat storan awan";
    throw new Error(`Gagal memuat naik fail ke Cloud Storage: ${msg}`);
  }

  // 7. Register Firestore Metadata Record
  const documentId = crypto.randomUUID();

  DocumentMetadataSchema.parse({
    documentId,
    applicationId,
    documentType,
    fileName: safeFileName,
    originalFileName: originalFileName || fileName,
    storagePath,
    mimeType: "application/pdf",
    fileSize,
    version: nextVersion,
    status: "ACTIVE",
    uploadedBy,
    isCurrent: true,
    supersedesDocumentId: null,
    checksum,
    processingStatus: "NOT_STARTED",
  });

  const docPayload: Omit<DocumentMetadata, "createdAt" | "updatedAt" | "uploadedAt"> = {
    documentId,
    applicationId,
    documentType,
    fileName: safeFileName,
    originalFileName: originalFileName || fileName,
    storagePath,
    mimeType: "application/pdf",
    fileSize,
    version: nextVersion,
    status: "ACTIVE",
    uploadedBy,
    isCurrent: true,
    supersedesDocumentId: null,
    checksum,
    processingStatus: "NOT_STARTED",
  };

  return await createDocumentRecord(docPayload, db);
}

/**
 * Marks a document as rejected by an authorized officer
 */
export async function markDocumentRejected(
  applicationId: string,
  documentId: string,
  officerUid: string,
  reason: string,
  customDb?: Firestore
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error("Sebab penolakan dokumen diperlukan.");
  }

  const db = customDb || getAdminDb();
  const docRef = db.collection(`applications/${applicationId}/documents`).doc(documentId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new Error("Dokumen tidak dijumpai.");
  }

  await docRef.update({
    status: "REJECTED",
    rejectionReason: reason,
    rejectedBy: officerUid,
    rejectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "DOCUMENT_REJECTED",
    resourceType: "documents",
    resourceId: documentId,
    applicationId,
    actorUid: officerUid,
    actorRole: "OSC_OFFICER",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      reason,
      documentType: snap.data()?.documentType,
      version: snap.data()?.version,
    },
  });
}
