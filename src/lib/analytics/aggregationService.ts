/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { AnalyticsSnapshot, ManagementAlert } from "../../types/analytics.ts";
import { FirestoreAnalyticsRepository } from "./analyticsRepository.ts";
import { computeDateRangeFromPreset } from "./kpiCalculator.ts";

export const ANALYTICS_SCHEMA_VERSION = "1.0.0";

/**
 * Executes the idempotent daily analytics aggregation job
 */
export async function aggregateDailyAnalytics(
  targetDate?: string,
  customDb?: Firestore
): Promise<{ snapshot: AnalyticsSnapshot; triggeredAlerts: ManagementAlert[] }> {
  const db = customDb || getAdminDb();
  const repo = new FirestoreAnalyticsRepository(db);

  const dateStr = targetDate || new Date().toISOString().slice(0, 10);
  const { from, to } = computeDateRangeFromPreset("30_DAYS", undefined, undefined, new Date(dateStr));
  const filter = { dateFrom: from, dateTo: to };

  const [
    summaryKpis,
    statusDistribution,
    categoryCompliance,
    topNonCompliance,
    issueAgeing,
    processingTimes,
    documentMetrics,
    aiGovernance,
    spatial,
  ] = await Promise.all([
    repo.getSummaryKpis(filter),
    repo.getStatusDistribution(filter),
    repo.getCategoryCompliance(filter),
    repo.getTopNonCompliance(filter),
    repo.getIssueAgeing(filter),
    repo.getProcessingTimes(filter),
    repo.getDocumentMetrics(filter),
    repo.getAiGovernance(filter),
    repo.getSpatialPlanning(filter),
  ]);

  const snapshotId = `snap-${dateStr}`;
  const now = new Date().toISOString();

  const snapshot: AnalyticsSnapshot = {
    snapshotId,
    snapshotDate: dateStr,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    generatedAt: now,
    summaryKpis,
    statusDistribution,
    categoryCompliance,
    topNonCompliance,
    issueAgeing,
    processingTimes,
    documentMetrics,
    aiGovernance,
    spatial,
  };

  await repo.saveSnapshot(snapshot);

  // Evaluate Management Operational Alerts
  const triggeredAlerts: ManagementAlert[] = [];

  // Alert 1: Critical Open Issue Backlog
  if (summaryKpis.openIssuesCount > 50) {
    triggeredAlerts.push({
      alertId: `alert-iss-${dateStr}`,
      alertType: "CRITICAL_ISSUE_BACKLOG",
      severity: "WARNING",
      status: "OPEN",
      title: "Tunggakan Isu Perancangan Meningkat",
      message: `Terdapat ${summaryKpis.openIssuesCount} isu perancangan yang masih belum diselesaikan (Melebihi had amaran 50).`,
      metric: "OPEN_ISSUES",
      threshold: 50,
      actualValue: summaryKpis.openIssuesCount,
      period: dateStr,
      createdAt: now,
    });
  }

  // Alert 2: AI Governance Verification Breach (CRITICAL)
  if (aiGovernance.verifiedWithoutHumanCount > 0) {
    triggeredAlerts.push({
      alertId: `alert-gov-${dateStr}`,
      alertType: "COMMENT_VERIFICATION_GOVERNANCE",
      severity: "CRITICAL",
      status: "OPEN",
      title: "AMARAN TADBIR URUS: Ulasan Diterbitkan Tanpa Pengesahan Pegawai",
      message: `Dikesan ${aiGovernance.verifiedWithoutHumanCount} ulasan rasmi diterbitkan tanpa pengesahan identiti pegawai manusia bertauliah.`,
      metric: "HUMAN_VERIFICATION_BREACH",
      threshold: 0,
      actualValue: aiGovernance.verifiedWithoutHumanCount,
      period: dateStr,
      createdAt: now,
    });
  }

  for (const alert of triggeredAlerts) {
    await db.collection("managementAlerts").doc(alert.alertId).set(alert);
  }

  return { snapshot, triggeredAlerts };
}
