/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import crypto from "crypto";
import type {
  SmartCheckReportData,
  ReportType,
  ReportReadinessResult,
  ReportFreshnessResult,
  ReportClassification,
} from "../../types/reports.ts";
import type { Application } from "../../types/application.ts";
import type { SmartCheckRecord, RuleEvaluation, CategorySummary } from "../../types/rules.ts";
import type { SmartCheckIssue } from "../../types/issues.ts";
import type { VerifiedComment } from "../../types/comments.ts";
import type { DocumentMetadata } from "../../types/document.ts";
import { SMARTCHECK_REPORT_TEMPLATE_VERSION } from "./templates/smartCheckReportHtml.ts";

/**
 * Builds full raw report data before privacy filtering
 */
export async function buildReportData(
  applicationId: string,
  reportType: ReportType,
  customDb?: Firestore,
  overrides?: { generatedBy?: string; classification?: ReportClassification }
): Promise<SmartCheckReportData> {
  const db = customDb || getAdminDb();

  // 1. Application Base
  const appSnap = await db.collection("applications").doc(applicationId).get();
  if (!appSnap.exists) {
    throw new Error(`Permohonan dengan ID ${applicationId} tidak dijumpai.`);
  }
  const appData = appSnap.data() as Application;

  // 2. Latest Completed SmartCheck
  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (scSnap.empty) {
    throw new Error("Rekod SmartCheck tidak dijumpai bagi permohonan ini.");
  }
  const scData = scSnap.docs[0].data() as SmartCheckRecord;

  // 3. SmartCheck Results
  const resultsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${scData.smartCheckId}/results`)
    .get();
  const rawResults = resultsSnap.docs.map((d) => d.data() as RuleEvaluation);

  // 4. Officer Assessments for Results
  const assessmentsSnap = await db
    .collection(`applications/${applicationId}/smartChecks/${scData.smartCheckId}/assessments`)
    .get();
  const assessmentsMap = new Map<string, any>();
  assessmentsSnap.docs.forEach((d) => {
    const aData = d.data();
    assessmentsMap.set(aData.resultId, aData);
  });

  // 5. Issues
  const issuesSnap = await db.collection(`applications/${applicationId}/issues`).get();
  const rawIssues = issuesSnap.docs.map((d) => d.data() as SmartCheckIssue);

  // 6. Latest Verified Comment
  const commentSnap = await db
    .collection(`applications/${applicationId}/verifiedComments`)
    .where("status", "==", "VERIFIED")
    .orderBy("version", "desc")
    .limit(1)
    .get();
  const rawVerifiedComment = commentSnap.empty ? null : (commentSnap.docs[0].data() as VerifiedComment);

  // 7. Documents
  const docsSnap = await db.collection(`applications/${applicationId}/documents`).get();
  const rawDocs = docsSnap.docs.map((d) => d.data() as DocumentMetadata);

  // 8. Audit Logs Summary
  const auditSnap = await db
    .collection("auditLogs")
    .where("applicationId", "==", applicationId)
    .orderBy("timestamp", "desc")
    .limit(20)
    .get();
  const keyEvents = auditSnap.docs.map((d) => {
    const data = d.data();
    let tsStr = new Date().toISOString();
    if (data.timestamp) {
      try {
        const rawDate = typeof data.timestamp?.toDate === "function" ? data.timestamp.toDate() : new Date(data.timestamp);
        if (!isNaN(rawDate.getTime())) {
          tsStr = rawDate.toISOString();
        }
      } catch {
        tsStr = new Date().toISOString();
      }
    }
    return {
      eventType: data.eventType || "EVENT",
      actorRole: data.actorRole || "SYSTEM",
      timestamp: tsStr,
      description: data.metadata?.reason || data.eventType,
    };
  });

  const now = new Date().toISOString();
  const classification: ReportClassification =
    overrides?.classification ||
    (reportType === "SMARTCHECK_APPLICANT"
      ? "APPLICANT"
      : reportType === "SMARTCHECK_AUDIT_PACKAGE"
      ? "AUDIT"
      : "INTERNAL");

  const reportId = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const siteAreaSqm = Number((appData.siteInfo as any)?.siteAreaSqm || appData.siteInfo?.siteArea?.siteAreaSqm || appData.siteAreaSqm || 0);

  // Compute category summaries
  const categoryMap = new Map<string, { total: number; compliant: number; nonCompliant: number; review: number }>();
  for (const r of rawResults) {
    const cat = r.category || "GENERAL";
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { total: 0, compliant: 0, nonCompliant: 0, review: 0 });
    }
    const entry = categoryMap.get(cat)!;
    entry.total++;
    if (r.status === "COMPLIANT") entry.compliant++;
    else if (r.status === "NON_COMPLIANT") entry.nonCompliant++;
    else entry.review++;
  }

  const formatCategoryName = (c: string) => c.replace(/_/g, " ");

  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries()).map(([cat, counts]) => {
    let status: any = "PASS";
    if (counts.nonCompliant > 0) status = "FAIL";
    else if (counts.review > 0) status = "REVIEW_REQUIRED";
    return {
      category: cat as any,
      categoryName: formatCategoryName(cat),
      status,
      totalRules: counts.total,
      compliantCount: counts.compliant,
      nonCompliantCount: counts.nonCompliant,
      requiresReviewCount: counts.review,
      insufficientDataCount: 0,
      notApplicableCount: 0,
      errorCount: 0,
    };
  });

  // Assemble full report object
  const reportData: SmartCheckReportData = {
    reportMetadata: {
      reportId,
      reportType,
      reportVersion: 1,
      applicationId,
      applicationNo: appData.applicationNo || applicationId,
      smartCheckId: scData.smartCheckId,
      verifiedCommentId: rawVerifiedComment?.commentId || null,
      generatedAt: now,
      generatedBy: overrides?.generatedBy || "SYSTEM",
      systemVersion: "1.0.0",
      templateVersion: SMARTCHECK_REPORT_TEMPLATE_VERSION,
      language: "ms-MY",
      classification,
    },
    application: {
      applicationId,
      applicationNo: appData.applicationNo || applicationId,
      projectTitle: appData.projectInfo?.projectName || appData.title || "Projek Kebenaran Merancang",
      applicationType: appData.applicationType || "Kebenaran Merancang",
      category: appData.planningApplicationCategory || "PERDAGANGAN",
      developmentType: appData.developmentType || appData.projectInfo?.developmentType || "HOTEL",
      submittedAt: appData.submittedAt ? String(appData.submittedAt) : null,
      status: appData.status || "SUBMITTED",
      version: appData.currentVersion || 1,
    },
    applicant: {
      applicantName: appData.applicantInfo?.applicantName || "Pemohon",
      companyName: appData.applicantInfo?.companyName || null,
      email: appData.applicantInfo?.email || null,
      phone: appData.applicantInfo?.phone || null,
    },
    consultant: appData.consultantInfo
      ? {
          principalSubmittingPerson: (appData.consultantInfo as any)?.name || (appData.consultantInfo as any)?.consultantName || null,
          consultantCompany: appData.consultantInfo.consultantCompany || null,
          registrationNo: appData.consultantInfo.professionalRegistrationNo || null,
        }
      : null,
    site: {
      mukim: appData.siteInfo?.mukim || appData.mukim || "Kuah",
      district: appData.siteInfo?.district || appData.district || "Langkawi",
      state: appData.siteInfo?.state || appData.state || "Kedah",
      lotNumbers: (appData.siteInfo?.lots || []).map((l) => l.lotNumber),
      siteAreaSqm,
      isOfficerVerified: Boolean((appData.siteInfo as any)?.isOfficerVerified),
    },
    documents: rawDocs.map((d) => ({
      documentId: d.documentId,
      documentType: d.documentType,
      title: (d as any).title || d.documentType,
      version: d.version,
      fileName: d.fileName,
      uploadedAt: String(d.uploadedAt),
      status: d.status,
      checksum: (d as any).storageMetadata?.checksum || null,
    })),
    spatialSummary: {
      lotNumbers: (appData.siteInfo?.lots || []).map((l) => l.lotNumber),
      mukim: appData.siteInfo?.mukim || "Kuah",
      district: appData.siteInfo?.district || "Langkawi",
      state: "Kedah",
      gisSiteAreaSqm: siteAreaSqm,
      lcpSiteAreaSqm: siteAreaSqm,
      differencePercent: 0,
      siteVerificationStatus: (appData.siteInfo as any)?.isOfficerVerified ? "DISAHKAN" : "BELUM DISAHKAN",
      verifiedBy: (appData.siteInfo as any)?.verifiedBy || null,
      verifiedAt: (appData.siteInfo as any)?.verifiedAt ? String((appData.siteInfo as any).verifiedAt) : null,
      rtdDatasetName: "Rancangan Tempatan Langkawi 2030 (Pengubahan)",
      rtdDatasetVersion: "RTD-2030-v1",
      primaryZoneCode: "P-01",
      primaryZoneName: "Pusat Bandar & Perdagangan",
      primaryZonePercent: 100,
      additionalZones: [],
    },
    smartCheckSummary: {
      smartCheckId: scData.smartCheckId,
      overallStatus: scData.overallStatus,
      totalRulesEvaluated: scData.totalRulesEvaluated,
      compliantCount: scData.compliantCount,
      nonCompliantCount: scData.nonCompliantCount,
      requiresReviewCount: scData.requiresReviewCount,
      insufficientDataCount: scData.insufficientDataCount,
      evaluatedAt: String(scData.completedAt || scData.startedAt || now),
    },
    categorySummaries,
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
      unit: r.unit ?? null,
      sourceClause: r.ruleEvidence?.sourceClause || "Klausa Piawai",
      sourcePage: r.ruleEvidence?.sourcePage || null,
      calculationTrace: r.calculation?.steps || null,
      officerAssessment: assessmentsMap.get((r as any).resultId || r.ruleId) || null,
      inputEvidence: r.inputEvidence || [],
    })),
    issues: rawIssues.map((iss) => ({
      issueId: iss.issueId,
      ruleCode: iss.ruleCode || null,
      title: iss.title,
      issueType: iss.issueType,
      severity: iss.severity,
      status: iss.status,
      visibility: iss.visibility,
      description: iss.description,
      requiredAction: (iss as any).requiredAction || null,
      resolutionNote: iss.resolutionNote || null,
      internalOfficerNotes: (iss as any).internalNotes || [],
    })),
    verifiedComment: rawVerifiedComment
      ? {
          commentId: rawVerifiedComment.commentId,
          version: rawVerifiedComment.version,
          status: rawVerifiedComment.status,
          finalText: rawVerifiedComment.finalText,
          structuredSections: rawVerifiedComment.structuredSections || null,
          verifiedBy: rawVerifiedComment.verifiedBy,
          verifiedAt: String(rawVerifiedComment.verifiedAt),
          checksum: rawVerifiedComment.checksum,
        }
      : null,
    sourceVersions: {
      lcpVersion: scData.lcpDocumentVersion,
      siteVersion: scData.siteVersion,
      smartCheckId: scData.smartCheckId,
      ruleEngineVersion: scData.engineVersion || "1.0.0",
      ruleSetVersions: scData.ruleSetSnapshots?.map((s) => s.version) || ["RS-MPLBP-2026-V1"],
      gisDatasetVersions: ["RTD-2030-v1", "LOT-KADASTER-2026"],
      promptVersion: "1.0.0",
      templateVersion: SMARTCHECK_REPORT_TEMPLATE_VERSION,
    },
    verification: {
      siteVerifiedBy: (appData.siteInfo as any)?.verifiedBy || null,
      siteVerifiedAt: (appData.siteInfo as any)?.verifiedAt ? String((appData.siteInfo as any).verifiedAt) : null,
      lcpFactsConfirmedBy: null,
      commentVerifiedBy: rawVerifiedComment?.verifiedBy || null,
      commentVerifiedAt: rawVerifiedComment?.verifiedAt ? String(rawVerifiedComment.verifiedAt) : null,
    },
    auditSummary: {
      totalEvents: auditSnap.size,
      keyEvents,
    },
  };

  return filterReportDataByType(reportData, reportType);
}

/**
 * Strict Privacy & Information Filtering before rendering
 */
export function filterReportDataByType(
  data: SmartCheckReportData,
  reportType: ReportType
): SmartCheckReportData {
  if (reportType === "SMARTCHECK_APPLICANT") {
    return {
      ...data,
      reportMetadata: {
        ...data.reportMetadata,
        classification: "APPLICANT",
      },
      applicant: {
        applicantName: data.applicant.applicantName,
        companyName: data.applicant.companyName,
        email: null, // PII stripped
        phone: null, // PII stripped
      },
      // Filter issues: Only APPLICANT_VISIBLE, strip internal notes
      issues: data.issues
        .filter((iss) => iss.visibility === "APPLICANT_VISIBLE")
        .map((iss) => ({
          ...iss,
          internalOfficerNotes: [], // Strictly stripped
        })),
      // Filter results: Strip officer internal disagreement notes and traces
      results: data.results.map((r) => ({
        ...r,
        officerAssessment: null, // Internal assessments stripped from applicant view
        calculationTrace: null,
      })),
      auditSummary: undefined, // Audit timeline omitted from applicant report
    };
  }

  if (reportType === "SMARTCHECK_AUDIT_PACKAGE") {
    return {
      ...data,
      reportMetadata: {
        ...data.reportMetadata,
        classification: "AUDIT",
      },
    };
  }

  // SMARTCHECK_INTERNAL (Default)
  return data;
}

/**
 * Generates a deterministic SHA-256 source fingerprint across all report inputs
 */
export function computeReportSourceFingerprint(data: SmartCheckReportData): string {
  const parts = [
    data.application.applicationId,
    String(data.application.version),
    String(data.sourceVersions.lcpVersion),
    String(data.sourceVersions.siteVersion),
    data.sourceVersions.smartCheckId,
    data.sourceVersions.ruleEngineVersion,
    data.sourceVersions.ruleSetVersions.sort().join(","),
    data.sourceVersions.gisDatasetVersions.sort().join(","),
    data.sourceVersions.templateVersion,
    data.verifiedComment?.commentId || "NO_COMMENT",
    data.verifiedComment?.checksum || "NO_CHECKSUM",
    data.smartCheckSummary.overallStatus,
    ...data.results.map((r) => `${r.ruleCode}:${r.machineStatus}:${String(r.actualValue)}`).sort(),
    ...data.issues.map((i) => `${i.issueId}:${i.status}:${i.visibility}`).sort(),
  ];

  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

/**
 * Checks report freshness against live Firestore application state
 */
export async function getReportFreshness(
  applicationId: string,
  reportId: string,
  customDb?: Firestore
): Promise<ReportFreshnessResult> {
  const db = customDb || getAdminDb();
  const repSnap = await db.collection(`applications/${applicationId}/reports`).doc(reportId).get();

  if (!repSnap.exists) {
    return {
      freshness: "CURRENT",
      isStale: false,
      message: "Laporan tidak dijumpai.",
      reasons: [],
      currentFingerprint: "",
      reportFingerprint: "",
    };
  }

  const repData = repSnap.data();
  const currentData = await buildReportData(applicationId, repData?.reportType || "SMARTCHECK_INTERNAL", db);
  const currentFingerprint = computeReportSourceFingerprint(currentData);
  const reportFingerprint = repData?.sourceFingerprint || "";

  const isStale = currentFingerprint !== reportFingerprint;
  const reasons: string[] = [];

  if (isStale) {
    if (currentData.sourceVersions.smartCheckId !== repData?.smartCheckId) {
      reasons.push("Terdapat larian SmartCheck baharu yang telah dilaksanakan.");
    }
    if (currentData.verifiedComment?.commentId !== repData?.verifiedCommentId) {
      reasons.push("Ulasan pegawai yang disahkan telah dikemas kini.");
    }
    if (reasons.length === 0) {
      reasons.push("Data sumber permohonan atau isu telah berubah.");
    }
  }

  return {
    freshness: isStale ? "STALE_SMARTCHECK_CHANGED" : "CURRENT",
    isStale,
    message: isStale ? "Laporan ini bukan berdasarkan data semasa." : "Laporan adalah terkini.",
    reasons,
    currentFingerprint,
    reportFingerprint,
  };
}

/**
 * Evaluates readiness before generating report
 */
export async function getReportReadiness(
  applicationId: string,
  reportType: ReportType,
  customDb?: Firestore
): Promise<ReportReadinessResult> {
  const db = customDb || getAdminDb();

  const scSnap = await db
    .collection(`applications/${applicationId}/smartChecks`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const smartCheckReady = !scSnap.empty;

  const verCommentSnap = await db
    .collection(`applications/${applicationId}/verifiedComments`)
    .where("status", "==", "VERIFIED")
    .limit(1)
    .get();

  const verifiedCommentReady = !verCommentSnap.empty;

  const appSnap = await db.collection("applications").doc(applicationId).get();
  const appData = appSnap.exists ? (appSnap.data() as Application) : null;
  const siteReady = Boolean(appData?.siteInfo);

  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (!smartCheckReady) {
    blockingIssues.push("Pra-semakan SmartCheck belum dilaksanakan.");
  }

  if (reportType === "SMARTCHECK_APPLICANT") {
    if (!verifiedCommentReady) {
      blockingIssues.push("Laporan pemohon memerlukan Ulasan OSC yang telah disahkan oleh Pegawai.");
    }
  } else {
    if (!verifiedCommentReady) {
      warnings.push("Ulasan OSC belum disahkan. Laporan dalaman akan dijana tanpa ulasan rasmi.");
    }
  }

  const ready = blockingIssues.length === 0;

  return {
    ready,
    smartCheckReady,
    verifiedCommentReady,
    siteReady,
    sourceReady: true,
    publicationReady: ready && verifiedCommentReady,
    blockingIssues,
    warnings,
  };
}
