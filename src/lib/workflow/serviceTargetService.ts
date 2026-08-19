/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  ServiceTimer,
  ServiceDurationUnit,
} from "../../types/workflow.ts";
import { createEscalation } from "./escalationService.ts";

/**
 * Calculates due date taking business days/hours into account
 */
export function calculateBusinessDueTime(
  startDate: Date,
  duration: number,
  unit: ServiceDurationUnit
): Date {
  const result = new Date(startDate.getTime());

  if (unit === "HOURS") {
    result.setHours(result.getHours() + duration);
    return result;
  }

  if (unit === "DAYS") {
    result.setDate(result.getDate() + duration);
    return result;
  }

  // Business Days calculation (Monday - Friday)
  if (unit === "BUSINESS_DAYS" || unit === "BUSINESS_HOURS") {
    const daysToAdd = unit === "BUSINESS_DAYS" ? duration : Math.ceil(duration / 8);
    let added = 0;
    while (added < daysToAdd) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
  }

  return result;
}

/**
 * Starts a new service timer for an application workflow entity
 */
export async function startServiceTimer(
  applicationId: string,
  policyId: string,
  entityType: string,
  entityId: string,
  durationValue = 5,
  durationUnit: ServiceDurationUnit = "BUSINESS_DAYS",
  customDb?: Firestore
): Promise<ServiceTimer> {
  const db = customDb || getAdminDb();
  const timerRef = db.collection(`applications/${applicationId}/serviceTimers`).doc();

  const now = new Date();
  const due = calculateBusinessDueTime(now, durationValue, durationUnit);

  const timer: ServiceTimer = {
    timerId: timerRef.id,
    applicationId,
    policyId,
    entityType,
    entityId,
    startedAt: now.toISOString(),
    dueAt: due.toISOString(),
    status: "RUNNING",
    elapsedDurationSeconds: 0,
    remainingDurationSeconds: Math.floor((due.getTime() - now.getTime()) / 1000),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    pauseHistory: [],
  };

  await timerRef.set(timer);
  return timer;
}

/**
 * Pauses a service timer (e.g. while WAITING_APPLICANT)
 */
export async function pauseServiceTimer(
  applicationId: string,
  timerId: string,
  reason: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const timerRef = db.collection(`applications/${applicationId}/serviceTimers`).doc(timerId);
  const doc = await timerRef.get();

  if (!doc.exists) return;

  const timer = doc.data() as ServiceTimer;
  if (timer.status !== "RUNNING") return;

  const now = new Date().toISOString();
  const historyEntry = {
    pausedAt: now,
    reason,
  };

  await timerRef.update({
    status: "PAUSED",
    pausedAt: now,
    pauseHistory: [...(timer.pauseHistory || []), historyEntry],
    updatedAt: now,
  });
}

/**
 * Resumes a paused service timer
 */
export async function resumeServiceTimer(
  applicationId: string,
  timerId: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const timerRef = db.collection(`applications/${applicationId}/serviceTimers`).doc(timerId);
  const doc = await timerRef.get();

  if (!doc.exists) return;

  const timer = doc.data() as ServiceTimer;
  if (timer.status !== "PAUSED") return;

  const now = new Date().toISOString();
  const lastPause = timer.pauseHistory?.[timer.pauseHistory.length - 1];
  if (lastPause) {
    lastPause.resumedAt = now;
  }

  await timerRef.update({
    status: "RUNNING",
    resumedAt: now,
    pauseHistory: timer.pauseHistory,
    updatedAt: now,
  });
}

/**
 * Completes a service timer
 */
export async function completeServiceTimer(
  applicationId: string,
  timerId: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  const timerRef = db.collection(`applications/${applicationId}/serviceTimers`).doc(timerId);
  const now = new Date().toISOString();

  await timerRef.update({
    status: "COMPLETED",
    completedAt: now,
    updatedAt: now,
  });
}

/**
 * Evaluates a service timer against current time and triggers escalation on breach
 */
export async function evaluateServiceTimer(
  applicationId: string,
  timerId: string,
  nowDate = new Date(),
  customDb?: Firestore
): Promise<{ status: string; isBreached: boolean }> {
  const db = customDb || getAdminDb();
  const timerRef = db.collection(`applications/${applicationId}/serviceTimers`).doc(timerId);
  const doc = await timerRef.get();

  if (!doc.exists) return { status: "NOT_FOUND", isBreached: false };

  const timer = doc.data() as ServiceTimer;
  if (timer.status !== "RUNNING") {
    return { status: timer.status, isBreached: timer.status === "BREACHED" };
  }

  const dueTime = new Date(String(timer.dueAt)).getTime();
  const isBreached = nowDate.getTime() > dueTime;

  if (isBreached) {
    const now = nowDate.toISOString();
    await timerRef.update({
      status: "BREACHED",
      breachedAt: now,
      updatedAt: now,
    });

    // Create Operational Escalation
    await createEscalation(
      {
        applicationId,
        entityType: "serviceTimers",
        entityId: timerId,
        reason: "SERVICE_TARGET_BREACH",
        severity: "HIGH",
        title: `Sasaran Prestasi Melebihi Tempoh: ${timer.policyId}`,
        description: `Pemprosesan bagi permohonan ${applicationId} telah melebihi sasaran masa dalaman yang ditetapkan.`,
        assignedTo: "unassigned",
        assignedRole: "OSC_MANAGER",
      },
      db
    );

    return { status: "BREACHED", isBreached: true };
  }

  return { status: "RUNNING", isBreached: false };
}
