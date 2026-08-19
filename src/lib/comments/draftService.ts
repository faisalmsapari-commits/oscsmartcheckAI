import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import type {
  CommentDraft,
  CommentReadinessResult,
  DraftFreshnessResult,
  CommentDiffResult,
  DraftStyle,
} from "../../types/comments.ts";
import type { SmartCheckRecord } from "../../types/rules.ts";
import { buildPlanningCommentContext, computeSourceFingerprint } from "./contextBuilder.ts";
import { generateOscDraftComment, formatDraftToMarkdown } from "../ai/flows/commentFlows.ts";
import { getOfficerReviewCompleteness } from "../issues/dashboardService.ts";

export const PROHIBITED_PHRASES = [
  "permohonan diluluskan",
  "permohonan adalah diluluskan",
  "km diluluskan",
  "kebenaran merancang diluluskan",
  "permohonan ditolak",
  "permohonan adalah ditolak",
  "tolak muktamad",
  "kelulusan statutori muktamad",
];

/**
 * Validates whether an application is ready for full AI draft comment generation
 */
export async function getCommentDraftReadiness(
  applicationId: string,
  customDb?: Firestore
): Promise<CommentReadinessResult> {
  const db = customDb || getAdminDb();

  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (scSnap.empty) {
    return {
      ready: false,
      smartCheckReady: false,
      officerReviewReady: false,
      sourceReady: false,
      unresolvedCriticalErrors: ["Tiada larian SmartCheck dijumpai."],
      warnings: [],
      blockingIssues: ["Sila jalankan pra-semakan SmartCheck terlebih dahulu."],
    };
  }

  const smartCheck = scSnap.docs[0].data() as SmartCheckRecord;
  const reviewCompleteness = await getOfficerReviewCompleteness(applicationId, smartCheck.smartCheckId, db);

  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (reviewCompleteness.criticalOpenIssues > 0) {
    blockingIssues.push(`Terdapat ${reviewCompleteness.criticalOpenIssues} isu berkeutamaan kritikal yang belum disemak.`);
  }

  if (reviewCompleteness.completenessPercent < 50) {
    warnings.push(`Tahap semakan pegawai masih rendah (${reviewCompleteness.completenessPercent}%). Draf ulasan mungkin belum lengkap.`);
  }

  const ready = blockingIssues.length === 0;

  return {
    ready,
    smartCheckReady: true,
    officerReviewReady: reviewCompleteness.criticalOpenIssues === 0,
    sourceReady: true,
    unresolvedCriticalErrors: [],
    warnings,
    blockingIssues,
  };
}

/**
 * Creates an AI-generated structured comment draft (labeled AI_DRAFT)
 */
export async function createAiDraft(
  applicationId: string,
  smartCheckId: string,
  style: DraftStyle = "STANDARD",
  authorUid: string,
  authorRole: string,
  customDb?: Firestore
): Promise<CommentDraft> {
  const db = customDb || getAdminDb();

  const context = await buildPlanningCommentContext(applicationId, smartCheckId, db);
  const fingerprint = computeSourceFingerprint(context);

  // Check for existing drafts to calculate version
  const draftsSnap = await db
    .collection(`applications/${applicationId}/commentDrafts`)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const nextVersion = draftsSnap.empty ? 1 : (draftsSnap.docs[0].data().version || 1) + 1;
  const draftId = `draft-${Date.now()}-v${nextVersion}`;

  // Generate structured output
  const structured = await generateOscDraftComment(context, style);
  const formattedMarkdown = formatDraftToMarkdown(structured);
  const now = new Date().toISOString();

  const draftDoc: CommentDraft = {
    draftId,
    applicationId,
    smartCheckId,
    draftType: "OSC_FULL_DRAFT",
    draftStyle: style,
    status: "AI_DRAFT",
    version: nextVersion,
    revisionNumber: 1,
    sourceFingerprint: fingerprint,
    sourceVersions: {
      lcpVersion: context.sourceVersions.lcpVersion,
      siteVersion: context.sourceVersions.siteVersion,
      smartCheckId,
      engineVersion: context.sourceVersions.ruleEngineVersion,
      promptVersion: context.sourceVersions.promptVersion,
    },
    aiModel: "gemini-1.5-flash",
    promptVersion: context.sourceVersions.promptVersion,
    generatedSections: structured,
    aiGeneratedText: formattedMarkdown,
    officerEditedText: formattedMarkdown, // Initially identical to AI text
    createdBy: authorUid,
    createdAt: now,
    updatedAt: now,
    lastEditedBy: authorUid,
  };

  await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).set({
    ...draftDoc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Record AI Run
  await db.collection("aiRuns").add({
    flowName: "generateOscDraftComment",
    applicationId,
    smartCheckId,
    draftId,
    model: "gemini-1.5-flash",
    promptVersion: context.sourceVersions.promptVersion,
    sourceFingerprint: fingerprint,
    status: "SUCCESS",
    startedAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "AI_DRAFT_GENERATED",
    resourceType: "commentDrafts",
    resourceId: draftId,
    applicationId,
    actorUid: authorUid,
    actorRole: authorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { version: nextVersion, fingerprint },
  });

  return draftDoc;
}

/**
 * Creates a manual fallback draft without calling Gemini
 */
export async function createManualDraft(
  applicationId: string,
  initialText: string,
  authorUid: string,
  authorRole: string,
  customDb?: Firestore
): Promise<CommentDraft> {
  const db = customDb || getAdminDb();

  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const smartCheckId = scSnap.empty ? "manual" : scSnap.docs[0].data().smartCheckId;

  const draftsSnap = await db
    .collection(`applications/${applicationId}/commentDrafts`)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const nextVersion = draftsSnap.empty ? 1 : (draftsSnap.docs[0].data().version || 1) + 1;
  const draftId = `draft-manual-${Date.now()}-v${nextVersion}`;
  const now = new Date().toISOString();

  const emptyStructured = {
    executiveSummary: initialText.slice(0, 100) || "Draf ulasan manual",
    planningContext: "Disediakan secara manual oleh pegawai.",
    categoryComments: [],
    issuesRequiringAction: [],
    officerJudgementItems: [],
    recommendedApplicantActions: [],
    conclusionDraft: "Ulasan manual.",
    sourceReferences: [],
    warnings: [],
  };

  const draftDoc: CommentDraft = {
    draftId,
    applicationId,
    smartCheckId,
    draftType: "OSC_FULL_DRAFT",
    draftStyle: "STANDARD",
    status: "OFFICER_EDITING",
    version: nextVersion,
    revisionNumber: 1,
    sourceFingerprint: `manual-${Date.now()}`,
    sourceVersions: {
      lcpVersion: 1,
      siteVersion: 1,
      smartCheckId,
      engineVersion: "1.0.0",
      promptVersion: "manual",
    },
    aiModel: "MANUAL",
    promptVersion: "manual",
    generatedSections: emptyStructured,
    aiGeneratedText: initialText,
    officerEditedText: initialText,
    createdBy: authorUid,
    createdAt: now,
    updatedAt: now,
    lastEditedBy: authorUid,
  };

  await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).set({
    ...draftDoc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return draftDoc;
}

/**
 * Saves officer edits to draft with optimistic concurrency control
 */
export async function saveOfficerDraftEdit(
  applicationId: string,
  draftId: string,
  officerEditedText: string,
  editorUid: string,
  editorRole: string,
  expectedRevisionNumber?: number,
  customDb?: Firestore
): Promise<{ success: boolean; newRevisionNumber: number }> {
  const db = customDb || getAdminDb();
  const draftRef = db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId);
  const snap = await draftRef.get();

  if (!snap.exists) {
    throw new Error("Draf ulasan tidak dijumpai.");
  }

  const current = snap.data() as CommentDraft;

  if (expectedRevisionNumber !== undefined && current.revisionNumber !== expectedRevisionNumber) {
    throw new Error("Draf telah dikemas kini oleh pengguna lain. Sila muat semula.");
  }

  const newRev = (current.revisionNumber || 1) + 1;

  await draftRef.update({
    officerEditedText,
    status: "OFFICER_EDITING",
    revisionNumber: newRev,
    lastEditedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "OFFICER_DRAFT_UPDATED",
    resourceType: "commentDrafts",
    resourceId: draftId,
    applicationId,
    actorUid: editorUid,
    actorRole: editorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { revisionNumber: newRev },
  });

  return { success: true, newRevisionNumber: newRev };
}

/**
 * Evaluates draft freshness against current live SmartCheck context
 */
export async function getDraftFreshness(
  applicationId: string,
  draftId: string,
  customDb?: Firestore
): Promise<DraftFreshnessResult> {
  const db = customDb || getAdminDb();
  const draftSnap = await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).get();

  if (!draftSnap.exists) {
    return {
      freshness: "CURRENT",
      isStale: false,
      message: "Draf tidak dijumpai.",
      reasons: [],
      currentFingerprint: "",
      draftFingerprint: "",
    };
  }

  const draft = draftSnap.data() as CommentDraft;
  const currentContext = await buildPlanningCommentContext(applicationId, draft.smartCheckId, db);
  const currentFingerprint = computeSourceFingerprint(currentContext);

  const isStale = draft.sourceFingerprint !== currentFingerprint;
  const reasons: string[] = [];

  if (isStale) {
    reasons.push("Terdapat perubahan pada data semakan, isu, atau penilaian pegawai selepas draf ini dijana.");
  }

  return {
    freshness: isStale ? "STALE_SMARTCHECK_CHANGED" : "CURRENT",
    isStale,
    message: isStale ? "Draf ini tidak lagi berasaskan data terkini." : "Draf adalah terkini.",
    reasons,
    currentFingerprint,
    draftFingerprint: draft.sourceFingerprint,
  };
}

/**
 * Deterministic quality and prohibited wording check before verification
 */
export function validateCommentForVerification(
  text: string,
  draft?: CommentDraft
): { isValid: boolean; errors: string[]; warnings: string[] } {
  void draft;
  const errors: string[] = [];
  const warnings: string[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of PROHIBITED_PHRASES) {
    if (lowerText.includes(phrase)) {
      errors.push(`Mengandungi perkataan/frasa statutori yang tidak dibenarkan: "${phrase}".`);
    }
  }

  if (text.length < 20) {
    errors.push("Kandungan ulasan terlalu pendek (minimum 20 aksara).");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates diff between original AI text and final officer text
 */
export function getCommentDiff(draft: CommentDraft): CommentDiffResult {
  const aiLines = (draft.aiGeneratedText || "").split("\n");
  const officerLines = (draft.officerEditedText || draft.aiGeneratedText || "").split("\n");

  const addedLines = officerLines.filter((l) => !aiLines.includes(l));
  const removedLines = aiLines.filter((l) => !officerLines.includes(l));
  const hasChanges = addedLines.length > 0 || removedLines.length > 0;

  return {
    draftId: draft.draftId,
    aiGeneratedText: draft.aiGeneratedText,
    officerEditedText: draft.officerEditedText || draft.aiGeneratedText,
    hasChanges,
    addedLines,
    removedLines,
  };
}
