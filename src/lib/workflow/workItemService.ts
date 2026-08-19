/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { WorkItem, WorkItemType } from "../../types/workflow.ts";
import type { UserRole } from "../../types/common.ts";

export interface CreateWorkItemParams {
  applicationId: string;
  workType: WorkItemType;
  entityId: string;
  title: string;
  description?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedTo?: string | null;
  assignedRole: UserRole;
  dueAt?: string | null;
}

/**
 * Creates an operational work item in the officer work queue
 */
export async function createWorkItem(
  params: CreateWorkItemParams,
  customDb?: Firestore
): Promise<WorkItem> {
  const db = customDb || getAdminDb();
  const workRef = db.collection("workItems").doc();
  const now = new Date().toISOString();

  const item: WorkItem = {
    workItemId: workRef.id,
    applicationId: params.applicationId,
    workType: params.workType,
    entityId: params.entityId,
    title: params.title,
    description: params.description,
    status: "OPEN",
    priority: params.priority || "NORMAL",
    assignedTo: params.assignedTo || null,
    assignedRole: params.assignedRole,
    dueAt: params.dueAt || null,
    createdAt: now,
    completedAt: null,
  };

  await workRef.set(item);
  return item;
}

/**
 * Assigns or reassigns a work item
 */
export async function assignWorkItem(
  workItemId: string,
  officerUid: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  await db.collection("workItems").doc(workItemId).update({
    assignedTo: officerUid,
    status: "IN_PROGRESS",
  });
}

/**
 * Completes a work item
 */
export async function completeWorkItem(
  workItemId: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  await db.collection("workItems").doc(workItemId).update({
    status: "COMPLETED",
    completedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Fetches the officer work queue items
 */
export async function getOfficerWorkQueue(
  officerUid?: string,
  role?: UserRole,
  customDb?: Firestore
): Promise<WorkItem[]> {
  const db = customDb || getAdminDb();
  let q = db.collection("workItems").where("status", "in", ["OPEN", "IN_PROGRESS"]);

  if (officerUid) {
    q = q.where("assignedTo", "==", officerUid) as any;
  } else if (role) {
    q = q.where("assignedRole", "==", role) as any;
  }

  const snap = await q.get();
  return snap.docs.map((d) => d.data() as WorkItem);
}
