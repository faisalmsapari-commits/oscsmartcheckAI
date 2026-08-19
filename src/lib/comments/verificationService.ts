import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import type { VerifiedComment, CommentDraft } from "../../types/comments.ts";
import { validateCommentForVerification, getDraftFreshness } from "./draftService.ts";

/**
 * Creates an immutable verified comment snapshot after explicit officer confirmation
 */
export async function verifyOscComment(
  applicationId: string,
  draftId: string,
  finalText: string,
  officerUid: string,
  officerRole: string,
  customDb?: Firestore
): Promise<VerifiedComment> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Hanya Pegawai Perancang / Pegawai OSC dibenarkan mengesahkan ulasan.");
  }

  // 1. Fetch Draft
  const draftSnap = await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).get();
  if (!draftSnap.exists) {
    throw new Error("Draf ulasan tidak dijumpai.");
  }
  const draft = draftSnap.data() as CommentDraft;

  // 2. Deterministic Quality & Prohibited Word Validation
  const validation = validateCommentForVerification(finalText, draft);
  if (!validation.isValid) {
    throw new Error(`Pengesahan gagal: ${validation.errors.join("; ")}`);
  }

  // 3. Stale Check
  const freshness = await getDraftFreshness(applicationId, draftId, db);
  if (freshness.isStale) {
    throw new Error("Draf ulasan tidak terkini. Sila jana semula draf sebelum membuat pengesahan.");
  }

  // 4. Calculate Version & Checksum
  const existingVerifiedSnap = await db
    .collection(`applications/${applicationId}/verifiedComments`)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const nextVersion = existingVerifiedSnap.empty ? 1 : (existingVerifiedSnap.docs[0].data().version || 1) + 1;
  const commentId = `comm-verified-${Date.now()}-v${nextVersion}`;
  const checksum = crypto.createHash("sha256").update(finalText).digest("hex");
  const now = new Date().toISOString();

  const verifiedDoc: VerifiedComment = {
    commentId,
    applicationId,
    smartCheckId: draft.smartCheckId,
    draftId,
    version: nextVersion,
    status: "VERIFIED",
    visibility: "INTERNAL", // Initially internal until explicitly published
    finalText,
    structuredSections: draft.generatedSections,
    sourceSnapshot: {
      lcpVersion: draft.sourceVersions.lcpVersion,
      siteVersion: draft.sourceVersions.siteVersion,
      smartCheckId: draft.smartCheckId,
      ruleSetVersions: ["RS-MPLBP-2026-V1"],
      gisDatasetVersions: ["RTD-2030-v1"],
      engineVersion: draft.sourceVersions.engineVersion,
      promptVersion: draft.promptVersion,
      sourceFingerprint: draft.sourceFingerprint,
    },
    checksum,
    verifiedBy: officerUid,
    verifiedAt: now,
    createdAt: now,
  };

  // Write immutable snapshot
  await db.collection(`applications/${applicationId}/verifiedComments`).doc(commentId).set({
    ...verifiedDoc,
    verifiedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update Draft status to VERIFIED
  await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).update({
    status: "VERIFIED",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // If there was a previous verified comment, mark it SUPERSEDED
  if (!existingVerifiedSnap.empty) {
    const prevDoc = existingVerifiedSnap.docs[0];
    await prevDoc.ref.update({
      status: "SUPERSEDED",
      supersededByCommentId: commentId,
    });
  }

  // Record audit log
  await db.collection("auditLogs").add({
    eventType: "COMMENT_VERIFIED",
    resourceType: "verifiedComments",
    resourceId: commentId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { version: nextVersion, checksum },
  });

  return verifiedDoc;
}

/**
 * Publishes a verified comment to become visible to the applicant
 */
export async function publishVerifiedComment(
  applicationId: string,
  commentId: string,
  officerUid: string,
  officerRole: string,
  publicationNote?: string,
  customDb?: Firestore
): Promise<{ success: boolean }> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Hanya Pegawai dibenarkan menerbitkan ulasan kepada pemohon.");
  }

  const commentRef = db.collection(`applications/${applicationId}/verifiedComments`).doc(commentId);
  const snap = await commentRef.get();

  if (!snap.exists) {
    throw new Error("Ulasan yang disahkan tidak dijumpai.");
  }

  await commentRef.update({
    visibility: "APPLICANT_VISIBLE",
    publishedBy: officerUid,
    publishedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "COMMENT_PUBLISHED",
    resourceType: "verifiedComments",
    resourceId: commentId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { publicationNote: publicationNote || null },
  });

  return { success: true };
}

/**
 * Revokes a verified comment with mandatory reason
 */
export async function revokeVerifiedComment(
  applicationId: string,
  commentId: string,
  reason: string,
  officerUid: string,
  officerRole: string,
  customDb?: Firestore
): Promise<{ success: boolean }> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Hanya Pegawai dibenarkan membatalkan ulasan.");
  }

  const commentRef = db.collection(`applications/${applicationId}/verifiedComments`).doc(commentId);
  await commentRef.update({
    status: "REVOKED",
    visibility: "INTERNAL",
    revocationReason: reason,
    revokedBy: officerUid,
    revokedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "COMMENT_REVOKED",
    resourceType: "verifiedComments",
    resourceId: commentId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { reason },
  });

  return { success: true };
}

/**
 * Gets all applicant-visible published comments for an application
 */
export async function getPublishedComments(
  applicationId: string,
  customDb?: Firestore
): Promise<VerifiedComment[]> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection(`applications/${applicationId}/verifiedComments`)
    .where("visibility", "==", "APPLICANT_VISIBLE")
    .where("status", "==", "VERIFIED")
    .get();

  return snap.docs.map((d) => d.data() as VerifiedComment);
}
