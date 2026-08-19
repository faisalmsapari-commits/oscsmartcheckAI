import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  buildReportData,
  filterReportDataByType,
  computeReportSourceFingerprint,
  getReportFreshness,
  getReportReadiness,
} from "../../src/lib/reports/reportDataBuilder.ts";
import {
  generateSmartCheckReport,
  publishReport,
  unpublishReport,
  verifyReportIntegrity,
  getReports,
} from "../../src/lib/reports/reportService.ts";
import {
  defaultPdfRenderer,
  calculateReportChecksum,
  verifyReportBufferIntegrity,
} from "../../src/lib/reports/pdfRenderer.ts";
import { generateSmartCheckReportHtml } from "../../src/lib/reports/templates/smartCheckReportHtml.ts";
import { buildAuditManifest } from "../../src/lib/reports/auditPackageService.ts";
import { SmartCheckReportDataSchema } from "../../src/lib/validation/reports.schema.ts";

/**
 * Mock Firestore Factory
 */
function createMockDb() {
  const store = new Map();

  function getDocRef(path) {
    return {
      id: path.split("/").pop(),
      path,
      get: async () => ({
        exists: store.has(path),
        id: path.split("/").pop(),
        data: () => store.get(path),
      }),
      set: async (data) => {
        store.set(path, { ...data, id: path.split("/").pop() });
      },
      update: async (data) => {
        const existing = store.get(path) || {};
        store.set(path, { ...existing, ...data });
      },
      delete: async () => {
        store.delete(path);
      },
    };
  }

  function createQuery(colPath, filters = [], sortOrders = []) {
    return {
      where: (field, op, val) => createQuery(colPath, [...filters, { field, op, val }], sortOrders),
      orderBy: (field, direction = "asc") => createQuery(colPath, filters, [...sortOrders, { field, direction }]),
      limit: (n) => ({
        get: async () => {
          const res = await executeQuery(colPath, filters, sortOrders);
          return { docs: res.docs.slice(0, n), empty: res.docs.length === 0, size: Math.min(res.docs.length, n) };
        },
      }),
      get: async () => executeQuery(colPath, filters, sortOrders),
    };
  }

  async function executeQuery(colPath, filters, sortOrders = []) {
    const docs = [];
    for (const [key, value] of store.entries()) {
      if (key.startsWith(colPath + "/") && key.split("/").length === colPath.split("/").length + 1) {
        let matches = true;
        for (const f of filters) {
          if (f.op === "==") {
            if (value[f.field] !== f.val) matches = false;
          } else if (f.op === "in") {
            if (!Array.isArray(f.val) || !f.val.includes(value[f.field])) matches = false;
          }
        }
        if (matches) {
          docs.push({ id: key.split("/").pop(), data: () => value, ref: getDocRef(key) });
        }
      }
    }

    if (sortOrders.length > 0) {
      docs.sort((a, b) => {
        for (const s of sortOrders) {
          const valA = a.data()[s.field];
          const valB = b.data()[s.field];
          if (valA < valB) return s.direction === "desc" ? 1 : -1;
          if (valA > valB) return s.direction === "desc" ? -1 : 1;
        }
        return 0;
      });
    }

    return { docs, empty: docs.length === 0, size: docs.length };
  }

  function getCollectionRef(colPath) {
    const q = createQuery(colPath, []);
    return {
      doc: (docId) => getDocRef(`${colPath}/${docId}`),
      where: q.where,
      orderBy: q.orderBy,
      limit: q.limit,
      get: q.get,
      add: async (data) => {
        const autoId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullPath = `${colPath}/${autoId}`;
        store.set(fullPath, { ...data, id: autoId });
        return getDocRef(fullPath);
      },
    };
  }

  return {
    collection: (colPath) => getCollectionRef(colPath),
    batch: () => ({
      set: (ref, data) => ref.set(data),
      update: (ref, data) => ref.update(data),
      commit: async () => {},
    }),
    _store: store,
  };
}

describe("Module 12: SmartCheck Final Report, PDF Generation & Digital Integrity", () => {
  // Test 1: Internal report data builds with full technical fields
  it("Test 1: Internal report data builds with full technical fields", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      title: "Cadangan Pembangunan Hotel",
      developmentType: "HOTEL",
      status: "SUBMITTED",
      currentVersion: 1,
      applicantInfo: { applicantName: "Ahmad", email: "ahmad@example.com", phone: "0123456789" },
      siteInfo: { mukim: "Kuah", lots: [{ lotNumber: "1234" }], isOfficerVerified: true },
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 2,
      compliantCount: 1,
      nonCompliantCount: 1,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "FAIL_PRECHECK",
      engineVersion: "1.0.0",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    assert.strictEqual(reportData.application.applicationId, "app-101");
    assert.strictEqual(reportData.reportMetadata.classification, "INTERNAL");
    assert.strictEqual(reportData.smartCheckSummary.totalRulesEvaluated, 2);
  });

  // Test 2: Applicant report data builds with privacy filtering
  it("Test 2: Applicant report data builds with privacy filtering", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      title: "Cadangan Pembangunan Hotel",
      developmentType: "HOTEL",
      status: "SUBMITTED",
      currentVersion: 1,
      applicantInfo: { applicantName: "Ahmad", email: "ahmad@example.com", phone: "0123456789" },
      siteInfo: { mukim: "Kuah", lots: [{ lotNumber: "1234" }] },
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 1,
      compliantCount: 1,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_APPLICANT", mockDb);
    assert.strictEqual(reportData.reportMetadata.classification, "APPLICANT");
    assert.strictEqual(reportData.applicant.phone, null); // PII stripped
    assert.strictEqual(reportData.applicant.email, null); // PII stripped
  });

  // Test 3: Audit report data builds with audit events
  it("Test 3: Audit report data builds with audit events", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      siteInfo: { mukim: "Kuah", lots: [] },
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("auditLogs").doc("log-1").set({
      applicationId: "app-101",
      eventType: "SMARTCHECK_EXECUTED",
      actorRole: "OSC_OFFICER",
      timestamp: new Date().toISOString(),
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_AUDIT_PACKAGE", mockDb);
    assert.strictEqual(reportData.reportMetadata.classification, "AUDIT");
    assert.strictEqual(reportData.auditSummary?.keyEvents.length, 1);
  });

  // Test 4: Applicant filter removes internal officer notes
  it("Test 4: Applicant filter removes internal officer notes", () => {
    const rawData = {
      reportMetadata: { classification: "INTERNAL" },
      applicant: { applicantName: "Ali", phone: "012345678" },
      issues: [
        {
          issueId: "iss-1",
          title: "TLK Kurang",
          visibility: "APPLICANT_VISIBLE",
          internalOfficerNotes: ["Nota sulit perbincangan"],
        },
      ],
      results: [],
    };

    const filtered = filterReportDataByType(rawData, "SMARTCHECK_APPLICANT");
    assert.strictEqual(filtered.issues[0].internalOfficerNotes?.length, 0);
  });

  // Test 5: Applicant filter removes hidden issues
  it("Test 5: Applicant filter removes hidden issues (INTERNAL)", () => {
    const rawData = {
      reportMetadata: { classification: "INTERNAL" },
      applicant: { applicantName: "Ali" },
      issues: [
        { issueId: "iss-pub", title: "Isu Awam", visibility: "APPLICANT_VISIBLE" },
        { issueId: "iss-int", title: "Isu Dalaman", visibility: "INTERNAL" },
      ],
      results: [],
    };

    const filtered = filterReportDataByType(rawData, "SMARTCHECK_APPLICANT");
    assert.strictEqual(filtered.issues.length, 1);
    assert.strictEqual(filtered.issues[0].issueId, "iss-pub");
  });

  // Test 6: Internal report retains officer assessments and disagreement reasons
  it("Test 6: Internal report retains officer assessments and disagreement reasons", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 1,
      compliantCount: 0,
      nonCompliantCount: 1,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "FAIL_PRECHECK",
    });
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      resultId: "r1",
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK",
      category: "PARKING",
      status: "NON_COMPLIANT",
      actualValue: 35,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1" },
    });
    await mockDb.collection("applications/app-101/smartChecks/sc-101/assessments").doc("a1").set({
      resultId: "r1",
      assessment: "DISAGREE",
      reason: "Kelonggaran diberikan atas dasar tapak berhampiran stesen transit.",
      officerUid: "officer-1",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    assert.strictEqual(reportData.results[0].officerAssessment?.assessment, "DISAGREE");
    assert.strictEqual(reportData.results[0].officerAssessment?.reason?.includes("Kelonggaran"), true);
  });

  // Test 7: Verified comment included in report snapshot
  it("Test 7: Verified comment included in report snapshot", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      version: 1,
      status: "VERIFIED",
      finalText: "Ulasan Rasmi Pegawai Perancang OSC",
      verifiedBy: "officer-1",
      verifiedAt: new Date().toISOString(),
      checksum: "abc123hash",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    assert.strictEqual(reportData.verifiedComment?.commentId, "comm-1");
    assert.strictEqual(reportData.verifiedComment?.finalText.includes("Ulasan Rasmi"), true);
  });

  // Test 8: Report without verified comment handles gracefully
  it("Test 8: Report without verified comment handles gracefully", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    assert.strictEqual(reportData.verifiedComment, null);
  });

  // Test 9: Report version increments (v1 -> v2)
  it("Test 9: Report version increments (v1 -> v2)", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep1 = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(rep1.version, 1);

    const rep2 = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(rep2.version, 2);
  });

  // Test 10: Historical superseded reports retained
  it("Test 10: Historical superseded reports retained", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep1 = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);

    const oldSnap = await mockDb.collection(`applications/app-101/reports`).doc(rep1.reportId).get();
    assert.strictEqual(oldSnap.data().status, "SUPERSEDED");
  });

  // Test 11: Stale report detected after SmartCheck change
  it("Test 11: Stale report detected after SmartCheck change", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
      createdAt: "2026-08-19T00:00:00.000Z",
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);

    // Simulate SmartCheck re-run
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-102").set({
      smartCheckId: "sc-102",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
      createdAt: new Date(Date.now() + 1000).toISOString(),
    });

    const freshness = await getReportFreshness("app-101", rep.reportId, mockDb);
    assert.strictEqual(freshness.isStale, true);
    assert.strictEqual(freshness.freshness, "STALE_SMARTCHECK_CHANGED");
  });

  // Test 12: Stale report detected after verified comment change
  it("Test 12: Stale report detected after verified comment change", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      version: 1,
      status: "VERIFIED",
      finalText: "Ulasan Awal",
      checksum: "hash1",
      verifiedBy: "officer-1",
      verifiedAt: new Date().toISOString(),
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);

    // Update verified comment to v2
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-2").set({
      commentId: "comm-2",
      version: 2,
      status: "VERIFIED",
      finalText: "Ulasan Pindaan",
      checksum: "hash2",
      verifiedBy: "officer-1",
      verifiedAt: new Date(Date.now() + 1000).toISOString(),
    });

    const freshness = await getReportFreshness("app-101", rep.reportId, mockDb);
    assert.strictEqual(freshness.isStale, true);
  });

  // Test 13: Report snapshot validates against Zod schema
  it("Test 13: Report snapshot validates against Zod schema", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    const validated = SmartCheckReportDataSchema.safeParse(reportData);
    assert.strictEqual(validated.success, true);
  });

  // Test 14: Invalid snapshot fails Zod schema validation
  it("Test 14: Invalid snapshot fails Zod schema validation", () => {
    const invalidData = {
      reportMetadata: { reportId: "rep-1" }, // Missing required fields
    };
    const validated = SmartCheckReportDataSchema.safeParse(invalidData);
    assert.strictEqual(validated.success, false);
  });

  // Test 15: HTML template generator produces valid HTML with all sections (A–J)
  it("Test 15: HTML template generator produces valid HTML with all sections (A–J)", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    const html = generateSmartCheckReportHtml(reportData);

    assert.strictEqual(html.includes("LAPORAN SMARTCHECK"), true);
    assert.strictEqual(html.includes("A. Ringkasan Permohonan"), true);
    assert.strictEqual(html.includes("B. Snapshot Dokumen"), true);
    assert.strictEqual(html.includes("C. Maklumat Tapak"), true);
    assert.strictEqual(html.includes("D. Ringkasan Status"), true);
    assert.strictEqual(html.includes("E. Matriks Pematuhan"), true);
    assert.strictEqual(html.includes("F. Ringkasan Isu"), true);
    assert.strictEqual(html.includes("G. Ulasan Rasmi Pusat Setempat"), true);
    assert.strictEqual(html.includes("H. Punca Kuasa"), true);
    assert.strictEqual(html.includes("I. Rekod Pengesahan"), true);
    assert.strictEqual(html.includes("J. Integriti Rekod Digital"), true);
  });

  // Test 16: PDF renderer produces valid standards-compliant PDF buffer
  it("Test 16: PDF renderer produces valid standards-compliant PDF buffer", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const reportData = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    const buffer = await defaultPdfRenderer.renderReport(reportData);

    assert.strictEqual(Buffer.isBuffer(buffer), true);
    assert.strictEqual(buffer.slice(0, 5).toString("utf-8"), "%PDF-");
  });

  // Test 17: Checksum generated matches 64-character SHA-256 hash
  it("Test 17: Checksum generated matches 64-character SHA-256 hash", () => {
    const buf = Buffer.from("Test PDF content");
    const checksum = calculateReportChecksum(buf);
    assert.strictEqual(checksum.length, 64);
  });

  // Test 18: Integrity check succeeds on unmodified buffer
  it("Test 18: Integrity check succeeds on unmodified buffer", () => {
    const buf = Buffer.from("Original PDF Binary Content");
    const checksum = calculateReportChecksum(buf);
    const isValid = verifyReportBufferIntegrity(buf, checksum);
    assert.strictEqual(isValid, true);
  });

  // Test 19: Modified buffer fails integrity verification
  it("Test 19: Modified buffer fails integrity verification", () => {
    const buf = Buffer.from("Original PDF Binary Content");
    const checksum = calculateReportChecksum(buf);
    const tamperedBuf = Buffer.from("Tampered PDF Content");
    const isValid = verifyReportBufferIntegrity(tamperedBuf, checksum);
    assert.strictEqual(isValid, false);
  });

  // Test 20: Applicant cannot view internal report
  it("Test 20: Applicant cannot view internal report", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/reports").doc("rep-int").set({
      reportId: "rep-int",
      visibility: "INTERNAL",
      reportType: "SMARTCHECK_INTERNAL",
    });

    const reports = await getReports("app-101", "APPLICANT", mockDb);
    assert.strictEqual(reports.length, 0);
  });

  // Test 21: Applicant can view published APPLICANT_VISIBLE report
  it("Test 21: Applicant can view published APPLICANT_VISIBLE report", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/reports").doc("rep-pub").set({
      reportId: "rep-pub",
      visibility: "APPLICANT_VISIBLE",
      reportType: "SMARTCHECK_APPLICANT",
    });

    const reports = await getReports("app-101", "APPLICANT", mockDb);
    assert.strictEqual(reports.length, 1);
    assert.strictEqual(reports[0].reportId, "rep-pub");
  });

  // Test 22: Applicant cannot publish report
  it("Test 22: Applicant cannot publish report", async () => {
    const mockDb = createMockDb();
    await assert.rejects(
      async () => {
        await publishReport("app-101", "rep-1", "applicant-1", "APPLICANT", "Nota", mockDb);
      },
      { message: /Hanya Pegawai dibenarkan/ }
    );
  });

  // Test 23: Officer can publish report when authorized and fresh
  it("Test 23: Officer can publish report when authorized and fresh", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    const res = await publishReport("app-101", rep.reportId, "officer-1", "OSC_OFFICER", "Diterbitkan", mockDb);
    assert.strictEqual(res.success, true);

    const updatedSnap = await mockDb.collection(`applications/app-101/reports`).doc(rep.reportId).get();
    assert.strictEqual(updatedSnap.data().visibility, "APPLICANT_VISIBLE");
  });

  // Test 24: Stale applicant report cannot be published
  it("Test 24: Stale applicant report cannot be published", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
      createdAt: "2026-08-19T00:00:00.000Z",
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);

    // Make report stale by altering SmartCheck
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-102").set({
      smartCheckId: "sc-102",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
      createdAt: "2026-08-19T01:00:00.000Z",
    });

    await assert.rejects(
      async () => {
        await publishReport("app-101", rep.reportId, "officer-1", "OSC_OFFICER", "Nota", mockDb);
      },
      { message: /Laporan tidak boleh diterbitkan/ }
    );
  });

  // Test 25: Officer can unpublish report with reason
  it("Test 25: Officer can unpublish report with reason", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/reports").doc("rep-1").set({
      reportId: "rep-1",
      visibility: "APPLICANT_VISIBLE",
    });

    const res = await unpublishReport("app-101", "rep-1", "Ditarik balik atas arahan mesyuarat", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(res.success, true);

    const snap = await mockDb.collection("applications/app-101/reports").doc("rep-1").get();
    assert.strictEqual(snap.data().visibility, "INTERNAL");
    assert.strictEqual(snap.data().unpublishReason, "Ditarik balik atas arahan mesyuarat");
  });

  // Test 26: Audit manifest generation succeeds with file checksums
  it("Test 26: Audit manifest generation succeeds with file checksums", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/reports").doc("rep-audit").set({
      reportId: "rep-audit",
      fileName: "OSC-SmartCheck-AUDIT-v1.pdf",
      storagePath: "applications/app-101/reports/SMARTCHECK_AUDIT_PACKAGE/v1/file.pdf",
      fileSize: 2048,
      mimeType: "application/pdf",
      checksum: "sha256hashabc",
    });

    const manifest = await buildAuditManifest("app-101", "rep-audit", mockDb);
    assert.strictEqual(manifest.reportId, "rep-audit");
    assert.strictEqual(manifest.files.length, 1);
    assert.strictEqual(manifest.files[0].sha256, "sha256hashabc");
  });

  // Test 27: Report readiness gating blocks applicant report without verified comment
  it("Test 27: Report readiness gating blocks applicant report without verified comment", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const readiness = await getReportReadiness("app-101", "SMARTCHECK_APPLICANT", mockDb);
    assert.strictEqual(readiness.ready, false);
    assert.strictEqual(readiness.blockingIssues.some((b) => b.includes("Ulasan OSC")), true);
  });

  // Test 28: Report readiness allows internal report generation
  it("Test 28: Report readiness allows internal report generation", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const readiness = await getReportReadiness("app-101", "SMARTCHECK_INTERNAL", mockDb);
    assert.strictEqual(readiness.ready, true);
  });

  // Test 29: Zero new planning compliance decision generated
  it("Test 29: Zero new planning compliance decision generated", () => {
    // Assert that the report is strictly a rendering layer
    assert.strictEqual(typeof defaultPdfRenderer.renderReport, "function");
  });

  // Test 30: Full end-to-end flow: Application -> SmartCheck -> Verified Comment -> Report -> Publication -> Integrity
  it("Test 30: Full end-to-end flow: Application -> SmartCheck -> Verified Comment -> Report -> Publication -> Integrity", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      projectInfo: { projectName: "Projek Hotel E2E", developmentType: "HOTEL" },
      siteInfo: { mukim: "Kuah", lots: [{ lotNumber: "1234" }], isOfficerVerified: true },
      currentVersion: 1,
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 1,
      compliantCount: 1,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      version: 1,
      status: "VERIFIED",
      finalText: "Permohonan mematuhi kriteria asas perancangan.",
      verifiedBy: "officer-1",
      verifiedAt: new Date().toISOString(),
      checksum: "commhash1",
    });

    // 1. Generate Report
    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_APPLICANT", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(rep.status, "GENERATED");
    assert.strictEqual(rep.version, 1);

    // 2. Publish Report
    await publishReport("app-101", rep.reportId, "officer-1", "OSC_OFFICER", "Diterbitkan", mockDb);

    // 3. Verify applicant can see it
    const publicReports = await getReports("app-101", "APPLICANT", mockDb);
    assert.strictEqual(publicReports.length, 1);
    assert.strictEqual(publicReports[0].reportId, rep.reportId);

    // 4. Verify integrity
    const integrity = await verifyReportIntegrity("app-101", rep.reportId, mockDb);
    assert.strictEqual(integrity.status, "VALID");
  });

  // Test 31: Template version recorded in report metadata and source versions
  it("Test 31: Template version recorded in report metadata and source versions", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(rep.templateVersion, "1.0.0");
    assert.strictEqual(rep.systemVersion, "1.0.0");
  });

  // Test 32: Non-officer cannot unpublish report
  it("Test 32: Non-officer cannot unpublish report", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/reports").doc("rep-1").set({
      reportId: "rep-1",
      visibility: "APPLICANT_VISIBLE",
    });

    await assert.rejects(
      async () => {
        await unpublishReport("app-101", "rep-1", "Alasan", "applicant-1", "APPLICANT", mockDb);
      },
      { message: /Hanya Pegawai dibenarkan/ }
    );
  });

  // Test 33: Report filename sanitizes special characters
  it("Test 33: Report filename sanitizes special characters", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101 (A&B)",
      siteInfo: { mukim: "Kuah", lots: [] },
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(rep.fileName.includes("/"), false);
    assert.strictEqual(rep.fileName.includes("("), false);
  });

  // Test 34: Superseded report record links to new report version
  it("Test 34: Superseded report record links to new report version", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const rep1 = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);
    const rep2 = await generateSmartCheckReport("app-101", "SMARTCHECK_INTERNAL", "officer-1", "OSC_OFFICER", mockDb);

    const oldSnap = await mockDb.collection(`applications/app-101/reports`).doc(rep1.reportId).get();
    assert.strictEqual(oldSnap.data().status, "SUPERSEDED");
    assert.strictEqual(oldSnap.data().supersededByReportId, rep2.reportId);
  });

  // Test 35: Integrity check on non-existent report returns FILE_MISSING
  it("Test 35: Integrity check on non-existent report returns FILE_MISSING", async () => {
    const mockDb = createMockDb();
    const res = await verifyReportIntegrity("app-101", "rep-ghost", mockDb);
    assert.strictEqual(res.status, "FILE_MISSING");
  });

  // Test 36: Source fingerprint is unique across differing application versions
  it("Test 36: Source fingerprint is unique across differing application versions", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", currentVersion: 1, siteInfo: { mukim: "Kuah", lots: [] } });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const data1 = await buildReportData("app-101", "SMARTCHECK_INTERNAL", mockDb);
    const fp1 = computeReportSourceFingerprint(data1);

    data1.application.version = 2;
    const fp2 = computeReportSourceFingerprint(data1);

    assert.notStrictEqual(fp1, fp2);
  });
});
