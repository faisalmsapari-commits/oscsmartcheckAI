import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import crypto from "crypto";
import type { PlanningCommentContext } from "../../types/comments.ts";
import type { Application } from "../../types/application.ts";
import type { SmartCheckRecord, RuleEvaluation } from "../../types/rules.ts";
import type { SmartCheckIssue } from "../../types/issues.ts";
import { getOfficerReviewCompleteness } from "../issues/dashboardService.ts";

/**
 * Builds compact, PII-minimized, and structured context for Gemini / Genkit
 */
export async function buildPlanningCommentContext(
  applicationId: string,
  smartCheckId: string,
  customDb?: Firestore
): Promise<PlanningCommentContext> {
  const db = customDb || getAdminDb();

  // 1. Application Document (Data minimization: exclude IC, phone, personal address)
  const appSnap = await db.collection("applications").doc(applicationId).get();
  if (!appSnap.exists) {
    throw new Error(`Permohonan ${applicationId} tidak dijumpai.`);
  }
  const appData = appSnap.data() as Application;

  // 2. SmartCheck Record
  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .doc(smartCheckId)
    .get();

  if (!scSnap.exists) {
    throw new Error(`Larian SmartCheck ${smartCheckId} tidak dijumpai.`);
  }
  const scData = scSnap.data() as SmartCheckRecord;

  // 3. Rule Results
  const resultsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${smartCheckId}/results`)
    .get();
  const rawResults = resultsSnap.docs.map((d) => d.data() as RuleEvaluation);

  // 4. Officer Assessments
  const assessments: Array<{ resultId: string; assessment: "AGREE" | "DISAGREE"; reason: string }> = [];
  for (const doc of resultsSnap.docs) {
    const assessSnap = await db
      .collection(`applications/${applicationId}/smartChecks/${smartCheckId}/results/${doc.id}/assessments`)
      .limit(1)
      .get();
    if (!assessSnap.empty) {
      const aData = assessSnap.docs[0].data();
      assessments.push({
        resultId: doc.id,
        assessment: aData.assessment,
        reason: aData.reason || "",
      });
    }
  }

  // 5. Issues
  const issuesSnap = await db
    .collection(`applications/${applicationId}/issues`)
    .where("smartCheckId", "==", smartCheckId)
    .get();
  const rawIssues = issuesSnap.docs.map((d) => d.data() as SmartCheckIssue);

  // 6. Review Completeness
  const reviewCompleteness = await getOfficerReviewCompleteness(applicationId, smartCheckId, db);

  // 7. Extract Verified LCP and Spatial Facts
  const verifiedFacts: Array<{ key: string; value: unknown; unit?: string; source: string }> = [];
  const spatialFacts: Array<{ key: string; value: unknown; unit?: string; datasetVersion: string }> = [];

  for (const r of rawResults) {
    for (const inp of r.inputEvidence || []) {
      if (inp.sourceType === "LCP_CONFIRMED_FACT" || inp.sourceType === "LCP_EXTRACTED_FACT") {
        if (!verifiedFacts.some((f) => f.key === inp.key)) {
          verifiedFacts.push({
            key: inp.key,
            value: inp.value,
            source: inp.sourceType,
          });
        }
      } else if (inp.sourceType === "VERIFIED_SPATIAL_FACT" || (inp.sourceType as string) === "GIS_SPATIAL_FACT") {
        if (!spatialFacts.some((f) => f.key === inp.key)) {
          spatialFacts.push({
            key: inp.key,
            value: inp.value,
            datasetVersion: "RTD-2030-v1",
          });
        }
      }
    }
  }

  const lotNumbers = (appData.siteInfo?.lots || []).map((l) => l.lotNumber);

  return {
    application: {
      applicationId,
      applicationNo: appData.applicationNo || applicationId,
      projectTitle: appData.projectInfo?.projectName || appData.title || "Projek KM",
      developmentType: appData.developmentType || appData.projectInfo?.developmentType || "HOTEL",
      lotNumbers,
      mukim: appData.siteInfo?.mukim || "Kuah",
    },
    sourceVersions: {
      lcpVersion: scData.lcpDocumentVersion,
      siteVersion: scData.siteVersion,
      smartCheckVersion: scData.smartCheckId,
      ruleEngineVersion: scData.engineVersion || "1.0.0",
      ruleSetVersions: scData.ruleSetSnapshots?.map((s) => s.version) || ["RS-MPLBP-2026-V1"],
      gisDatasetVersions: ["RTD-2030-v1", "LOT-KADASTER-2026"],
      promptVersion: "1.0.0",
    },
    smartCheck: {
      smartCheckId: scData.smartCheckId,
      overallStatus: scData.overallStatus,
      totalRulesEvaluated: scData.totalRulesEvaluated,
      compliantCount: scData.compliantCount,
      nonCompliantCount: scData.nonCompliantCount,
      requiresReviewCount: scData.requiresReviewCount,
      insufficientDataCount: scData.insufficientDataCount,
      categorySummaries: Object.fromEntries(
        Object.entries(scData.categorySummaries || {}).map(([cat, summary]) => [
          cat,
          {
            total: summary.totalRules,
            compliant: summary.compliantCount,
            nonCompliant: summary.nonCompliantCount,
            requiresReview: summary.requiresReviewCount,
          },
        ])
      ),
    },
    results: rawResults.map((r) => ({
      ruleId: r.ruleId,
      ruleCode: r.ruleCode,
      ruleName: r.ruleName,
      category: r.category,
      machineStatus: r.status,
      severity: r.severity,
      actualValue: r.actualValue,
      requiredValue: r.requiredValue,
      difference: r.difference ?? null,
      unit: r.unit,
      ruleEvidence: r.ruleEvidence,
      inputEvidence: r.inputEvidence || [],
    })),
    officerAssessments: assessments,
    issues: rawIssues.map((i) => ({
      issueId: i.issueId,
      ruleCode: i.ruleCode,
      category: i.category,
      issueType: i.issueType,
      severity: i.severity,
      status: i.status,
      visibility: i.visibility,
      title: i.title,
      description: i.description,
      officerCommentDraft: i.officerCommentDraft ?? null,
      resolutionNote: i.resolutionNote ?? null,
    })),
    verifiedFacts,
    spatialFacts,
    reviewCompleteness: {
      completenessPercent: reviewCompleteness.completenessPercent,
      criticalOpenIssues: reviewCompleteness.criticalOpenIssues,
      readyForDraftComment: reviewCompleteness.readyForDraftComment,
    },
  };
}

/**
 * Computes deterministic SHA-256 fingerprint from planning comment context
 */
export function computeSourceFingerprint(ctx: PlanningCommentContext): string {
  const content = JSON.stringify({
    appId: ctx.application.applicationId,
    smartCheckId: ctx.smartCheck.smartCheckId,
    lcpVersion: ctx.sourceVersions.lcpVersion,
    siteVersion: ctx.sourceVersions.siteVersion,
    ruleEngineVersion: ctx.sourceVersions.ruleEngineVersion,
    promptVersion: ctx.sourceVersions.promptVersion,
    results: ctx.results.map((r) => ({ code: r.ruleCode, status: r.machineStatus, act: r.actualValue })),
    issues: ctx.issues.map((i) => ({ id: i.issueId, st: i.status, vis: i.visibility })),
    assessments: ctx.officerAssessments,
  });

  return crypto.createHash("sha256").update(content).digest("hex");
}
