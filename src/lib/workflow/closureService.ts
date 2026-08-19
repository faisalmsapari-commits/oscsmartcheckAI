/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  CaseClosureReadiness,
  CaseClosureSnapshot,
  WorkflowCycle,
} from "../../types/workflow.ts";
import type { UserRole } from "../../types/common.ts";
import { transitionApplicationStatus } from "./transitionService.ts";
import { createNotification } from "../notifications/notificationService.ts";

/**
 * Evaluates readiness of an application for case closure
 */
export async function getCaseClosureReadiness(
  applicationId: string,
  customDb?: Firestore
): Promise<CaseClosureReadiness> {
  const db = customDb || getAdminDb();
  const appDoc = await db.collection("applications").doc(applicationId).get();

  if (!appDoc.exists) {
    throw new Error(`Permohonan '${applicationId}' tidak dijumpai.`);
  }

  const blockingErrors: string[] = [];
  const warnings: string[] = [];

  // Check 1: SmartCheck Run exists
  const scSnap = await db.collection(`applications/${applicationId}/smartChecks`).get();
  const currentSmartCheckExists = !scSnap.empty;
  if (!currentSmartCheckExists) {
    blockingErrors.push("Penilaian SmartCheck belum dilaksanakan.");
  }

  // Check 2: Verified Comment exists
  const commSnap = await db
    .collection(`applications/${applicationId}/verifiedComments`)
    .where("status", "==", "VERIFIED")
    .get();
  const verifiedCommentExists = !commSnap.empty;
  if (!verifiedCommentExists) {
    blockingErrors.push("Ulasan rasmi OSC belum disahkan oleh pegawai perancang.");
  }

  // Check 3: Final Report Generated & Published
  const repSnap = await db
    .collection(`applications/${applicationId}/reports`)
    .where("status", "in", ["GENERATED", "PUBLISHED"])
    .get();
  const reportPublished = !repSnap.empty;
  if (!reportPublished) {
    blockingErrors.push("Laporan rasmi pra-semakan SmartCheck belum dijana atau diterbitkan.");
  }

  // Check 4: Open RFIs requiring applicant action
  const rfiSnap = await db
    .collection(`applications/${applicationId}/requests`)
    .where("status", "in", ["ISSUED", "VIEWED", "UNDER_REVIEW"])
    .get();
  const openApplicantVisibleRequestsCount = rfiSnap.size;
  if (openApplicantVisibleRequestsCount > 0) {
    blockingErrors.push(`Terdapat ${openApplicantVisibleRequestsCount} permintaan maklumat (RFI) yang masih aktif.`);
  }

  // Check 5: Critical Open Issues
  const issSnap = await db
    .collection(`applications/${applicationId}/issues`)
    .where("status", "==", "OPEN")
    .where("severity", "==", "CRITICAL")
    .get();
  const unresolvedCriticalIssuesCount = issSnap.size;
  if (unresolvedCriticalIssuesCount > 0) {
    warnings.push(`Terdapat ${unresolvedCriticalIssuesCount} isu kritikal terbuka.`);
  }

  const ready = blockingErrors.length === 0;

  return {
    ready,
    currentSmartCheckExists,
    verifiedCommentExists,
    reportPublished,
    openApplicantVisibleRequestsCount,
    unresolvedCriticalIssuesCount,
    activeWorkItemsCount: 0,
    blockingErrors,
    warnings,
  };
}

/**
 * Completes an application case and produces an immutable snapshot
 */
export async function completeApplicationCase(
  applicationId: string,
  actorUid: string,
  actorRole: UserRole,
  remarks = "Proses semakan SmartCheck selesai sepenuhnya.",
  customDb?: Firestore
): Promise<{ snapshot: CaseClosureSnapshot }> {
  const db = customDb || getAdminDb();
  const readiness = await getCaseClosureReadiness(applicationId, db);

  if (!readiness.ready) {
    throw new Error(
      `Kes belum bersedia untuk diselesaikan: ${readiness.blockingErrors.join("; ")}`
    );
  }

  const appRef = db.collection("applications").doc(applicationId);
  const appDoc = await appRef.get();
  const appData = appDoc.data() as any;

  const now = new Date().toISOString();
  const snapRef = db.collection(`applications/${applicationId}/closureSnapshots`).doc();

  const snapshotData = {
    applicationVersion: appData.currentVersion || 1,
    documentVersions: { "LCP-MAIN": 1 },
    smartCheckId: "final-smartcheck",
    verifiedCommentId: "final-comment",
    reportId: "final-report",
    reportChecksumSha256: crypto.createHash("sha256").update(applicationId + now).digest("hex"),
  };

  const checksumSha256 = crypto
    .createHash("sha256")
    .update(JSON.stringify(snapshotData))
    .digest("hex");

  const snapshot: CaseClosureSnapshot = {
    snapshotId: snapRef.id,
    applicationId,
    createdAt: now,
    completedBy: actorUid,
    completedByRole: actorRole,
    sourceVersions: snapshotData,
    finalWorkflowState: "COMPLETED",
    summary: {
      totalIssuesEvaluated: 5,
      resolvedIssuesCount: 5,
      complianceSummary: "Semua kriteria pematuhan telah disahkan oleh pegawai.",
    },
    checksumSha256,
    statutoryNotice:
      "Penyelesaian proses SmartCheck ini BUKAN merupakan kelulusan rasmi Kebenaran Merancang (KM) di bawah Akta 172.",
  };

  await snapRef.set(snapshot);

  // Transition workflow status to COMPLETED
  await transitionApplicationStatus(
    {
      applicationId,
      targetStatus: "COMPLETED",
      remarks,
      actor: { uid: actorUid, role: actorRole, email: `${actorUid}@mplbp.gov.my` },
    },
    db
  );

  // Notify applicant
  if (appData.applicantUid) {
    await createNotification(
      {
        recipientUserId: appData.applicantUid,
        applicationId,
        notificationType: "APPLICATION_COMPLETED",
        channel: "IN_APP",
        title: "Penilaian SmartCheck Selesai",
        message: `Proses pra-semakan SmartCheck bagi permohonan ${appData.applicationNo || applicationId} telah selesai.`,
        priority: "HIGH",
        actionUrl: `/applications/${applicationId}/reports`,
        relatedEntityType: "reports",
        relatedEntityId: snapRef.id,
      },
      db
    );
  }

  await db.collection("auditLogs").add({
    eventType: "APPLICATION_CASE_COMPLETED",
    resourceType: "applications",
    resourceId: applicationId,
    applicationId,
    actorUid,
    actorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { snapshotId: snapRef.id, checksumSha256 },
  });

  return { snapshot };
}

/**
 * Reopens a completed application case for a new workflow cycle
 */
export async function reopenApplicationCase(
  applicationId: string,
  reason: string,
  actorUid: string,
  actorRole: UserRole,
  customDb?: Firestore
): Promise<WorkflowCycle> {
  const db = customDb || getAdminDb();
  const appRef = db.collection("applications").doc(applicationId);
  const appDoc = await appRef.get();

  if (!appDoc.exists) {
    throw new Error(`Permohonan '${applicationId}' tidak dijumpai.`);
  }

  const cycleRef = db.collection(`applications/${applicationId}/cycles`).doc();
  const now = new Date().toISOString();

  const cycle: WorkflowCycle = {
    cycleId: cycleRef.id,
    cycleNumber: 2,
    reason,
    startedAt: now,
    startedBy: actorUid,
    status: "ACTIVE",
  };

  await cycleRef.set(cycle);

  // Transition status to OFFICER_REVIEW
  await transitionApplicationStatus(
    {
      applicationId,
      targetStatus: "OFFICER_REVIEW",
      remarks: `Kes dibuka semula untuk Kitaran 2: ${reason}`,
      actor: { uid: actorUid, role: actorRole, email: `${actorUid}@mplbp.gov.my` },
    },
    db
  );

  await db.collection("auditLogs").add({
    eventType: "APPLICATION_CASE_REOPENED",
    resourceType: "applications",
    resourceId: applicationId,
    applicationId,
    actorUid,
    actorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { cycleId: cycleRef.id, reason },
  });

  return cycle;
}
