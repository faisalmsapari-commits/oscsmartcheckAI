/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  EscalationRecord,
  EscalationReason,
  EscalationSeverity,
} from "../../types/workflow.ts";
import type { UserRole } from "../../types/common.ts";

export interface CreateEscalationParams {
  applicationId: string;
  entityType: string;
  entityId: string;
  reason: EscalationReason;
  severity: EscalationSeverity;
  title: string;
  description: string;
  assignedTo: string;
  assignedRole: UserRole;
}

/**
 * Creates an operational escalation
 */
export async function createEscalation(
  params: CreateEscalationParams,
  customDb?: Firestore
): Promise<EscalationRecord> {
  const db = customDb || getAdminDb();
  const escRef = db.collection("escalations").doc();
  const now = new Date().toISOString();

  const record: EscalationRecord = {
    escalationId: escRef.id,
    applicationId: params.applicationId,
    entityType: params.entityType,
    entityId: params.entityId,
    reason: params.reason,
    severity: params.severity,
    status: "OPEN",
    title: params.title,
    description: params.description,
    assignedTo: params.assignedTo,
    assignedRole: params.assignedRole,
    createdAt: now,
  };

  await escRef.set(record);
  return record;
}

/**
 * Acknowledges an escalation
 */
export async function acknowledgeEscalation(
  escalationId: string,
  actorUid: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const escRef = db.collection("escalations").doc(escalationId);

  await escRef.update({
    status: "ACKNOWLEDGED",
    acknowledgedAt: FieldValue.serverTimestamp(),
    assignedTo: actorUid,
  });
}

/**
 * Resolves an escalation
 */
export async function resolveEscalation(
  escalationId: string,
  actorUid: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const escRef = db.collection("escalations").doc(escalationId);

  await escRef.update({
    status: "RESOLVED",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy: actorUid,
  });
}

/**
 * Returns list of escalations for management
 */
export async function getManagementEscalations(
  customDb?: Firestore
): Promise<EscalationRecord[]> {
  const db = customDb || getAdminDb();
  const snap = await db.collection("escalations").orderBy("createdAt", "desc").limit(100).get();
  return snap.docs.map((d) => d.data() as EscalationRecord);
}
