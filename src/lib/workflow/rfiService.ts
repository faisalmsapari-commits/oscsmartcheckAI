/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { RequestForInformation, RfiRequestType, RfiVisibility } from "../../types/workflow.ts";
import type { UserRole } from "../../types/common.ts";
import { transitionApplicationStatus } from "./transitionService.ts";
import { createNotification } from "../notifications/notificationService.ts";

export interface CreateRfiParams {
  applicationId: string;
  requestType: RfiRequestType;
  title: string;
  description: string;
  relatedIssueIds?: string[];
  relatedResultIds?: string[];
  requiredDocumentTypes?: string[];
  requestedFields?: string[];
  responseDeadline?: string | null;
  visibility?: RfiVisibility;
  actorUid: string;
  actorRole: UserRole;
}

/**
 * Creates a new Request for Information (RFI)
 */
export async function createInformationRequest(
  params: CreateRfiParams,
  customDb?: Firestore
): Promise<RequestForInformation> {
  const db = customDb || getAdminDb();
  const reqRef = db.collection(`applications/${params.applicationId}/requests`).doc();
  const now = new Date().toISOString();

  const rfi: RequestForInformation = {
    requestId: reqRef.id,
    applicationId: params.applicationId,
    requestType: params.requestType,
    title: params.title,
    description: params.description,
    status: "DRAFT",
    visibility: params.visibility || "INTERNAL",
    relatedIssueIds: params.relatedIssueIds || [],
    relatedResultIds: params.relatedResultIds || [],
    requiredDocumentTypes: params.requiredDocumentTypes || [],
    requestedFields: params.requestedFields || [],
    responseDeadline: params.responseDeadline || null,
    createdAt: now,
    updatedAt: now,
  };

  await reqRef.set(rfi);

  await db.collection("auditLogs").add({
    eventType: "RFI_CREATED",
    resourceType: "requests",
    resourceId: reqRef.id,
    applicationId: params.applicationId,
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    timestamp: FieldValue.serverTimestamp(),
  });

  return rfi;
}

/**
 * Creates draft RFI pre-filled from an existing SmartCheck issue
 */
export async function createInformationRequestFromIssue(
  applicationId: string,
  issueId: string,
  actorUid: string,
  actorRole: UserRole,
  customDb?: Firestore
): Promise<RequestForInformation> {
  const db = customDb || getAdminDb();
  const issDoc = await db.collection(`applications/${applicationId}/issues`).doc(issueId).get();

  if (!issDoc.exists) {
    throw new Error(`Isu '${issueId}' tidak dijumpai.`);
  }

  const issue = issDoc.data() as any;

  return await createInformationRequest(
    {
      applicationId,
      requestType: "PLAN_AMENDMENT",
      title: `Pindaan / Penjelasan: ${issue.title}`,
      description: `Berdasarkan pra-semakan SmartCheck, perkara berikut memerlukan tindakan: ${issue.description || issue.title}. Sila kemukakan dokumen atau pelan pinda berkaitan.`,
      relatedIssueIds: [issueId],
      requiredDocumentTypes: ["LCP_REPORT", "SUBMISSION_FORM"],
      actorUid,
      actorRole,
      visibility: "INTERNAL",
    },
    db
  );
}

/**
 * Issues and publishes an RFI to the applicant
 */
export async function issueInformationRequest(
  applicationId: string,
  requestId: string,
  actorUid: string,
  actorRole: UserRole,
  customDb?: Firestore
): Promise<RequestForInformation> {
  const db = customDb || getAdminDb();
  const reqRef = db.collection(`applications/${applicationId}/requests`).doc(requestId);
  const doc = await reqRef.get();

  if (!doc.exists) {
    throw new Error(`Permintaan maklumat '${requestId}' tidak dijumpai.`);
  }

  const now = new Date().toISOString();
  const updateData = {
    status: "ISSUED",
    visibility: "APPLICANT_VISIBLE",
    issuedBy: actorUid,
    issuedAt: now,
    updatedAt: now,
  };

  await reqRef.update(updateData);

  // Fetch application to notify applicant
  const appDoc = await db.collection("applications").doc(applicationId).get();
  const appData = appDoc.data() as any;
  const applicantUid = appData?.applicantUid;

  // Transition application workflow status to WAITING_APPLICANT / REQUEST_INFORMATION if permitted
  try {
    if (appData && ["OFFICER_REVIEW", "DOCUMENT_CHECK"].includes(appData.status)) {
      await transitionApplicationStatus(
        {
          applicationId,
          targetStatus: "REQUEST_INFORMATION",
          remarks: "Permintaan Maklumat (RFI) rasmi telah diterbitkan kepada pemohon.",
          actor: { uid: actorUid, role: actorRole, email: `${actorUid}@mplbp.gov.my` },
        },
        db
      );
    }
  } catch (err) {
    console.warn("Workflow transition during RFI issue bypassed:", err);
  }

  // Create Notification
  if (applicantUid) {
    await createNotification(
      {
        recipientUserId: applicantUid,
        applicationId,
        notificationType: "RFI_ISSUED",
        channel: "IN_APP",
        title: "Tindakan Diperlukan: Permintaan Maklumat OSC",
        message: `Pegawai OSC telah mengeluarkan permintaan maklumat bagi permohonan ${appData?.applicationNo || applicationId}.`,
        priority: "HIGH",
        actionUrl: `/applications/${applicationId}/requests/${requestId}`,
        relatedEntityType: "requests",
        relatedEntityId: requestId,
      },
      db
    );
  }

  return {
    ...(doc.data() as RequestForInformation),
    status: "ISSUED" as const,
    visibility: "APPLICANT_VISIBLE" as const,
    issuedBy: actorUid,
    issuedAt: now,
    updatedAt: now,
  };
}

/**
 * Extends RFI response deadline
 */
export async function extendRfiDeadline(
  applicationId: string,
  requestId: string,
  newDeadline: string,
  reason: string,
  actorUid: string,
  actorRole: UserRole,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const reqRef = db.collection(`applications/${applicationId}/requests`).doc(requestId);
  const doc = await reqRef.get();

  if (!doc.exists) {
    throw new Error(`RFI '${requestId}' tidak wujud.`);
  }

  const existing = doc.data() as RequestForInformation;
  const now = new Date().toISOString();

  const historyEntry = {
    previousDeadline: existing.responseDeadline || "TIADA",
    newDeadline,
    changedBy: actorUid,
    changedAt: now,
    reason,
  };

  const previousDeadlines = [...(existing.previousDeadlines || []), historyEntry];

  await reqRef.update({
    responseDeadline: newDeadline,
    updatedAt: now,
    previousDeadlines,
  });

  await db.collection("auditLogs").add({
    eventType: "RFI_DEADLINE_EXTENDED",
    resourceType: "requests",
    resourceId: requestId,
    applicationId,
    actorUid,
    actorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: historyEntry,
  });
}

/**
 * Marks RFI as viewed by the applicant
 */
export async function markRfiViewedByApplicant(
  applicationId: string,
  requestId: string,
  applicantUid: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const reqRef = db.collection(`applications/${applicationId}/requests`).doc(requestId);
  const doc = await reqRef.get();

  if (doc.exists) {
    const data = doc.data() as RequestForInformation;
    if (!data.viewedByApplicantAt && data.status === "ISSUED") {
      await reqRef.update({
        viewedByApplicantAt: new Date().toISOString(),
        status: "VIEWED",
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Returns list of requests for an application
 */
export async function getApplicantRequests(
  applicationId: string,
  userRole: UserRole,
  customDb?: Firestore
): Promise<RequestForInformation[]> {
  const db = customDb || getAdminDb();
  let q = db.collection(`applications/${applicationId}/requests`);

  if (userRole === "APPLICANT") {
    q = q.where("visibility", "==", "APPLICANT_VISIBLE") as any;
  }

  const snap = await q.get();
  return snap.docs.map((d) => d.data() as RequestForInformation);
}
