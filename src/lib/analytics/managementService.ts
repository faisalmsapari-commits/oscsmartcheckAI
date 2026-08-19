/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  AnalyticsFilter,
  ManagementDashboardResponse,
  ExecutiveSummaryResponse,
  ManagementAlert,
  ManagementTarget,
} from "../../types/analytics.ts";
import { FirestoreAnalyticsRepository } from "./analyticsRepository.ts";
import { computeDateRangeFromPreset } from "./kpiCalculator.ts";
import { ANALYTICS_SCHEMA_VERSION } from "./aggregationService.ts";

/**
 * Returns comprehensive Management Dashboard metrics with applied filters
 */
export async function getManagementDashboard(
  filter: AnalyticsFilter = {},
  customDb?: Firestore
): Promise<ManagementDashboardResponse> {
  const db = customDb || getAdminDb();
  const repo = new FirestoreAnalyticsRepository(db);

  const { from, to } = computeDateRangeFromPreset(filter.timePreset, filter.dateFrom, filter.dateTo);
  const resolvedFilter: AnalyticsFilter = {
    ...filter,
    dateFrom: from,
    dateTo: to,
  };

  const [
    summaryKpis,
    applicationTrend,
    statusDistribution,
    categoryCompliance,
    topNonCompliance,
    issueAgeing,
    officerWorkload,
    processingTimes,
    spatialSummary,
    aiGovernance,
  ] = await Promise.all([
    repo.getSummaryKpis(resolvedFilter),
    repo.getApplicationTrend(resolvedFilter),
    repo.getStatusDistribution(resolvedFilter),
    repo.getCategoryCompliance(resolvedFilter),
    repo.getTopNonCompliance(resolvedFilter),
    repo.getIssueAgeing(resolvedFilter),
    repo.getOfficerWorkload(resolvedFilter),
    repo.getProcessingTimes(resolvedFilter),
    repo.getSpatialPlanning(resolvedFilter),
    repo.getAiGovernance(resolvedFilter),
  ]);

  // Load Active Alerts
  const alertsSnap = await db
    .collection("managementAlerts")
    .where("status", "in", ["OPEN", "ACKNOWLEDGED"])
    .get();
  const activeAlerts = alertsSnap.docs.map((d) => d.data() as ManagementAlert);

  // Load Configured Performance Targets
  const targetsSnap = await db.collection("managementTargets").get();
  const targets = targetsSnap.docs.map((d) => d.data() as ManagementTarget);

  // Development type distribution
  const devTypeCounts: Record<string, number> = {};
  for (const point of applicationTrend) {
    for (const [dt, cnt] of Object.entries(point.breakdownByDevelopmentType)) {
      devTypeCounts[dt] = (devTypeCounts[dt] || 0) + cnt;
    }
  }
  const totalDev = Object.values(devTypeCounts).reduce((a, b) => a + b, 0) || 1;
  const developmentTypeDistribution = Object.entries(devTypeCounts).map(([type, count]) => ({
    type,
    label: formatDevType(type),
    count,
    percentage: Number(((count / totalDev) * 100).toFixed(1)),
  }));

  // SmartCheck status distribution
  const smartCheckStatusDistribution = [
    {
      status: "PASS_PRECHECK",
      label: "Pra-Semakan Mematuhi Kriteria",
      count: Math.max(0, summaryKpis.smartCheckCompletedCount - summaryKpis.revisionRequiredCount - summaryKpis.officerReviewRequiredCount),
      percentage: 0,
    },
    {
      status: "REVISION_REQUIRED",
      label: "Pindaan Diperlukan",
      count: summaryKpis.revisionRequiredCount,
      percentage: 0,
    },
    {
      status: "OFFICER_REVIEW_REQUIRED",
      label: "Semakan Pegawai Diperlukan",
      count: summaryKpis.officerReviewRequiredCount,
      percentage: 0,
    },
  ];
  const totalSc = smartCheckStatusDistribution.reduce((a, b) => a + b.count, 0) || 1;
  smartCheckStatusDistribution.forEach((s) => {
    s.percentage = Number(((s.count / totalSc) * 100).toFixed(1));
  });

  // Descriptive Insights
  const descriptiveInsights: string[] = [];
  if (topNonCompliance.length > 0) {
    descriptiveInsights.push(
      `Isu ketidakpatuhan perancangan paling kerap dikesan adalah ${topNonCompliance[0].ruleName} (${topNonCompliance[0].sampleDenominatorText}).`
    );
  }
  if (spatialSummary.mukimDistribution.length > 0) {
    const topMukim = [...spatialSummary.mukimDistribution].sort((a, b) => b.applicationCount - a.applicationCount)[0];
    descriptiveInsights.push(
      `Mukim ${topMukim.mukim} merekodkan aktiviti permohonan tertinggi (${topMukim.applicationCount} permohonan).`
    );
  }
  if (aiGovernance.humanVerificationRate === 100) {
    descriptiveInsights.push("100% ulasan rasmi OSC telah disahkan oleh pegawai perancang bertauliah.");
  }

  const sampleSize = summaryKpis.totalApplications;

  return {
    metadata: {
      timeRange: {
        from,
        to,
        preset: filter.timePreset || "30_DAYS",
      },
      filtersApplied: filter,
      dataFreshness: "REALTIME",
      generatedAt: new Date().toISOString(),
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      sampleSize,
      hasInsufficientData: sampleSize < 3,
    },
    summaryKpis,
    applicationTrend,
    statusDistribution,
    developmentTypeDistribution,
    smartCheckStatusDistribution,
    categoryCompliance,
    topNonCompliance,
    issueAgeing,
    officerWorkload,
    processingTimes,
    spatialSummary,
    aiGovernance,
    activeAlerts,
    targets,
    descriptiveInsights,
  };
}

/**
 * Returns concise Executive Summary DTO
 */
export async function getManagementExecutiveSummary(
  filter: AnalyticsFilter = {},
  customDb?: Firestore
): Promise<ExecutiveSummaryResponse> {
  const dash = await getManagementDashboard(filter, customDb);
  const topMukim = dash.spatialSummary.mukimDistribution[0]?.mukim || "-";
  const topDev = dash.developmentTypeDistribution[0]?.label || "-";

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      period: `${dash.metadata.timeRange.from.slice(0, 10)} hingga ${dash.metadata.timeRange.to.slice(0, 10)}`,
    },
    totalApplications: dash.summaryKpis.totalApplications,
    activeApplications: dash.summaryKpis.activeApplications,
    revisionRequiredCount: dash.summaryKpis.revisionRequiredCount,
    criticalOpenIssuesCount: dash.summaryKpis.openIssuesCount,
    avgSmartCheckDurationSeconds: dash.summaryKpis.avgSmartCheckDurationSeconds,
    humanVerificationRate: dash.summaryKpis.humanVerificationRate,
    topMukim,
    topDevelopmentType: topDev,
    activeAlertsCount: dash.activeAlerts.length,
  };
}

/**
 * Acknowledges a management operational alert
 */
export async function acknowledgeManagementAlert(
  alertId: string,
  officerUid: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  await db.collection("managementAlerts").doc(alertId).update({
    status: "ACKNOWLEDGED",
    acknowledgedBy: officerUid,
    acknowledgedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "MANAGEMENT_ALERT_ACKNOWLEDGED",
    resourceType: "managementAlerts",
    resourceId: alertId,
    actorUid: officerUid,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Creates or updates a management performance target
 */
export async function createOrUpdateManagementTarget(
  target: ManagementTarget,
  authorUid: string,
  authorRole: string,
  customDb?: Firestore
): Promise<void> {
  const db = customDb || getAdminDb();
  await db.collection("managementTargets").doc(target.targetId).set(target);

  await db.collection("auditLogs").add({
    eventType: "MANAGEMENT_TARGET_CREATED",
    resourceType: "managementTargets",
    resourceId: target.targetId,
    actorUid: authorUid,
    actorRole: authorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { kpiCode: target.kpiCode, targetValue: target.targetValue },
  });
}

/**
 * Exports privacy-filtered management analytics dataset
 */
export async function exportManagementData(
  datasetType: string,
  format: "CSV" | "JSON" = "CSV",
  filter: AnalyticsFilter = {},
  actorUid: string,
  actorRole: string,
  customDb?: Firestore
): Promise<{ content: string; mimeType: string; fileName: string }> {
  const db = customDb || getAdminDb();
  const dash = await getManagementDashboard(filter, db);

  let rows: Array<Record<string, any>> = [];

  switch (datasetType) {
    case "SUMMARY_KPIS":
      rows = [
        { Metrik: "Jumlah Permohonan", Nilai: dash.summaryKpis.totalApplications },
        { Metrik: "Permohonan Aktif", Nilai: dash.summaryKpis.activeApplications },
        { Metrik: "SmartCheck Selesai", Nilai: dash.summaryKpis.smartCheckCompletedCount },
        { Metrik: "Perlu Pindaan", Nilai: dash.summaryKpis.revisionRequiredCount },
        { Metrik: "Isu Terbuka", Nilai: dash.summaryKpis.openIssuesCount },
        { Metrik: "Purata Masa SmartCheck (Saat)", Nilai: dash.summaryKpis.avgSmartCheckDurationSeconds },
        { Metrik: "Kadar Pengesahan Manusia (%)", Nilai: dash.summaryKpis.humanVerificationRate },
      ];
      break;
    case "TOP_NON_COMPLIANCE":
      rows = dash.topNonCompliance.map((r) => ({
        Kod_Peraturan: r.ruleCode,
        Nama_Peraturan: r.ruleName,
        Kategori: r.category,
        Kekerapan_Dinilai: r.timesEvaluated,
        Bilangan_Tidak_Patuh: r.nonCompliantCount,
        Kadar_Ketidakpatuhan: `${r.nonComplianceRate}%`,
      }));
      break;
    case "OFFICER_WORKLOAD":
      rows = dash.officerWorkload.map((w) => ({
        Pegawai: w.officerName,
        Permohonan_Diagihkan: w.assignedApplicationsCount,
        Isu_Terbuka: w.openIssuesCount,
        Semakan_Menunggu: w.pendingReviewCount,
      }));
      break;
    default:
      rows = dash.statusDistribution.map((s) => ({
        Status: s.label,
        Bilangan: s.count,
        Peratusan: `${s.percentage}%`,
      }));
  }

  let content = "";
  let mimeType = "text/csv";
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `OSC_Analytics_${datasetType}_${timestamp}.${format.toLowerCase()}`;

  if (format === "JSON") {
    content = JSON.stringify(rows, null, 2);
    mimeType = "application/json";
  } else {
    // Generate CSV
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
      ];
      content = csvLines.join("\n");
    }
  }

  // Record Audit Event
  await db.collection("auditLogs").add({
    eventType: "MANAGEMENT_DATA_EXPORTED",
    resourceType: "analytics",
    actorUid,
    actorRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      datasetType,
      format,
      rowCount: rows.length,
      fileName,
    },
  });

  return { content, mimeType, fileName };
}

function formatDevType(dt: string): string {
  const map: Record<string, string> = {
    HOUSING: "Perumahan",
    HOTEL: "Hotel & Resort",
    COMMERCIAL: "Perniagaan & Komersial",
    INDUSTRIAL: "Perindustrian",
    MIXED_DEVELOPMENT: "Pembangunan Bercampur",
    OTHER: "Lain-lain",
  };
  return map[dt] || dt;
}
