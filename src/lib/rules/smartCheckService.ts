import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import type {
  SmartCheckRecord,
  RuleEvaluation,
  CategorySummary,
  OverallPrecheckStatus,
  ComplianceStatus,
  SmartCheckReadiness,
  OfficerRuleAssessment,
  OfficerAssessment,
  RuleCategory,
} from "../../types/rules.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../types/rules.ts";
import { buildPlanningDataContext } from "./planningDataContext.ts";
import { resolveApplicableRuleSets, resolveApplicableRules } from "./ruleResolver.ts";
import { evaluateRule } from "./evaluators/index.ts";

/**
 * Triggers server-side deterministic SmartCheck compliance evaluation
 */
export async function startSmartCheck(
  applicationId: string,
  userId: string,
  userRole: string,
  forceRerun: boolean = false,
  customDb?: Firestore
): Promise<{ smartCheckId: string; overallStatus: OverallPrecheckStatus; isNew: boolean }> {
  const db = customDb || getAdminDb();

  // 1. Build PlanningDataContext from verified facts and GIS data
  const context = await buildPlanningDataContext(applicationId, db);

  // 2. Resolve Applicable Rule Sets
  const ruleSets = await resolveApplicableRuleSets(context.applicationDate, db);
  if (ruleSets.length === 0) {
    throw new Error("Tiada set peraturan perancangan aktif dijumpai untuk tarikh permohonan ini.");
  }

  // 3. Resolve Applicable Rules
  const applicableRules = await resolveApplicableRules(context, ruleSets, db);
  if (applicableRules.length === 0) {
    throw new Error("Tiada peraturan perancangan yang berkaitan dengan jenis pembangunan ini.");
  }

  // 4. Compute Input Fingerprint for Idempotency
  const factKeys = Array.from(context.facts.keys()).sort().join(",");
  const ruleCodes = applicableRules.map((r) => r.code).sort().join(",");
  const fingerprint = `fp-${context.developmentType}-${context.site.siteAreaSqm}-${factKeys.length}-${ruleCodes.length}`;

  // Check for existing completed SmartCheck with same fingerprint
  const existingSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .where("fingerprint", "==", fingerprint)
    .where("status", "==", "COMPLETED")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!existingSnap.empty && !forceRerun) {
    const existing = existingSnap.docs[0].data() as SmartCheckRecord;
    return {
      smartCheckId: existing.smartCheckId,
      overallStatus: existing.overallStatus,
      isNew: false,
    };
  }

  // 5. Evaluate Rules Deterministically
  const results: RuleEvaluation[] = [];
  for (const rule of applicableRules) {
    try {
      const evaluation = await evaluateRule(rule, context);
      results.push(evaluation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pelaksanaan peraturan";
      results.push({
        ruleId: rule.ruleId,
        ruleCode: rule.code,
        ruleName: rule.name,
        ruleSetId: rule.ruleSetId,
        ruleSetVersion: "1.0.0",
        category: rule.category,
        status: "ERROR",
        severity: "CRITICAL",
        actualValue: null,
        requiredValue: null,
        unit: null,
        messageCode: "RULE_EXECUTION_ERROR",
        messageText: `Ralat teknikal semasa menyemak peraturan: ${msg}`,
        inputEvidence: [],
        ruleEvidence: {
          sourceDocumentId: rule.sourceDocumentId,
          sourceDocumentVersion: rule.sourceDocumentVersion,
          sourceClause: rule.sourceClause,
          sourcePage: rule.sourcePage,
          sourceTextExcerpt: rule.sourceTextExcerpt,
        },
        requiresOfficerReview: true,
        evaluatedAt: new Date().toISOString(),
        engineVersion: PLANNING_RULE_ENGINE_VERSION,
        errorCode: "EXECUTION_ERROR",
        errorMessage: msg,
      });
    }
  }

  // 6. Aggregate Category Summaries & Overall Status
  const categorySummaries = aggregateCategorySummaries(results);
  const overallStatus = computeOverallPrecheckStatus(results);

  // 7. Persist SmartCheck Record and Results
  const smartCheckId = `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const smartCheckRecord: SmartCheckRecord = {
    smartCheckId,
    applicationId,
    applicationVersion: 1,
    siteVersion: 1,
    lcpDocumentId: "current-lcp",
    lcpDocumentVersion: 1,
    status: "COMPLETED",
    overallStatus,
    engineVersion: PLANNING_RULE_ENGINE_VERSION,
    ruleSetSnapshots: ruleSets.map((rs) => ({
      ruleSetId: rs.ruleSetId,
      code: rs.code,
      version: rs.version,
      checksum: rs.checksum || rs.version,
    })),
    fingerprint,
    startedBy: userId,
    startedAt: now,
    completedAt: now,
    categorySummaries,
    totalRulesEvaluated: results.length,
    compliantCount: results.filter((r) => r.status === "COMPLIANT").length,
    nonCompliantCount: results.filter((r) => r.status === "NON_COMPLIANT").length,
    requiresReviewCount: results.filter((r) => r.status === "REQUIRES_REVIEW").length,
    insufficientDataCount: results.filter((r) => r.status === "INSUFFICIENT_DATA").length,
    notApplicableCount: results.filter((r) => r.status === "NOT_APPLICABLE").length,
    errorCount: results.filter((r) => r.status === "ERROR").length,
    createdAt: now,
    updatedAt: now,
  };

  // Write SmartCheck Document
  await db
    .collection(`applications/${applicationId}/smartChecks`)
    .doc(smartCheckId)
    .set({
      ...smartCheckRecord,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  // Batch write individual results
  const batch = db.batch();
  for (const res of results) {
    const resRef = db
      .collection(`applications/${applicationId}/smartChecks/${smartCheckId}/results`)
      .doc(res.ruleId);
    batch.set(resRef, {
      ...res,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  // Create or update issues automatically
  try {
    const { createIssuesFromSmartCheck } = await import("../issues/issueService.ts");
    await createIssuesFromSmartCheck(applicationId, smartCheckId, db);
  } catch (issueErr) {
    console.warn("Could not automatically generate issues for SmartCheck:", issueErr);
  }

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "SMARTCHECK_COMPLETED",
    resourceType: "smartChecks",
    resourceId: smartCheckId,
    applicationId,
    actorUid: userId,
    actorRole: userRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      overallStatus,
      totalRules: results.length,
      nonCompliant: smartCheckRecord.nonCompliantCount,
      requiresReview: smartCheckRecord.requiresReviewCount,
    },
  });

  return {
    smartCheckId,
    overallStatus,
    isNew: true,
  };
}

/**
 * Computes deterministic Category Summaries
 */
export function aggregateCategorySummaries(results: RuleEvaluation[]): Record<string, CategorySummary> {
  const summaries: Record<string, CategorySummary> = {};

  const categories = Array.from(new Set(results.map((r) => r.category)));

  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const compliant = catResults.filter((r) => r.status === "COMPLIANT").length;
    const nonCompliant = catResults.filter((r) => r.status === "NON_COMPLIANT").length;
    const requiresReview = catResults.filter((r) => r.status === "REQUIRES_REVIEW").length;
    const insufficient = catResults.filter((r) => r.status === "INSUFFICIENT_DATA").length;
    const notApp = catResults.filter((r) => r.status === "NOT_APPLICABLE").length;
    const errors = catResults.filter((r) => r.status === "ERROR").length;

    let catStatus: ComplianceStatus = "COMPLIANT";
    if (errors > 0) catStatus = "ERROR";
    else if (nonCompliant > 0) catStatus = "NON_COMPLIANT";
    else if (requiresReview > 0) catStatus = "REQUIRES_REVIEW";
    else if (insufficient > 0) catStatus = "INSUFFICIENT_DATA";
    else if (compliant > 0) catStatus = "COMPLIANT";
    else catStatus = "NOT_APPLICABLE";

    summaries[cat] = {
      category: cat as RuleCategory,
      categoryName: getCategoryName(cat),
      status: catStatus,
      totalRules: catResults.length,
      compliantCount: compliant,
      nonCompliantCount: nonCompliant,
      requiresReviewCount: requiresReview,
      insufficientDataCount: insufficient,
      notApplicableCount: notApp,
      errorCount: errors,
    };
  }

  return summaries;
}

/**
 * Computes deterministic Overall Precheck Status (NOT a statutory KM approval decision)
 */
export function computeOverallPrecheckStatus(results: RuleEvaluation[]): OverallPrecheckStatus {
  if (results.some((r) => r.status === "ERROR")) {
    return "PROCESSING_ERROR";
  }
  if (results.some((r) => r.status === "NON_COMPLIANT")) {
    return "REVISION_REQUIRED";
  }
  if (results.some((r) => r.status === "REQUIRES_REVIEW")) {
    return "OFFICER_REVIEW_REQUIRED";
  }
  if (results.some((r) => r.status === "INSUFFICIENT_DATA")) {
    return "INSUFFICIENT_DATA";
  }
  return "PASS_PRECHECK";
}

/**
 * Submits an authorized Officer Assessment without modifying machine results
 */
export async function submitRuleAssessment(
  applicationId: string,
  smartCheckId: string,
  resultId: string,
  officerUid: string,
  officerRole: string,
  assessment: OfficerAssessment,
  reason: string,
  customDb?: Firestore
): Promise<OfficerRuleAssessment> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(officerRole)) {
    throw new Error("Akses tidak dibenarkan. Hanya Pegawai OSC/Perancang boleh membuat penilaian.");
  }

  const now = new Date().toISOString();
  const assessmentPayload: OfficerRuleAssessment = {
    resultId,
    officerUid,
    officerRole,
    assessment,
    reason,
    assessedAt: now,
  };

  const assessmentRef = db
    .collection(
      `applications/${applicationId}/smartChecks/${smartCheckId}/results/${resultId}/assessments`
    )
    .doc(officerUid);

  await assessmentRef.set({
    ...assessmentPayload,
    assessedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  await db.collection("auditLogs").add({
    eventType: "OFFICER_RULE_ASSESSMENT_SUBMITTED",
    resourceType: "smartCheckResults",
    resourceId: resultId,
    applicationId,
    actorUid: officerUid,
    actorRole: officerRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      smartCheckId,
      assessment,
      reason,
    },
  });

  return assessmentPayload;
}

/**
 * Evaluates SmartCheck readiness
 */
export async function getSmartCheckReadiness(
  applicationId: string,
  customDb?: Firestore
): Promise<SmartCheckReadiness> {
  const db = customDb || getAdminDb();
  const issues: string[] = [];

  // Check LCP Documents
  const docsSnap = await db.collection(`applications/${applicationId}/documents`).get();
  const hasLcp = docsSnap.docs.some((d) => d.data().documentType === "LCP");
  if (!hasLcp) issues.push("Dokumen Laporan Cadangan Pemajuan (LCP) belum dimuat naik.");

  // Check Site
  const siteSnap = await db.collection(`applications/${applicationId}/site`).doc("current").get();
  const hasSite = siteSnap.exists;
  if (!hasSite) issues.push("Lokasi dan lot kadaster tapak belum ditetapkan.");

  return {
    ready: issues.length === 0,
    documentReady: hasLcp,
    factReady: true,
    spatialReady: hasSite,
    ruleSetsReady: true,
    issues,
  };
}

/**
 * Gets latest SmartCheck summary and results
 */
export async function getSmartCheckSummary(
  applicationId: string,
  customDb?: Firestore
): Promise<{ smartCheck: SmartCheckRecord | null; results: RuleEvaluation[] }> {
  const db = customDb || getAdminDb();

  const snap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) {
    return { smartCheck: null, results: [] };
  }

  const smartCheck = snap.docs[0].data() as SmartCheckRecord;
  const resultsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${smartCheck.smartCheckId}/results`)
    .get();

  const results = resultsSnap.docs.map((d) => d.data() as RuleEvaluation);
  return { smartCheck, results };
}

function getCategoryName(category: string): string {
  switch (category) {
    case "RTD":
      return "Zon Guna Tanah (RTD 2030)";
    case "PARKING":
      return "Tempat Letak Kenderaan (TLK)";
    case "OPEN_SPACE":
      return "Kawasan Lapang & Rekreasi";
    case "PLOT_RATIO":
      return "Kawalan Intensiti & Nisbah Plot";
    case "HOUSING":
      return "Perumahan & Kepadatan";
    default:
      return category;
  }
}
