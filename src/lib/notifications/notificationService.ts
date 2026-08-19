/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  NotificationRecord,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from "../../types/workflow.ts";

export interface CreateNotificationParams {
  recipientUserId: string;
  applicationId?: string | null;
  notificationType: NotificationType;
  channel?: NotificationChannel;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  deduplicationKey?: string;
}

/**
 * Creates and delivers an in-app/system notification with deduplication safeguard
 */
export async function createNotification(
  params: CreateNotificationParams,
  customDb?: Firestore
): Promise<NotificationRecord | null> {
  const db = customDb || getAdminDb();

  // Deduplication check
  if (params.deduplicationKey) {
    const existing = await db
      .collection("notifications")
      .where("deduplicationKey", "==", params.deduplicationKey)
      .limit(1)
      .get();
    if (!existing.empty) {
      return existing.docs[0].data() as NotificationRecord;
    }
  }

  const notifRef = db.collection("notifications").doc();
  const now = new Date().toISOString();

  const record: NotificationRecord = {
    notificationId: notifRef.id,
    recipientUserId: params.recipientUserId,
    applicationId: params.applicationId || null,
    notificationType: params.notificationType,
    channel: params.channel || "IN_APP",
    title: params.title,
    message: params.message,
    status: "SENT",
    priority: params.priority || "NORMAL",
    actionUrl: params.actionUrl || null,
    relatedEntityType: params.relatedEntityType || null,
    relatedEntityId: params.relatedEntityId || null,
    deduplicationKey: params.deduplicationKey,
    createdAt: now,
    sentAt: now,
    readAt: null,
    retryCount: 0,
  };

  await notifRef.set(record);
  return record;
}

/**
 * Marks a notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const notifRef = db.collection("notifications").doc(notificationId);
  const doc = await notifRef.get();

  if (doc.exists) {
    const data = doc.data() as NotificationRecord;
    if (data.recipientUserId === userId) {
      await notifRef.update({
        status: "READ",
        readAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

/**
 * Marks all unread notifications for a user as read
 */
export async function markAllNotificationsRead(
  userId: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const snap = await db
    .collection("notifications")
    .where("recipientUserId", "==", userId)
    .where("status", "==", "SENT")
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "READ",
      readAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Returns notifications for a user
 */
export async function getNotifications(
  userId: string,
  unreadOnly = false,
  customDb?: Firestore
): Promise<NotificationRecord[]> {
  const db = customDb || getAdminDb();
  let q = db.collection("notifications").where("recipientUserId", "==", userId);

  if (unreadOnly) {
    q = q.where("status", "==", "SENT") as any;
  }

  const snap = await q.get();
  return snap.docs
    .map((d) => d.data() as NotificationRecord)
    .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
}
