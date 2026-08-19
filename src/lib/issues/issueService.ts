import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import type {
  SmartCheckIssue,
  IssueNote,
  IssueStatus,
  IssueResolutionType,
  ApplicationIssueSummary,
  IssueType,
} from "../../types/issues.ts";
import type { RuleEvaluation } from "../../types/rules.ts";

/**
 * Automatically and idempotently generates issues for NON_COMPLIANT, REQUIRES_REVIEW, and INSUFFICIENT_DATA results
 */
export async function createIssuesFromSmartCheck(
  applicationId: string,
  smartCheckId: string,
  customDb?: Firestore
): Promise<SmartCheckIssue[]> {
  const db = customDb || getAdminDb();
  const createdIssues: SmartCheckIssue[] = [];

  // Fetch results for the SmartCheck run
  const resultsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${smartCheckId}/results`)
    .get();

  if (resultsSnap.empty) return [];

  for (const doc of resultsSnap.docs) {
    const res = doc.data() as RuleEvaluation;

    if (res.status === "COMPLIANT" || res.status === "NOT_APPLICABLE") {
      continue;
    }

    let issueType: IssueType = "NON_COMPLIANCE";
    let title = `Ketidakpatuhan: ${res.ruleName}`;

    if (res.status === "REQUIRES_REVIEW") {
      issueType = "OFFICER_REVIEW";
      title = `Perlu Pengesahan: ${res.ruleName}`;
    } else if (res.status === "INSUFFICIENT_DATA") {
      issueType = "MISSING_INFORMATION";
      title = `Maklumat Tidak Mencukupi: ${res.ruleName}`;
    } else if (res.status === "ERROR") {
      issueType = "PROCESSING_ERROR";
      title = `Ralat Semakan: ${res.ruleName}`;
    }

    // Idempotency check: check if issue already exists for this result
    const existingSnap = await db
      .collection(`applications/${applicationId}/issues`)
      .where("smartCheckId", "==", smartCheckId)
      .where("resultId", "==", res.ruleId)
      .where("issueType", "==", issueType)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      continue;
    }

    const issueId = `iss-${smartCheckId}-${res.ruleId}`;
    const now = new Date().toISOString();

    const issueDoc: SmartCheckIssue = {
      issueId,
      applicationId,
      smartCheckId,
      resultId: res.ruleId,
      ruleId: res.ruleId,
      ruleCode: res.ruleCode,
      category: res.category,
      issueType,
      title,
      description: res.messageText,
      severity: res.severity,
      status: "OPEN",
      source: "AUTO_SMARTCHECK",
      visibility: "INTERNAL", // Initially internal until published by officer
      assignedTo: null,
      assignedRole: "PLANNING_OFFICER",
      createdBy: "SYSTEM",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(`applications/${applicationId}/issues`).doc(issueId).set({
      ...issueDoc,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add initial system note
    await db.collection(`applications/${applicationId}/issues/${issueId}/notes`).add({
      noteId: `note-${Date.now()}-init`,
      issueId,
      authorId: "SYSTEM",
      authorRole: "SYSTEM",
      noteType: "TECHNICAL",
      content: `Isu dijana secara automatik daripada SmartCheck ${smartCheckId}: ${res.messageText}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    createdIssues.push(issueDoc);
  }

  return createdIssues;
}

/**
 * Allows authorized officers to create manual issues
 */
export async function createOfficerIssue(
  applicationId: string,
  payload: Omit<SmartCheckIssue, "issueId" | "applicationId" | "createdAt" | "updatedAt" | "createdBy">,
  officerUid: string,
  officerRole: string,
  customDb?: Firestore
): Promise<SmartCheckIssue> {
  const db = customDb || getAdminDb();
  const issueId = `iss-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const issueDoc: SmartCheckIssue = {
    ...payload,
    issueId,
    applicationId,
    source: "OFFICER_CREATED",
    createdBy: officerUid,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(`applications/${applicationId}/issues`).doc(issueId).set({
    ...issueDoc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "ISSUE_CREATED",
    resourceType: "issues",
    resourceId: issueId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      title: payload.title,
      severity: payload.severity,
    },
  });

  return issueDoc;
}

/**
 * Updates issue workflow status with validation
 */
export async function updateIssueStatus(
  applicationId: string,
  issueId: string,
  newStatus: IssueStatus,
  actorUid: string,
  actorRole: string,
  reason?: string,
  customDb?: Firestore
): Promise<{ success: boolean; previousStatus: IssueStatus; newStatus: IssueStatus }> {
  const db = customDb || getAdminDb();
  const issueRef = db.collection(`applications/${applicationId}/issues`).doc(issueId);
  const snap = await issueRef.get();

  if (!snap.exists) {
    throw new Error("Isu tidak dijumpai.");
  }

  const issue = snap.data() as SmartCheckIssue;
  const previousStatus = issue.status;

  await issueRef.update({
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Record audit log
  await db.collection("auditLogs").add({
    eventType: "ISSUE_STATUS_CHANGED",
    resourceType: "issues",
    resourceId: issueId,
    applicationId,
    actorUid,
    actorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      previousStatus,
      newStatus,
      reason: reason || null,
    },
  });

  return { success: true, previousStatus, newStatus };
}

/**
 * Assigns an issue to a specific officer or role
 */
export async function assignIssue(
  applicationId: string,
  issueId: string,
  assignedTo: string,
  assignedRole: string,
  officerUid: string,
  customDb?: Firestore
): Promise<{ success: boolean }> {
  const db = customDb || getAdminDb();
  const issueRef = db.collection(`applications/${applicationId}/issues`).doc(issueId);

  await issueRef.update({
    assignedTo,
    assignedRole,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "ISSUE_ASSIGNED",
    resourceType: "issues",
    resourceId: issueId,
    applicationId,
    actorUid: officerUid,
    actorRole: "OFFICER",
    timestamp: FieldValue.serverTimestamp(),
    metadata: { assignedTo, assignedRole },
  });

  return { success: true };
}

/**
 * Adds an internal or applicant-visible note to an issue
 */
export async function addIssueNote(
  applicationId: string,
  issueId: string,
  payload: { noteType: "INTERNAL" | "APPLICANT_VISIBLE" | "TECHNICAL" | "RESOLUTION"; content: string },
  authorUid: string,
  authorRole: string,
  customDb?: Firestore
): Promise<IssueNote> {
  const db = customDb || getAdminDb();
  const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const noteDoc: IssueNote = {
    noteId,
    issueId,
    authorId: authorUid,
    authorRole,
    noteType: payload.noteType,
    content: payload.content,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(`applications/${applicationId}/issues/${issueId}/notes`).doc(noteId).set({
    ...noteDoc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return noteDoc;
}

/**
 * Publishes an internal issue to become visible to the applicant
 */
export async function publishIssueToApplicant(
  applicationId: string,
  issueId: string,
  officerUid: string,
  officerRole: string,
  officerCommentDraft?: string,
  customDb?: Firestore
): Promise<{ success: boolean }> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Hanya Pegawai dibenarkan menerbitkan isu kepada pemohon.");
  }

  const issueRef = db.collection(`applications/${applicationId}/issues`).doc(issueId);
  await issueRef.update({
    visibility: "APPLICANT_VISIBLE",
    officerCommentDraft: officerCommentDraft || null,
    publishedBy: officerUid,
    publishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "ISSUE_PUBLISHED_TO_APPLICANT",
    resourceType: "issues",
    resourceId: issueId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true };
}

/**
 * Resolves an issue with formal justification
 */
export async function resolveIssue(
  applicationId: string,
  issueId: string,
  resolutionType: IssueResolutionType,
  resolutionNote: string,
  officerUid: string,
  officerRole: string,
  customDb?: Firestore
): Promise<{ success: boolean }> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Hanya Pegawai dibenarkan menyelesaikan isu.");
  }

  const issueRef = db.collection(`applications/${applicationId}/issues`).doc(issueId);
  await issueRef.update({
    status: "RESOLVED",
    resolutionType,
    resolutionNote,
    resolvedBy: officerUid,
    resolvedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "ISSUE_RESOLVED",
    resourceType: "issues",
    resourceId: issueId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { resolutionType, resolutionNote },
  });

  return { success: true };
}

/**
 * Marks previous SmartCheck issues as SUPERSEDED when a new SmartCheck runs
 */
export async function supersedeIssues(
  applicationId: string,
  oldSmartCheckId: string,
  newSmartCheckId: string,
  customDb?: Firestore
): Promise<{ count: number }> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection(`applications/${applicationId}/issues`)
    .where("smartCheckId", "==", oldSmartCheckId)
    .where("status", "in", ["OPEN", "IN_REVIEW"])
    .get();

  if (snap.empty) return { count: 0 };

  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      status: "SUPERSEDED",
      resolutionType: "SUPERSEDED_BY_NEW_SMARTCHECK",
      resolutionNote: `Digantikan oleh larian SmartCheck baharu: ${newSmartCheckId}`,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return { count: snap.size };
}

/**
 * Gets all application issues (enforcing applicant visibility isolation)
 */
export async function getApplicationIssues(
  applicationId: string,
  userRole: string,
  customDb?: Firestore
): Promise<SmartCheckIssue[]> {
  const db = customDb || getAdminDb();
  const snap = await db.collection(`applications/${applicationId}/issues`).get();

  const allIssues = snap.docs.map((d) => d.data() as SmartCheckIssue);

  // If APPLICANT, return only APPLICANT_VISIBLE issues
  if (userRole === "APPLICANT") {
    return allIssues.filter((i) => i.visibility === "APPLICANT_VISIBLE");
  }

  return allIssues;
}

/**
 * Summarizes open and critical issues for an application
 */
export async function getApplicationIssueSummary(
  applicationId: string,
  customDb?: Firestore
): Promise<ApplicationIssueSummary> {
  const db = customDb || getAdminDb();
  const snap = await db.collection(`applications/${applicationId}/issues`).get();
  const issues = snap.docs.map((d) => d.data() as SmartCheckIssue);

  return {
    totalIssues: issues.length,
    openIssues: issues.filter((i) => i.status === "OPEN").length,
    inReviewIssues: issues.filter((i) => i.status === "IN_REVIEW").length,
    waitingApplicantIssues: issues.filter((i) => i.status === "WAITING_APPLICANT").length,
    resolvedIssues: issues.filter((i) => i.status === "RESOLVED").length,
    criticalIssues: issues.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED" && i.status !== "CLOSED").length,
    majorIssues: issues.filter((i) => i.severity === "MAJOR" && i.status !== "RESOLVED" && i.status !== "CLOSED").length,
  };
}
