import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type {
  SmartCheckDashboardData,
  SmartCheckFreshnessResult,
  SmartCheckComparisonResult,
  OfficerReviewCompleteness,
  RuleComparisonDiff,
  OfficerQueueItem,
} from "../../types/dashboard.ts";
import type { SmartCheckRecord, RuleEvaluation } from "../../types/rules.ts";
import type { Application } from "../../types/application.ts";
import { getApplicationIssues, getApplicationIssueSummary } from "./issueService.ts";

/**
 * Loads complete data for the main SmartCheck Dashboard
 */
export async function getSmartCheckDashboard(
  applicationId: string,
  userRole: string,
  customDb?: Firestore
): Promise<SmartCheckDashboardData> {
  const db = customDb || getAdminDb();

  // 1. Fetch Application Document
  const appSnap = await db.collection("applications").doc(applicationId).get();
  if (!appSnap.exists) {
    throw new Error(`Permohonan ${applicationId} tidak dijumpai.`);
  }
  const appData = appSnap.data() as Application;

  // 2. Fetch Latest SmartCheck Record
  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  let smartCheck: SmartCheckRecord | null = null;
  let results: RuleEvaluation[] = [];

  if (!scSnap.empty) {
    smartCheck = scSnap.docs[0].data() as SmartCheckRecord;
    const resultsSnap = await db
      .collection(`applications/${applicationId}/smartChecks/${smartCheck.smartCheckId}/results`)
      .get();
    results = resultsSnap.docs.map((d) => d.data() as RuleEvaluation);
  }

  // 3. Fetch Issues and Freshness
  const issues = await getApplicationIssues(applicationId, userRole, db);
  const issueSummary = await getApplicationIssueSummary(applicationId, db);
  const freshness = await getSmartCheckFreshness(applicationId, db);
  const reviewCompleteness = await getOfficerReviewCompleteness(
    applicationId,
    smartCheck?.smartCheckId || "none",
    db
  );

  const lotNumbers = (appData.siteInfo?.lots || []).map((l) => l.lotNumber);

  return {
    application: {
      id: applicationId,
      applicationNo: appData.applicationNo || applicationId,
      projectName: appData.projectInfo?.projectName || appData.title || "Projek Kebenaran Merancang",
      developmentType: appData.developmentType || appData.projectInfo?.developmentType || "HOTEL",
      applicantName: appData.applicantInfo?.applicantName || "Pemohon",
      mukim: appData.siteInfo?.mukim || "Kuah",
      lotNumbers,
      status: appData.status || "DRAFT",
    },
    smartCheck,
    results,
    categorySummaries: smartCheck?.categorySummaries || {},
    issues,
    issueSummary,
    freshness,
    reviewCompleteness,
  };
}

/**
 * Detects whether the current SmartCheck run is stale due to LCP or Site updates
 */
export async function getSmartCheckFreshness(
  applicationId: string,
  customDb?: Firestore
): Promise<SmartCheckFreshnessResult> {
  const db = customDb || getAdminDb();

  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (scSnap.empty) {
    return {
      freshness: "CURRENT",
      isStale: false,
      message: "Belum ada larian SmartCheck.",
      reasons: [],
      currentLcpVersion: 1,
      evaluatedLcpVersion: 1,
      currentSiteVersion: 1,
      evaluatedSiteVersion: 1,
    };
  }

  const smartCheck = scSnap.docs[0].data() as SmartCheckRecord;

  // Check Current LCP Version
  const docsSnap = await db
    .collection(`applications/${applicationId}/documents`)
    .where("documentType", "==", "LCP")
    .where("status", "==", "ACTIVE")
    .limit(1)
    .get();

  const currentLcpVersion = docsSnap.empty ? 1 : Number(docsSnap.docs[0].data().versionNumber || 1);
  const currentSiteVersion = 1;

  const reasons: string[] = [];
  if (currentLcpVersion > smartCheck.lcpDocumentVersion) {
    reasons.push(
      `Versi dokumen LCP semasa (v${currentLcpVersion}) lebih baharu berbanding yang dinilai (v${smartCheck.lcpDocumentVersion}).`
    );
  }

  const isStale = reasons.length > 0;
  return {
    freshness: isStale ? "STALE_INPUT_CHANGED" : "CURRENT",
    isStale,
    message: isStale ? "SmartCheck tidak terkini kerana perubahan dokumen LCP." : "SmartCheck adalah terkini.",
    reasons,
    currentLcpVersion,
    evaluatedLcpVersion: smartCheck.lcpDocumentVersion,
    currentSiteVersion,
    evaluatedSiteVersion: smartCheck.siteVersion,
  };
}

/**
 * Compares two historical SmartCheck runs and highlights rule diffs
 */
export async function compareSmartCheckRuns(
  applicationId: string,
  runIdA: string,
  runIdB: string,
  customDb?: Firestore
): Promise<SmartCheckComparisonResult> {
  const db = customDb || getAdminDb();

  const snapA = await db.collection(`applications/${applicationId}/smartChecks`).doc(runIdA).get();
  const snapB = await db.collection(`applications/${applicationId}/smartChecks`).doc(runIdB).get();

  if (!snapA.exists || !snapB.exists) {
    throw new Error("Satu atau kedua-dua larian SmartCheck tidak dijumpai.");
  }

  const recA = snapA.data() as SmartCheckRecord;
  const recB = snapB.data() as SmartCheckRecord;

  const resultsSnapA = await db
    .collection(`applications/${applicationId}/smartChecks/${runIdA}/results`)
    .get();
  const resultsSnapB = await db
    .collection(`applications/${applicationId}/smartChecks/${runIdB}/results`)
    .get();

  const mapA = new Map<string, RuleEvaluation>();
  resultsSnapA.docs.forEach((d) => mapA.set(d.data().ruleCode, d.data() as RuleEvaluation));

  const diffs: RuleComparisonDiff[] = [];
  let resolvedCount = 0;
  let degradedCount = 0;
  let unchangedCount = 0;

  for (const docB of resultsSnapB.docs) {
    const resB = docB.data() as RuleEvaluation;
    const resA = mapA.get(resB.ruleCode);

    if (!resA) {
      diffs.push({
        ruleCode: resB.ruleCode,
        ruleName: resB.ruleName,
        category: resB.category,
        statusA: "NOT_APPLICABLE",
        statusB: resB.status,
        actualValueA: "-",
        actualValueB: resB.actualValue,
        requiredValueA: "-",
        requiredValueB: resB.requiredValue,
        changeType: "NEW_RULE",
      });
      continue;
    }

    let changeType: "RESOLVED" | "DEGRADED" | "UNCHANGED" = "UNCHANGED";
    if (resA.status === "NON_COMPLIANT" && resB.status === "COMPLIANT") {
      changeType = "RESOLVED";
      resolvedCount++;
    } else if (resA.status === "COMPLIANT" && resB.status === "NON_COMPLIANT") {
      changeType = "DEGRADED";
      degradedCount++;
    } else {
      unchangedCount++;
    }

    diffs.push({
      ruleCode: resB.ruleCode,
      ruleName: resB.ruleName,
      category: resB.category,
      statusA: resA.status,
      statusB: resB.status,
      actualValueA: resA.actualValue,
      actualValueB: resB.actualValue,
      requiredValueA: resA.requiredValue,
      requiredValueB: resB.requiredValue,
      differenceA: resA.difference,
      differenceB: resB.difference,
      changeType,
    });
  }

  return {
    applicationId,
    runA: {
      smartCheckId: recA.smartCheckId,
      overallStatus: recA.overallStatus,
      lcpVersion: recA.lcpDocumentVersion,
      createdAt: String(recA.createdAt),
    },
    runB: {
      smartCheckId: recB.smartCheckId,
      overallStatus: recB.overallStatus,
      lcpVersion: recB.lcpDocumentVersion,
      createdAt: String(recB.createdAt),
    },
    diffs,
    summary: {
      totalDiffs: diffs.length,
      resolvedCount,
      degradedCount,
      unchangedCount,
    },
  };
}

/**
 * Calculates completeness of officer reviews for a SmartCheck run
 */
export async function getOfficerReviewCompleteness(
  applicationId: string,
  smartCheckId: string,
  customDb?: Firestore
): Promise<OfficerReviewCompleteness> {
  const db = customDb || getAdminDb();

  if (smartCheckId === "none") {
    return {
      smartCheckId,
      totalResults: 0,
      resultsRequiringReview: 0,
      reviewedResults: 0,
      unreviewedResults: 0,
      openIssues: 0,
      criticalOpenIssues: 0,
      readyForDraftComment: false,
      completenessPercent: 0,
    };
  }

  const resultsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${smartCheckId}/results`)
    .get();

  const results = resultsSnap.docs.map((d) => d.data() as RuleEvaluation);
  const requiringReview = results.filter((r) => r.status !== "COMPLIANT" && r.status !== "NOT_APPLICABLE");

  const issuesSnap = await db
    .collection(`applications/${applicationId}/issues`)
    .where("smartCheckId", "==", smartCheckId)
    .get();

  const issues = issuesSnap.docs.map((d) => d.data());
  const openIssues = issues.filter((i) => i.status === "OPEN" || i.status === "IN_REVIEW").length;
  const criticalOpenIssues = issues.filter(
    (i) => i.severity === "CRITICAL" && (i.status === "OPEN" || i.status === "IN_REVIEW")
  ).length;

  const total = requiringReview.length;
  const reviewed = total - openIssues;
  const completenessPercent = total > 0 ? Math.round((reviewed / total) * 100) : 100;

  return {
    smartCheckId,
    totalResults: results.length,
    resultsRequiringReview: total,
    reviewedResults: Math.max(0, reviewed),
    unreviewedResults: openIssues,
    openIssues,
    criticalOpenIssues,
    readyForDraftComment: criticalOpenIssues === 0 && completenessPercent >= 80,
    completenessPercent: Math.min(100, Math.max(0, completenessPercent)),
  };
}

/**
 * Gets SmartCheck work queue for planning / OSC officers
 */
export async function getOfficerSmartCheckQueue(
  officerUid: string,
  officerRole: string,
  customDb?: Firestore
): Promise<OfficerQueueItem[]> {
  const db = customDb || getAdminDb();
  const queue: OfficerQueueItem[] = [];

  const appsSnap = await db
    .collection("applications")
    .where("status", "in", ["SUBMITTED", "DOCUMENT_CHECK", "AI_PROCESSING", "SMARTCHECK_COMPLETED", "OFFICER_REVIEW"])
    .limit(20)
    .get();

  for (const doc of appsSnap.docs) {
    const app = doc.data() as Application;
    const appId = doc.id;

    const scSnap = await db
      .collection(`applications/${appId}/smartChecks`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (scSnap.empty) continue;

    const sc = scSnap.docs[0].data() as SmartCheckRecord;
    const issues = await getApplicationIssueSummary(appId, db);

    queue.push({
      applicationId: appId,
      applicationNo: app.applicationNo || appId,
      projectName: app.projectInfo?.projectName || app.title || "Projek KM",
      developmentType: app.developmentType || app.projectInfo?.developmentType || "HOTEL",
      applicantName: app.applicantInfo?.applicantName || "Pemohon",
      smartCheckId: sc.smartCheckId,
      overallStatus: sc.overallStatus,
      totalIssues: issues.openIssues,
      criticalIssues: issues.criticalIssues,
      assignedOfficer: app.assignedOfficerUid || null,
      lastUpdated: String(sc.updatedAt || sc.createdAt),
    });
  }

  return queue;
}
