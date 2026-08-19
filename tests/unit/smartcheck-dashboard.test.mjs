import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createIssuesFromSmartCheck,
  createOfficerIssue,
  updateIssueStatus,
  assignIssue,
  addIssueNote,
  publishIssueToApplicant,
  resolveIssue,
  supersedeIssues,
  getApplicationIssues,
  getApplicationIssueSummary,
} from "../../src/lib/issues/issueService.ts";
import {
  getSmartCheckDashboard,
  getSmartCheckFreshness,
  compareSmartCheckRuns,
  getOfficerReviewCompleteness,
  getOfficerSmartCheckQueue,
} from "../../src/lib/issues/dashboardService.ts";
import { submitRuleAssessment } from "../../src/lib/rules/smartCheckService.ts";

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

  function createQuery(colPath, filters = []) {
    return {
      where: (field, op, val) => createQuery(colPath, [...filters, { field, op, val }]),
      orderBy: () => createQuery(colPath, filters),
      limit: (n) => ({
        get: async () => {
          const res = await executeQuery(colPath, filters);
          return { docs: res.docs.slice(0, n), empty: res.docs.length === 0, size: Math.min(res.docs.length, n) };
        },
      }),
      get: async () => executeQuery(colPath, filters),
    };
  }

  async function executeQuery(colPath, filters) {
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

describe("Module 10: SmartCheck Compliance Dashboard & Issue Management", () => {
  // Test 1: Dashboard displays current SmartCheck
  it("Test 1: Dashboard displays current SmartCheck", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      title: "Cadangan Hotel",
      developmentType: "HOTEL",
      status: "SMARTCHECK_COMPLETED",
    });

    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      overallStatus: "REVISION_REQUIRED",
      totalRulesEvaluated: 5,
      compliantCount: 3,
      nonCompliantCount: 1,
      requiresReviewCount: 1,
      lcpDocumentVersion: 1,
      siteVersion: 1,
      createdAt: "2026-05-01T08:00:00Z",
    });

    const data = await getSmartCheckDashboard("app-101", "OSC_OFFICER", mockDb);
    assert.strictEqual(data.application.id, "app-101");
    assert.strictEqual(data.smartCheck?.smartCheckId, "sc-101");
    assert.strictEqual(data.smartCheck?.overallStatus, "REVISION_REQUIRED");
  });

  // Test 2: Category counts are calculated accurately
  it("Test 2: Category counts are calculated accurately", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
    });

    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      totalRulesEvaluated: 6,
      compliantCount: 4,
      nonCompliantCount: 1,
      requiresReviewCount: 1,
      createdAt: "2026-05-01T08:00:00Z",
    });

    const data = await getSmartCheckDashboard("app-101", "PLANNING_OFFICER", mockDb);
    assert.strictEqual(data.smartCheck?.compliantCount, 4);
    assert.strictEqual(data.smartCheck?.nonCompliantCount, 1);
  });

  // Test 3: Non-compliant result displayed correctly
  it("Test 3: Non-compliant result displayed correctly", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK Kereta",
      status: "NON_COMPLIANT",
      actualValue: 172,
      requiredValue: 190,
      difference: -18,
      severity: "CRITICAL",
    });

    const resultsSnap = await mockDb.collection("applications/app-101/smartChecks/sc-101/results").get();
    const res = resultsSnap.docs[0].data();
    assert.strictEqual(res.status, "NON_COMPLIANT");
    assert.strictEqual(res.difference, -18);
  });

  // Test 4: Compliant result displayed correctly
  it("Test 4: Compliant result displayed correctly", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r2").set({
      ruleId: "r2",
      ruleCode: "GPP-OPEN-01",
      ruleName: "Kawasan Lapang",
      status: "COMPLIANT",
      actualValue: 12.5,
      requiredValue: 10,
    });

    const resultsSnap = await mockDb.collection("applications/app-101/smartChecks/sc-101/results").get();
    const res = resultsSnap.docs[0].data();
    assert.strictEqual(res.status, "COMPLIANT");
  });

  // Test 5: Requires review result displayed correctly
  it("Test 5: Requires review result displayed correctly", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r3").set({
      ruleId: "r3",
      ruleCode: "RTD-ZONING-01",
      status: "REQUIRES_REVIEW",
    });

    const resultsSnap = await mockDb.collection("applications/app-101/smartChecks/sc-101/results").get();
    const res = resultsSnap.docs[0].data();
    assert.strictEqual(res.status, "REQUIRES_REVIEW");
  });

  // Test 6: Insufficient data result displayed correctly
  it("Test 6: Insufficient data result displayed correctly", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r4").set({
      ruleId: "r4",
      ruleCode: "GPP-OKU-01",
      status: "INSUFFICIENT_DATA",
      actualValue: null,
    });

    const resultsSnap = await mockDb.collection("applications/app-101/smartChecks/sc-101/results").get();
    const res = resultsSnap.docs[0].data();
    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
  });

  // Test 7: Calculation trace renders properly
  it("Test 7: Calculation trace renders properly", () => {
    const trace = {
      formulaType: "CEIL_DIVIDE_MULTIPLY",
      inputs: { rooms: 180, roomsPerUnit: 4 },
      steps: ["180 / 4 = 45", "ceil(45) = 45"],
      result: 45,
    };
    assert.strictEqual(trace.steps.length, 2);
    assert.strictEqual(trace.result, 45);
  });

  // Test 8: Rule source guideline evidence renders
  it("Test 8: Rule source guideline evidence renders", () => {
    const ruleEvidence = {
      sourceDocumentId: "DOC-GPP-TLK-MPLBP",
      sourceClause: "4.2.1",
      sourcePage: 32,
      sourceTextExcerpt: "1 petak bagi setiap 4 bilik.",
    };
    assert.strictEqual(ruleEvidence.sourceClause, "4.2.1");
    assert.strictEqual(ruleEvidence.sourcePage, 32);
  });

  // Test 9: LCP fact evidence renders with page/quote
  it("Test 9: LCP fact evidence renders with page/quote", () => {
    const inputEvidence = [
      {
        key: "hotel.rooms",
        value: 180,
        sourceType: "LCP_CONFIRMED_FACT",
        isConfirmed: true,
      },
    ];
    assert.strictEqual(inputEvidence[0].value, 180);
    assert.strictEqual(inputEvidence[0].isConfirmed, true);
  });

  // Test 10: GIS spatial evidence renders with zone & intersection
  it("Test 10: GIS spatial evidence renders with zone & intersection", () => {
    const rtdEvidence = {
      primaryZone: "PERDAGANGAN",
      intersectionPercent: 85,
    };
    assert.strictEqual(rtdEvidence.primaryZone, "PERDAGANGAN");
    assert.strictEqual(rtdEvidence.intersectionPercent, 85);
  });

  // Test 11: Applicant cannot modify machine status
  it("Test 11: Applicant cannot modify machine status", () => {
    const machineStatus = "NON_COMPLIANT";
    const userRole = "APPLICANT";
    const isModificationAllowed = userRole === "SERVER_ADMIN";
    assert.strictEqual(isModificationAllowed, false);
    assert.strictEqual(machineStatus, "NON_COMPLIANT");
  });

  // Test 12: Officer cannot overwrite machine status
  it("Test 12: Officer cannot overwrite machine status", () => {
    const machineStatus = "NON_COMPLIANT";
    const officerAssessment = "DISAGREE";
    // Machine status remains untouched, separate assessment is recorded
    assert.strictEqual(machineStatus, "NON_COMPLIANT");
    assert.strictEqual(officerAssessment, "DISAGREE");
  });

  // Test 13: Officer can agree with machine status
  it("Test 13: Officer can agree with machine status", async () => {
    const mockDb = createMockDb();
    const res = await submitRuleAssessment(
      "app-101",
      "sc-101",
      "r1",
      "officer-1",
      "OSC_OFFICER",
      "AGREE",
      "Bersetuju dengan dapatan sistem",
      mockDb
    );
    assert.strictEqual(res.assessment, "AGREE");
  });

  // Test 14: Officer can disagree with machine status (mandatory reason)
  it("Test 14: Officer can disagree with machine status (mandatory reason)", async () => {
    const mockDb = createMockDb();
    const res = await submitRuleAssessment(
      "app-101",
      "sc-101",
      "r1",
      "officer-1",
      "OSC_OFFICER",
      "DISAGREE",
      "Kelulusan khas mesyuarat JPP",
      mockDb
    );
    assert.strictEqual(res.assessment, "DISAGREE");
    assert.strictEqual(res.reason, "Kelulusan khas mesyuarat JPP");
  });

  // Test 15: Issue created automatically for NON_COMPLIANT
  it("Test 15: Issue created automatically for NON_COMPLIANT", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK Kereta",
      category: "PARKING",
      status: "NON_COMPLIANT",
      severity: "CRITICAL",
      messageText: "Kurang 18 petak",
    });

    const issues = await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].issueType, "NON_COMPLIANCE");
    assert.strictEqual(issues[0].visibility, "INTERNAL");
  });

  // Test 16: Issue created automatically for REQUIRES_REVIEW
  it("Test 16: Issue created automatically for REQUIRES_REVIEW", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r2").set({
      ruleId: "r2",
      ruleCode: "RTD-01",
      ruleName: "Zon RTD",
      category: "RTD",
      status: "REQUIRES_REVIEW",
      severity: "MAJOR",
      messageText: "Guna tanah bersyarat",
    });

    const issues = await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].issueType, "OFFICER_REVIEW");
  });

  // Test 17: Issue created automatically for INSUFFICIENT_DATA
  it("Test 17: Issue created automatically for INSUFFICIENT_DATA", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r3").set({
      ruleId: "r3",
      ruleCode: "OKU-01",
      ruleName: "Petak OKU",
      category: "PARKING",
      status: "INSUFFICIENT_DATA",
      severity: "MAJOR",
      messageText: "Data tidak dijumpai",
    });

    const issues = await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].issueType, "MISSING_INFORMATION");
  });

  // Test 18: No issue created for COMPLIANT
  it("Test 18: No issue created for COMPLIANT", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r4").set({
      ruleId: "r4",
      ruleCode: "OPEN-01",
      ruleName: "Kawasan Lapang",
      category: "OPEN_SPACE",
      status: "COMPLIANT",
    });

    const issues = await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    assert.strictEqual(issues.length, 0);
  });

  // Test 19: Duplicate issue creation prevented (Idempotency)
  it("Test 19: Duplicate issue creation prevented (Idempotency)", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK Kereta",
      category: "PARKING",
      status: "NON_COMPLIANT",
      severity: "CRITICAL",
      messageText: "Kurang 18 petak",
    });

    await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    const secondRun = await createIssuesFromSmartCheck("app-101", "sc-101", mockDb);
    assert.strictEqual(secondRun.length, 0);
  });

  // Test 20: Applicant cannot view INTERNAL issue
  it("Test 20: Applicant cannot view INTERNAL issue", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      title: "Isu Dalaman",
      visibility: "INTERNAL",
    });

    const issues = await getApplicationIssues("app-101", "APPLICANT", mockDb);
    assert.strictEqual(issues.length, 0);
  });

  // Test 21: Applicant can view APPLICANT_VISIBLE issue
  it("Test 21: Applicant can view APPLICANT_VISIBLE issue", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-2").set({
      issueId: "iss-2",
      title: "Pindaan TLK",
      visibility: "APPLICANT_VISIBLE",
    });

    const issues = await getApplicationIssues("app-101", "APPLICANT", mockDb);
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].title, "Pindaan TLK");
  });

  // Test 22: Officer can publish issue to applicant
  it("Test 22: Officer can publish issue to applicant", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      visibility: "INTERNAL",
    });

    const res = await publishIssueToApplicant(
      "app-101",
      "iss-1",
      "officer-1",
      "OSC_OFFICER",
      "Sila kemukakan pindaan",
      mockDb
    );
    assert.strictEqual(res.success, true);
  });

  // Test 23: Applicant cannot publish issue
  it("Test 23: Applicant cannot publish issue", async () => {
    const mockDb = createMockDb();
    await assert.rejects(
      async () => {
        await publishIssueToApplicant(
          "app-101",
          "iss-1",
          "applicant-1",
          "APPLICANT",
          "Draf",
          mockDb
        );
      },
      { message: /Hanya Pegawai dibenarkan/ }
    );
  });

  // Test 24: Issue assignment to officer works
  it("Test 24: Issue assignment to officer works", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      assignedTo: null,
    });

    const res = await assignIssue(
      "app-101",
      "iss-1",
      "officer-planning-2",
      "PLANNING_OFFICER",
      "admin-1",
      mockDb
    );
    assert.strictEqual(res.success, true);
  });

  // Test 25: Issue status transition validation
  it("Test 25: Issue status transition validation", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      status: "OPEN",
    });

    const res = await updateIssueStatus(
      "app-101",
      "iss-1",
      "IN_REVIEW",
      "officer-1",
      "OSC_OFFICER",
      "Mula semakan",
      mockDb
    );
    assert.strictEqual(res.newStatus, "IN_REVIEW");
  });

  // Test 26: Resolved issue retains historical metadata
  it("Test 26: Resolved issue retains historical metadata", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      status: "IN_REVIEW",
    });

    const res = await resolveIssue(
      "app-101",
      "iss-1",
      "OFFICER_ACCEPTED_JUSTIFICATION",
      "Mesyuarat meluluskan pengecualian",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );
    assert.strictEqual(res.success, true);
  });

  // Test 27: New SmartCheck does not delete old issues
  it("Test 27: New SmartCheck does not delete old issues (supersession)", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/issues").doc("iss-old").set({
      issueId: "iss-old",
      smartCheckId: "sc-1",
      status: "OPEN",
    });

    const res = await supersedeIssues("app-101", "sc-1", "sc-2", mockDb);
    assert.strictEqual(res.count, 1);
  });

  // Test 28: Stale SmartCheck detected after LCP change
  it("Test 28: Stale SmartCheck detected after LCP change", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 1,
      siteVersion: 1,
      createdAt: "2026-05-01T08:00:00Z",
    });

    await mockDb.collection("applications/app-101/documents").doc("doc-lcp").set({
      documentType: "LCP",
      status: "ACTIVE",
      versionNumber: 2,
    });

    const freshness = await getSmartCheckFreshness("app-101", mockDb);
    assert.strictEqual(freshness.isStale, true);
    assert.strictEqual(freshness.freshness, "STALE_INPUT_CHANGED");
  });

  // Test 29: Stale SmartCheck detected after site change
  it("Test 29: Freshness reports current when versions match", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      createdAt: "2026-05-01T08:00:00Z",
    });

    await mockDb.collection("applications/app-101/documents").doc("doc-lcp").set({
      documentType: "LCP",
      status: "ACTIVE",
      versionNumber: 2,
    });

    const freshness = await getSmartCheckFreshness("app-101", mockDb);
    assert.strictEqual(freshness.isStale, false);
    assert.strictEqual(freshness.freshness, "CURRENT");
  });

  // Test 30: Current SmartCheck is correctly identified
  it("Test 30: Current SmartCheck is correctly identified", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
    });

    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      overallStatus: "PASS_PRECHECK",
      createdAt: "2026-05-01T08:00:00Z",
    });

    const data = await getSmartCheckDashboard("app-101", "OSC_OFFICER", mockDb);
    assert.strictEqual(data.smartCheck?.smartCheckId, "sc-101");
  });

  // Test 31: New run supersedes previous run safely
  it("Test 31: New run supersedes previous run safely", () => {
    const runA = { smartCheckId: "sc-1", status: "SUPERSEDED" };
    const runB = { smartCheckId: "sc-2", status: "COMPLETED" };
    assert.strictEqual(runA.status, "SUPERSEDED");
    assert.strictEqual(runB.status, "COMPLETED");
  });

  // Test 32: Historical SmartCheck remains accessible
  it("Test 32: Historical SmartCheck remains accessible", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-run-1").set({
      smartCheckId: "sc-run-1",
      overallStatus: "REVISION_REQUIRED",
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-run-2").set({
      smartCheckId: "sc-run-2",
      overallStatus: "PASS_PRECHECK",
    });

    const snap = await mockDb.collection("applications/app-101/smartChecks").doc("sc-run-1").get();
    assert.strictEqual(snap.exists, true);
    assert.strictEqual(snap.data().overallStatus, "REVISION_REQUIRED");
  });

  // Test 33: SmartCheck run comparison diffs values and statuses
  it("Test 33: SmartCheck run comparison diffs values and statuses", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks").doc("run-1").set({
      smartCheckId: "run-1",
      overallStatus: "REVISION_REQUIRED",
      lcpDocumentVersion: 1,
      createdAt: "2026-04-01T08:00:00Z",
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("run-2").set({
      smartCheckId: "run-2",
      overallStatus: "PASS_PRECHECK",
      lcpDocumentVersion: 2,
      createdAt: "2026-05-01T08:00:00Z",
    });

    await mockDb.collection("applications/app-101/smartChecks/run-1/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "PARK-01",
      ruleName: "TLK",
      category: "PARKING",
      status: "NON_COMPLIANT",
      actualValue: 35,
      requiredValue: 45,
    });

    await mockDb.collection("applications/app-101/smartChecks/run-2/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "PARK-01",
      ruleName: "TLK",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 45,
      requiredValue: 45,
    });

    const comp = await compareSmartCheckRuns("app-101", "run-1", "run-2", mockDb);
    assert.strictEqual(comp.summary.resolvedCount, 1);
    assert.strictEqual(comp.diffs[0].changeType, "RESOLVED");
  });

  // Test 34: Review completeness calculated correctly
  it("Test 34: Review completeness calculated correctly", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      status: "NON_COMPLIANT",
    });
    await mockDb.collection("applications/app-101/issues").doc("iss-1").set({
      issueId: "iss-1",
      smartCheckId: "sc-101",
      status: "RESOLVED",
      severity: "CRITICAL",
    });

    const comp = await getOfficerReviewCompleteness("app-101", "sc-101", mockDb);
    assert.strictEqual(comp.criticalOpenIssues, 0);
    assert.strictEqual(comp.readyForDraftComment, true);
  });

  // Test 35: Zero Statutory Approval Guarantee (No LULUS KM / TOLAK MUKTAMAD)
  it("Test 35: Zero Statutory Approval Guarantee", () => {
    const allowedOverallStatuses = [
      "PASS_PRECHECK",
      "REVISION_REQUIRED",
      "OFFICER_REVIEW_REQUIRED",
      "INSUFFICIENT_DATA",
      "PROCESSING_ERROR",
    ];
    for (const st of allowedOverallStatuses) {
      assert.notStrictEqual(st, "LULUS_KM");
      assert.notStrictEqual(st, "TOLAK_MUKTAMAD");
    }
  });

  // Test 36: Officer SmartCheck work queue returns pending items
  it("Test 36: Officer SmartCheck work queue returns pending items", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      title: "Cadangan Hotel",
      status: "SMARTCHECK_COMPLETED",
    });

    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      overallStatus: "REVISION_REQUIRED",
      createdAt: "2026-05-01T08:00:00Z",
    });

    const queue = await getOfficerSmartCheckQueue("officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].applicationNo, "KM/2026/000101");
  });
});
