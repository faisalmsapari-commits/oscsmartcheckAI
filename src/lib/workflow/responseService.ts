/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  ApplicantResponse,
  ApplicantResponseStatus,
  ResubmissionPackage,
  ResubmissionImpact,
} from "../../types/workflow.ts";
import type { UserRole } from "../../types/common.ts";
import { transitionApplicationStatus } from "./transitionService.ts";
import { createNotification } from "../notifications/notificationService.ts";
import { createWorkItem } from "./workItemService.ts";

export interface SubmitResponseParams {
  applicationId: string;
  requestId: string;
  responseText: string;
  relatedDocumentIds?: string[];
  applicantUid: string;
}

/**
 * Creates draft applicant response
 */
export async function createResponseDraft(
  applicationId: string,
  requestId: string,
  responseText: string,
  applicantUid: string,
  customDb?: Firestore
): Promise<ApplicantResponse> {
  const db = customDb || getAdminDb();
  const respRef = db.collection(`applications/${applicationId}/requests/${requestId}/responses`).doc();
  const now = new Date().toISOString();

  const response: ApplicantResponse = {
    responseId: respRef.id,
    requestId,
    applicationId,
    responseText,
    status: "DRAFT",
    submittedBy: applicantUid,
    createdAt: now,
    updatedAt: now,
  };

  await respRef.set(response);
  return response;
}

/**
 * Submits applicant response and transitions application workflow
 */
export async function submitApplicantResponse(
  params: SubmitResponseParams,
  customDb?: Firestore
): Promise<ApplicantResponse> {
  const { applicationId, requestId, responseText, relatedDocumentIds = [], applicantUid } = params;
  const db = customDb || getAdminDb();

  const reqRef = db.collection(`applications/${applicationId}/requests`).doc(requestId);
  const reqDoc = await reqRef.get();

  if (!reqDoc.exists) {
    throw new Error(`Permintaan maklumat '${requestId}' tidak dijumpai.`);
  }

  const now = new Date().toISOString();
  const respRef = db.collection(`applications/${applicationId}/requests/${requestId}/responses`).doc();

  const response: ApplicantResponse = {
    responseId: respRef.id,
    requestId,
    applicationId,
    responseText,
    status: "SUBMITTED",
    submittedBy: applicantUid,
    submittedAt: now,
    relatedDocumentIds,
    createdAt: now,
    updatedAt: now,
  };

  await respRef.set(response);

  // Update RFI Status to RESPONDED
  await reqRef.update({
    status: "RESPONDED",
    respondedAt: now,
    updatedAt: now,
  });

  // Create Resubmission Package if documents were attached
  if (relatedDocumentIds.length > 0) {
    const pkgRef = db.collection(`applications/${applicationId}/resubmissionPackages`).doc();
    const pkg: ResubmissionPackage = {
      packageId: pkgRef.id,
      applicationId,
      requestId,
      documentIds: relatedDocumentIds,
      responseId: respRef.id,
      submittedBy: applicantUid,
      submittedAt: now,
      status: "SUBMITTED",
    };
    await pkgRef.set(pkg);
  }

  // Transition application workflow status to RESUBMITTED
  const appDoc = await db.collection("applications").doc(applicationId).get();
  const appData = appDoc.data() as any;

  try {
    if (appData && ["REQUEST_INFORMATION", "WAITING_APPLICANT"].includes(appData.status)) {
      await transitionApplicationStatus(
        {
          applicationId,
          targetStatus: "RESUBMITTED",
          remarks: "Maklum balas dan dokumen pinda telah dikemukakan oleh pemohon.",
          actor: { uid: applicantUid, role: "APPLICANT", email: `${applicantUid}@applicant.gov.my` },
        },
        db
      );
    }
  } catch (err) {
    console.warn("Workflow transition during response submission bypassed:", err);
  }

  // Create Officer Work Item
  await createWorkItem(
    {
      applicationId,
      workType: "RFI_RESPONSE_REVIEW",
      entityId: respRef.id,
      title: `Semakan Maklum Balas RFI: Permohonan ${appData?.applicationNo || applicationId}`,
      description: `Pemohon telah mengemukakan maklum balas bagi permintaan maklumat '${reqDoc.data()?.title}'.`,
      priority: "HIGH",
      assignedTo: appData?.assignedOfficerUid || null,
      assignedRole: "OSC_OFFICER",
    },
    db
  );

  // Notify Assigned Officer
  if (appData?.assignedOfficerUid) {
    await createNotification(
      {
        recipientUserId: appData.assignedOfficerUid,
        applicationId,
        notificationType: "APPLICANT_RESPONSE_SUBMITTED",
        channel: "IN_APP",
        title: "Maklum Balas Pemohon Diterima",
        message: `Pemohon bagi permohonan ${appData.applicationNo} telah menghantar maklum balas RFI.`,
        priority: "NORMAL",
        actionUrl: `/applications/${applicationId}/responses`,
        relatedEntityType: "responses",
        relatedEntityId: respRef.id,
      },
      db
    );
  }

  await db.collection("auditLogs").add({
    eventType: "APPLICANT_RESPONSE_SUBMITTED",
    resourceType: "responses",
    resourceId: respRef.id,
    applicationId,
    actorUid: applicantUid,
    actorRole: "APPLICANT",
    timestamp: FieldValue.serverTimestamp(),
  });

  return response;
}

/**
 * Reviews applicant response
 */
export async function reviewApplicantResponse(
  applicationId: string,
  requestId: string,
  responseId: string,
  action: "ACCEPT" | "PARTIAL_ACCEPT" | "REQUIRE_FURTHER",
  reviewComment: string,
  officerUid: string,
  officerRole: UserRole,
  customDb?: Firestore
): Promise<ApplicantResponse> {
  const db = customDb || getAdminDb();
  const respRef = db.collection(`applications/${applicationId}/requests/${requestId}/responses`).doc(responseId);
  const doc = await respRef.get();

  if (!doc.exists) {
    throw new Error(`Maklum balas '${responseId}' tidak dijumpai.`);
  }

  let status: ApplicantResponseStatus = "ACCEPTED";
  let rfiStatus = "SATISFIED";

  if (action === "PARTIAL_ACCEPT") {
    status = "PARTIALLY_ACCEPTED";
    rfiStatus = "PARTIALLY_RESPONDED";
  } else if (action === "REQUIRE_FURTHER") {
    status = "REQUIRES_FURTHER_RESPONSE";
    rfiStatus = "UNDER_REVIEW";
  }

  const now = new Date().toISOString();
  const updateData = {
    status,
    reviewedBy: officerUid,
    reviewedAt: now,
    reviewComment,
    updatedAt: now,
  };

  await respRef.update(updateData);
  await db.collection(`applications/${applicationId}/requests`).doc(requestId).update({
    status: rfiStatus,
    updatedAt: now,
  });

  await db.collection("auditLogs").add({
    eventType: "APPLICANT_RESPONSE_REVIEWED",
    resourceType: "responses",
    resourceId: responseId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { action, reviewComment },
  });

  return { ...(doc.data() as ApplicantResponse), ...updateData };
}

/**
 * Evaluates the impact of a document resubmission
 */
export async function getResubmissionImpact(
  applicationId: string,
  customDb?: Firestore
): Promise<ResubmissionImpact> {
  const db = customDb || getAdminDb();
  const docsSnap = await db.collection(`applications/${applicationId}/documents`).get();

  const newDocs: string[] = [];
  const supersededDocs: string[] = [];

  docsSnap.docs.forEach((d) => {
    const docData = d.data();
    if (docData.status === "ACTIVE" && docData.version > 1) {
      newDocs.push(d.id);
    }
    if (docData.status === "SUPERSEDED") {
      supersededDocs.push(d.id);
    }
  });

  return {
    newDocuments: newDocs,
    supersededDocuments: supersededDocs,
    affectedExtractedFactsCount: newDocs.length > 0 ? 1 : 0,
    affectedSmartChecksCount: newDocs.length > 0 ? 1 : 0,
    affectedIssuesCount: newDocs.length > 0 ? 1 : 0,
    affectedDraftCommentsCount: newDocs.length > 0 ? 1 : 0,
    affectedReportsCount: newDocs.length > 0 ? 1 : 0,
    requiresReprocessing: newDocs.length > 0,
  };
}
