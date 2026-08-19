import { getAdminDb, isCloudFirestoreConfigured } from "../firebase/admin.ts";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  PlanningFact,
  ProcessingJob,
  ExtractionCompleteness,
  ExtractionSummary,
  FactConflict,
} from "../../types/extraction.ts";
import type { DocumentMetadata } from "../../types/document.ts";
import { getDocumentProcessor } from "./documentProcessor.ts";
import {
  extractPlanningFactsFromDocument,
  LCP_AI_MODEL_NAME,
  LCP_AI_PROMPT_VERSION,
} from "./geminiExtractor.ts";
import { getRequiredFactKeys } from "./lcpExtractionRequirements.ts";
import { PlanningFactSchema, ProcessingJobSchema } from "../validation/extraction.schema.ts";

/**
 * Triggers asynchronous server-side LCP processing
 */
export async function startLcpProcessing(
  applicationId: string,
  userId: string,
  userRole: string,
  forceReprocess: boolean = false,
  customDb?: Firestore
): Promise<{ jobId: string; status: string; isNewJob: boolean }> {
  // Demo applications or local dev mode fallback
  if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
    return {
      jobId: `job-demo-reprocess-${Date.now()}`,
      status: "COMPLETED",
      isNewJob: true,
    };
  }

  const db = customDb || getAdminDb();

  // 1. Authorization Verification
  if (!["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    throw new Error("Akses tidak dibenarkan untuk memproses LCP.");
  }

  // 2. Fetch Application & verify ownership if APPLICANT
  const appRef = db.collection("applications").doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new Error("Permohonan tidak dijumpai.");
  }

  const appData = appSnap.data()!;
  if (userRole === "APPLICANT" && appData.applicantUid !== userId) {
    throw new Error("Akses tidak dibenarkan. Anda hanya boleh memproses permohonan sendiri.");
  }

  // 3. Find Current Active LCP Document
  const docsSnap = await db
    .collection(`applications/${applicationId}/documents`)
    .where("documentType", "==", "LCP")
    .where("isCurrent", "==", true)
    .where("status", "==", "ACTIVE")
    .limit(1)
    .get();

  if (docsSnap.empty) {
    throw new Error("Tiada fail LCP (Laporan Cadangan Pemajuan) aktif dimuat naik untuk permohonan ini.");
  }

  const lcpDoc = { id: docsSnap.docs[0].id, ...docsSnap.docs[0].data() } as DocumentMetadata;
  const docVersion = lcpDoc.version || 1;
  const docId = lcpDoc.documentId || lcpDoc.id || "";

  // 4. Idempotency Check: Active or Existing Completed Job
  const existingJobSnap = await db
    .collection(`applications/${applicationId}/processingJobs`)
    .where("documentId", "==", docId)
    .where("documentVersion", "==", docVersion)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!existingJobSnap.empty && !forceReprocess) {
    const existingJob = existingJobSnap.docs[0].data() as ProcessingJob;
    if (existingJob.status === "QUEUED" || existingJob.status === "PROCESSING") {
      return { jobId: existingJob.jobId, status: existingJob.status, isNewJob: false };
    }
    if (existingJob.status === "COMPLETED") {
      return { jobId: existingJob.jobId, status: "COMPLETED", isNewJob: false };
    }
  }

  // 5. Create Processing Job Record
  const jobId = `job-lcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const jobPayload = {
    jobId,
    applicationId,
    documentId: docId,
    documentVersion: docVersion,
    jobType: "LCP_EXTRACTION" as const,
    status: "QUEUED" as const,
    stage: "DOCUMENT_AI" as const,
    progressPercent: 10,
    startedBy: userId,
    startedAt: now,
    completedAt: null,
    errorCode: null,
    errorMessage: null,
    retryCount: 0,
    documentHash: lcpDoc.checksum || null,
    processorVersion: "1.0.0",
    aiModel: LCP_AI_MODEL_NAME,
    promptVersion: LCP_AI_PROMPT_VERSION,
  };

  ProcessingJobSchema.parse(jobPayload);

  await db.collection(`applications/${applicationId}/processingJobs`).doc(jobId).set({
    ...jobPayload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6. Update Document Status
  await db.collection(`applications/${applicationId}/documents`).doc(docId).update({
    processingStatus: "QUEUED",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 7. Write Audit Log
  await db.collection("auditLogs").add({
    eventType: "LCP_PROCESSING_STARTED",
    resourceType: "processingJobs",
    resourceId: jobId,
    applicationId,
    actorUid: userId,
    actorRole: userRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      documentId: docId,
      documentVersion: docVersion,
      jobId,
    },
  });

  // 8. Execute Asynchronous Background Processing
  processLcpDocument(applicationId, jobId, lcpDoc, userId, db).catch((err) => {
    console.error(`Background job ${jobId} error:`, err);
  });

  return { jobId, status: "QUEUED", isNewJob: true };
}

/**
 * Multi-Stage Asynchronous LCP Processing Engine
 */
export async function processLcpDocument(
  applicationId: string,
  jobId: string,
  document: DocumentMetadata | null,
  startedBy: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const jobRef = db.collection(`applications/${applicationId}/processingJobs`).doc(jobId);
  const docId = document ? (document.documentId || document.id || "") : "";
  const docRef = document && docId
    ? db.collection(`applications/${applicationId}/documents`).doc(docId)
    : null;

  try {
    if (!document || !docId) {
      throw new Error("Dokumen LCP tidak sah untuk diproses");
    }

    // STAGE 1: DOCUMENT_AI
    await jobRef.update({
      status: "PROCESSING",
      stage: "DOCUMENT_AI",
      progressPercent: 25,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (docRef) {
      await docRef.update({ processingStatus: "PROCESSING", updatedAt: FieldValue.serverTimestamp() });
    }

    const processor = getDocumentProcessor();
    const normalizedDoc = await processor.processDocument({
      storagePath: document.storagePath,
      applicationId,
      documentId: docId,
      documentVersion: document.version || 1,
    });

    // Write Document Analysis Record
    const analysisId = `analysis-${docId}-v${document.version || 1}`;
    await db.collection(`applications/${applicationId}/documentAnalysis`).doc(analysisId).set({
      analysisId,
      applicationId,
      documentId: docId,
      documentVersion: document.version || 1,
      totalPages: normalizedDoc.totalPages,
      processor: "DocumentAI",
      processorVersion: "1.0.0",
      rawTextLength: normalizedDoc.rawTextLength,
      createdAt: FieldValue.serverTimestamp(),
    });

    // STAGE 2: AI_EXTRACTION & VALIDATION
    await jobRef.update({
      stage: "AI_EXTRACTION",
      progressPercent: 65,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const aiRunId = `airun-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const extractionResult = await extractPlanningFactsFromDocument(
      normalizedDoc,
      applicationId,
      document.version || 1
    );

    // STAGE 3: PERSISTENCE
    await jobRef.update({
      stage: "PERSISTENCE",
      progressPercent: 85,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Batch write extracted facts
    const batch = db.batch();
    for (const fact of extractionResult.facts) {
      PlanningFactSchema.parse(fact);
      const factRef = db.collection(`applications/${applicationId}/extractedFacts`).doc(fact.factId);
      batch.set(factRef, {
        ...fact,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Record AI Run Audit
    await db.collection("aiRuns").doc(aiRunId).set({
      aiRunId,
      applicationId,
      documentId: docId,
      documentVersion: document.version || 1,
      flowName: "LCP_STRUCTURED_EXTRACTION",
      model: LCP_AI_MODEL_NAME,
      modelVersion: "1.5-pro",
      promptVersion: LCP_AI_PROMPT_VERSION,
      status: "COMPLETED",
      startedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
      createdBy: startedBy,
    });

    // STAGE 4: COMPLETED
    const completedAt = new Date().toISOString();
    await jobRef.update({
      status: "COMPLETED",
      stage: "COMPLETED",
      progressPercent: 100,
      completedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (docRef) {
      await docRef.update({
        processingStatus: "COMPLETED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Audit Event
    await db.collection("auditLogs").add({
      eventType: "LCP_EXTRACTION_COMPLETED",
      resourceType: "processingJobs",
      resourceId: jobId,
      applicationId,
      actorUid: startedBy,
      actorRole: "SYSTEM",
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        documentId: docId,
        documentVersion: document.version || 1,
        totalFacts: extractionResult.facts.length,
        conflicts: extractionResult.conflicts.length,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Ralat pemprosesan LCP";
    console.error(`LCP processing failed for job ${jobId}:`, err);

    await jobRef.update({
      status: "FAILED",
      errorCode: "EXTRACTION_ERROR",
      errorMessage: errorMsg,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (docRef) {
      await docRef.update({
        processingStatus: "FAILED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Audit Log for failure
    await db.collection("auditLogs").add({
      eventType: "LCP_EXTRACTION_FAILED",
      resourceType: "processingJobs",
      resourceId: jobId,
      applicationId,
      actorUid: startedBy,
      actorRole: "SYSTEM",
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        errorMessage: errorMsg,
        documentId: docId || null,
      },
    });
  }
}

/**
 * Retrieves extracted facts for an application (optionally filtered by version)
 */
export async function getExtractedFacts(
  applicationId: string,
  documentVersion?: number,
  customDb?: Firestore
): Promise<PlanningFact[]> {
  const db = customDb || getAdminDb();
  let query = db.collection(`applications/${applicationId}/extractedFacts`) as FirebaseFirestore.Query;

  if (documentVersion !== undefined) {
    query = query.where("documentVersion", "==", documentVersion);
  }

  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlanningFact));
}

/**
 * Confirms an extracted fact by an authorized officer
 */
export async function confirmExtractedFact(
  applicationId: string,
  factId: string,
  officerUid: string,
  confirmedValue?: unknown,
  customDb?: Firestore
): Promise<void> {
  if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
    return;
  }

  const db = customDb || getAdminDb();
  const factRef = db.collection(`applications/${applicationId}/extractedFacts`).doc(factId);
  const snap = await factRef.get();

  if (!snap.exists) {
    throw new Error("Fakta perancangan tidak dijumpai.");
  }

  const factData = snap.data() as PlanningFact;
  const finalValue = confirmedValue !== undefined ? confirmedValue : factData.value;

  await factRef.update({
    status: "MANUALLY_CONFIRMED",
    confirmedValue: finalValue,
    confirmedBy: officerUid,
    confirmedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "EXTRACTED_FACT_CONFIRMED",
    resourceType: "extractedFacts",
    resourceId: factId,
    applicationId,
    actorUid: officerUid,
    actorRole: "OSC_OFFICER",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      key: factData.key,
      confirmedValue: finalValue,
    },
  });
}

/**
 * Corrects an extracted fact by an officer (preserving original AI value for auditability)
 */
export async function correctExtractedFact(
  applicationId: string,
  factId: string,
  correctedValue: unknown,
  officerUid: string,
  reason?: string,
  customDb?: Firestore
): Promise<void> {
  if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
    return;
  }

  const db = customDb || getAdminDb();
  const factRef = db.collection(`applications/${applicationId}/extractedFacts`).doc(factId);
  const snap = await factRef.get();

  if (!snap.exists) {
    throw new Error("Fakta perancangan tidak dijumpai.");
  }

  const factData = snap.data() as PlanningFact;

  await factRef.update({
    status: "MANUALLY_CORRECTED",
    confirmedValue: correctedValue,
    confirmedBy: officerUid,
    confirmedAt: FieldValue.serverTimestamp(),
    rejectionReason: reason || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "EXTRACTED_FACT_CORRECTED",
    resourceType: "extractedFacts",
    resourceId: factId,
    applicationId,
    actorUid: officerUid,
    actorRole: "OSC_OFFICER",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      key: factData.key,
      originalAiValue: factData.value,
      correctedValue,
      reason,
    },
  });
}

/**
 * Marks a fact as unknown / not found
 */
export async function markFactUnknown(
  applicationId: string,
  factId: string,
  officerUid: string,
  customDb?: Firestore
): Promise<void> {
  if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
    return;
  }

  const db = customDb || getAdminDb();
  const factRef = db.collection(`applications/${applicationId}/extractedFacts`).doc(factId);
  const snap = await factRef.get();

  if (!snap.exists) {
    throw new Error("Fakta perancangan tidak dijumpai.");
  }

  await factRef.update({
    status: "NOT_FOUND",
    confirmedValue: null,
    confirmedBy: officerUid,
    confirmedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "EXTRACTED_FACT_MARKED_UNKNOWN",
    resourceType: "extractedFacts",
    resourceId: factId,
    applicationId,
    actorUid: officerUid,
    actorRole: "OSC_OFFICER",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      factId,
    },
  });
}

/**
 * Evaluates extraction completeness and summary statistics
 */
export async function getLcpExtractionCompleteness(
  applicationId: string,
  customDb?: Firestore
): Promise<{ completeness: ExtractionCompleteness; summary: ExtractionSummary }> {
  const db = customDb || getAdminDb();

  // Get application development type
  const appSnap = await db.collection("applications").doc(applicationId).get();
  const devType = appSnap.data()?.developmentType;
  const requiredKeys = getRequiredFactKeys(devType);

  const facts = await getExtractedFacts(applicationId, undefined, db);

  const activeDocVersion = facts[0]?.documentVersion || 1;
  const activeDocId = facts[0]?.documentId || "";

  const extractedKeys = new Set(facts.filter((f) => f.status !== "NOT_FOUND").map((f) => f.key));
  const confirmedCount = facts.filter((f) => f.status === "MANUALLY_CONFIRMED" || f.status === "MANUALLY_CORRECTED").length;
  const correctedCount = facts.filter((f) => f.status === "MANUALLY_CORRECTED").length;
  const notFoundCount = facts.filter((f) => f.status === "NOT_FOUND").length;

  const highConf = facts.filter((f) => f.confidenceLevel === "HIGH").length;
  const medConf = facts.filter((f) => f.confidenceLevel === "MEDIUM").length;
  const lowConf = facts.filter((f) => f.confidenceLevel === "LOW" && f.status !== "NOT_FOUND").length;

  const conflictFacts = facts.filter((f) => f.status === "CONFLICT");
  const conflicts: FactConflict[] = conflictFacts.map((f) => ({
    key: f.key,
    candidateValues: f.sourceEvidence.map((e) => ({
      value: f.value,
      pageNumber: e.pageNumber,
      quotedText: e.quotedText,
    })),
  }));

  const missing = requiredKeys.filter((k) => !extractedKeys.has(k));

  const completeness: ExtractionCompleteness = {
    documentVersion: activeDocVersion,
    totalRequiredFacts: requiredKeys.length,
    extractedFacts: extractedKeys.size,
    confirmedFacts: confirmedCount,
    missingFacts: missing,
    conflicts,
    lowConfidenceFacts: facts.filter((f) => f.confidenceLevel === "LOW" && f.status !== "NOT_FOUND").map((f) => f.key),
    readyForSmartCheck: missing.length === 0 && conflicts.length === 0,
  };

  const summary: ExtractionSummary = {
    documentVersion: activeDocVersion,
    documentId: activeDocId,
    totalPages: 68,
    totalExtracted: facts.filter((f) => f.status !== "NOT_FOUND").length,
    highConfidenceCount: highConf,
    mediumConfidenceCount: medConf,
    lowConfidenceCount: lowConf,
    conflictCount: conflicts.length,
    notFoundCount,
    confirmedCount,
    correctedCount,
  };

  return { completeness, summary };
}
