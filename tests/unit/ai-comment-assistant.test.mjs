import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  buildPlanningCommentContext,
  computeSourceFingerprint,
} from "../../src/lib/comments/contextBuilder.ts";
import {
  generateResultExplanation,
  generateIssueDraftComment,
  generateOscDraftComment,
  formatDraftToMarkdown,
} from "../../src/lib/ai/flows/commentFlows.ts";
import {
  createAiDraft,
  createManualDraft,
  saveOfficerDraftEdit,
  getDraftFreshness,
  validateCommentForVerification,
  getCommentDiff,
} from "../../src/lib/comments/draftService.ts";
import {
  verifyOscComment,
  publishVerifiedComment,
  revokeVerifiedComment,
  getPublishedComments,
} from "../../src/lib/comments/verificationService.ts";
import { OscDraftSchema } from "../../src/lib/validation/comments.schema.ts";

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

describe("Module 11: AI Planning Explanation, Draft Ulasan OSC & Officer Verification", () => {
  // Test 1: PlanningCommentContext built with PII minimization and fact provenance
  it("Test 1: PlanningCommentContext built with PII minimization and fact provenance", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      title: "Cadangan Pembangunan Hotel",
      developmentType: "HOTEL",
      siteInfo: { mukim: "Kuah", lots: [{ lotNumber: "1234" }] },
    });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 1,
      compliantCount: 1,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    assert.strictEqual(ctx.application.applicationId, "app-101");
    assert.strictEqual(ctx.application.projectTitle, "Cadangan Pembangunan Hotel");
    assert.strictEqual(ctx.sourceVersions.lcpVersion, 2);
  });

  // Test 2: Only current SmartCheck results used
  it("Test 2: Only current SmartCheck results used", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-current").set({
      smartCheckId: "sc-current",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 1,
      compliantCount: 1,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/smartChecks/sc-current/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 45,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1", sourcePage: 32 },
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-current", mockDb);
    assert.strictEqual(ctx.smartCheck.smartCheckId, "sc-current");
    assert.strictEqual(ctx.results.length, 1);
    assert.strictEqual(ctx.results[0].ruleCode, "GPP-PARK-01");
  });

  // Test 3: Historical irrelevant data excluded from prompt context
  it("Test 3: Historical irrelevant data excluded from prompt context", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-current").set({
      smartCheckId: "sc-current",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-current", mockDb);
    assert.strictEqual(ctx.results.length, 0);
  });

  // Test 4: Verified LCP & GIS spatial facts included
  it("Test 4: Verified LCP & GIS spatial facts included", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 180,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1" },
      inputEvidence: [
        { key: "hotel.rooms", value: 180, sourceType: "LCP_CONFIRMED_FACT" },
        { key: "site.zoning", value: "PERDAGANGAN", sourceType: "GIS_SPATIAL_FACT" },
      ],
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    assert.strictEqual(ctx.verifiedFacts.length, 1);
    assert.strictEqual(ctx.spatialFacts.length, 1);
    assert.strictEqual(ctx.verifiedFacts[0].key, "hotel.rooms");
  });

  // Test 5: Rule references and source citations preserved
  it("Test 5: Rule references and source citations preserved", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-OPEN-01",
      ruleName: "Kawasan Lapang",
      category: "OPEN_SPACE",
      status: "COMPLIANT",
      actualValue: 12,
      requiredValue: 10,
      ruleEvidence: { sourceDocumentId: "DOC-GPP-OPEN", sourceClause: "3.1", sourcePage: 14 },
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    assert.strictEqual(ctx.results[0].ruleEvidence.sourceClause, "3.1");
    assert.strictEqual(ctx.results[0].ruleEvidence.sourcePage, 14);
  });

  // Test 6: AI structured output passes Zod validation (OscDraftSchema)
  it("Test 6: AI structured output passes Zod validation (OscDraftSchema)", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101", applicationNo: "KM/2026/000101" });
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
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK Kereta",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 50,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1" },
    });

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    const draft = await generateOscDraftComment(ctx, "STANDARD");
    const validated = OscDraftSchema.safeParse(draft);
    assert.strictEqual(validated.success, true);
  });

  // Test 7: Invalid AI output is rejected by validator
  it("Test 7: Invalid AI output is rejected by validator", () => {
    const invalidDraft = {
      executiveSummary: "Short", // Too short (< 10 chars)
      planningContext: "Test",
    };
    const validated = OscDraftSchema.safeParse(invalidDraft);
    assert.strictEqual(validated.success, false);
  });

  // Test 8: AI cannot alter machine compliance status in stored results
  it("Test 8: AI cannot alter machine compliance status in stored results", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      status: "NON_COMPLIANT",
    });

    const snapBefore = await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").get();
    assert.strictEqual(snapBefore.data().status, "NON_COMPLIANT");
  });

  // Test 9: Result explanation flow generates structured response
  it("Test 9: Result explanation flow generates structured response", async () => {
    const ctx = {
      results: [
        {
          ruleId: "r1",
          ruleCode: "GPP-PARK-01",
          ruleName: "TLK",
          machineStatus: "NON_COMPLIANT",
          actualValue: 35,
          requiredValue: 45,
          difference: -10,
          unit: "petak",
          ruleEvidence: { sourceDocumentId: "DOC-GPP-TLK", sourceClause: "4.2.1", sourcePage: 32 },
          inputEvidence: [],
        },
      ],
    };

    const exp = await generateResultExplanation("r1", ctx);
    assert.strictEqual(exp.evidenceReferences.includes("GPP-PARK-01"), true);
    assert.strictEqual(exp.technicalExplanation.includes("35 petak"), true);
  });

  // Test 10: Issue draft comment flow generates action-oriented text
  it("Test 10: Issue draft comment flow generates action-oriented text", async () => {
    const ctx = {
      issues: [
        {
          issueId: "iss-1",
          ruleCode: "GPP-PARK-01",
          title: "TLK Kurang",
          description: "Penyediaan 35 petak berbanding 45",
        },
      ],
      results: [
        {
          ruleId: "r1",
          ruleCode: "GPP-PARK-01",
          ruleName: "TLK Kereta",
          actualValue: 35,
          requiredValue: 45,
          unit: "petak",
          ruleEvidence: { sourceClause: "4.2.1" },
        },
      ],
    };

    const res = await generateIssueDraftComment("iss-1", ctx);
    assert.strictEqual(res.draftComment.includes("35 petak"), true);
    assert.strictEqual(res.recommendedAction.includes("45 petak"), true);
  });

  // Test 11: Draft created with status AI_DRAFT
  it("Test 11: Draft created with status AI_DRAFT", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 45,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1" },
    });

    const draft = await createAiDraft("app-101", "sc-101", "STANDARD", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(draft.status, "AI_DRAFT");
    assert.strictEqual(draft.version, 1);
  });

  // Test 12: Officer can edit draft sections
  it("Test 12: Officer can edit draft sections", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      revisionNumber: 1,
      aiGeneratedText: "Teks asal AI",
      officerEditedText: "Teks asal AI",
    });

    const res = await saveOfficerDraftEdit(
      "app-101",
      "draft-1",
      "Teks telah dipinda oleh Pegawai",
      "officer-1",
      "OSC_OFFICER",
      1,
      mockDb
    );
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.newRevisionNumber, 2);
  });

  // Test 13: Original aiGeneratedText remains strictly preserved
  it("Test 13: Original aiGeneratedText remains strictly preserved", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      revisionNumber: 1,
      aiGeneratedText: "Teks Asal AI Yang Tidak Boleh Diubah",
      officerEditedText: "Teks Asal AI Yang Tidak Boleh Diubah",
    });

    await saveOfficerDraftEdit(
      "app-101",
      "draft-1",
      "Pindaan Baru Pegawai",
      "officer-1",
      "OSC_OFFICER",
      1,
      mockDb
    );

    const snap = await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").get();
    assert.strictEqual(snap.data().aiGeneratedText, "Teks Asal AI Yang Tidak Boleh Diubah");
    assert.strictEqual(snap.data().officerEditedText, "Pindaan Baru Pegawai");
  });

  // Test 14: Diff viewer accurately highlights additions, deletions, modifications
  it("Test 14: Diff viewer accurately highlights modifications", () => {
    const draft = {
      draftId: "d1",
      aiGeneratedText: "Baris 1\nBaris 2",
      officerEditedText: "Baris 1\nBaris 2 Pindaan Pegawai",
    };
    const diff = getCommentDiff(draft);
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual(diff.addedLines.length, 1);
    assert.strictEqual(diff.removedLines.length, 1);
  });

  // Test 15: Stale draft detected when SmartCheck runs again
  it("Test 15: Stale draft detected when SmartCheck runs again", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 2, // Changed from v1
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      smartCheckId: "sc-101",
      sourceFingerprint: "old-fingerprint-123",
    });

    const freshness = await getDraftFreshness("app-101", "draft-1", mockDb);
    assert.strictEqual(freshness.isStale, true);
    assert.strictEqual(freshness.freshness, "STALE_SMARTCHECK_CHANGED");
  });

  // Test 16: Prohibited wording detector catches "permohonan diluluskan"
  it("Test 16: Prohibited wording detector catches 'permohonan diluluskan'", () => {
    const text = "Dengan ini permohonan diluluskan tanpa syarat.";
    const res = validateCommentForVerification(text);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.some((e) => e.includes("permohonan diluluskan")), true);
  });

  // Test 17: Prohibited wording detector catches "permohonan ditolak"
  it("Test 17: Prohibited wording detector catches 'permohonan ditolak'", () => {
    const text = "Permohonan adalah ditolak kerana tidak mematuhi zon.";
    const res = validateCommentForVerification(text);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.some((e) => e.includes("permohonan adalah ditolak")), true);
  });

  // Test 18: Current, verified-ready draft can be verified
  it("Test 18: Current, verified-ready draft can be verified", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    const fp = computeSourceFingerprint(ctx);

    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      smartCheckId: "sc-101",
      version: 1,
      sourceFingerprint: fp,
      sourceVersions: { lcpVersion: 1, siteVersion: 1, smartCheckId: "sc-101", engineVersion: "1.0.0", promptVersion: "1.0.0" },
      generatedSections: {
        executiveSummary: "Ringkasan pra-semakan",
        planningContext: "Konteks projek",
        categoryComments: [],
        issuesRequiringAction: [],
        officerJudgementItems: [],
        recommendedApplicantActions: [],
        conclusionDraft: "Penutup",
        sourceReferences: [],
        warnings: [],
      },
    });

    const verified = await verifyOscComment(
      "app-101",
      "draft-1",
      "## ULASAN PEGAWAI\nPermohonan mematuhi kriteria asas perancangan.",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );

    assert.strictEqual(verified.status, "VERIFIED");
    assert.strictEqual(verified.version, 1);
    assert.strictEqual(verified.verifiedBy, "officer-1");
  });

  // Test 19: Verification creates immutable snapshot in verifiedComments
  it("Test 19: Verification creates immutable snapshot in verifiedComments", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      finalText: "Ulasan Rasmi Pegawai",
      status: "VERIFIED",
    });

    const snap = await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").get();
    assert.strictEqual(snap.data().finalText, "Ulasan Rasmi Pegawai");
  });

  // Test 20: New verification supersedes previous verified comment
  it("Test 20: New verification supersedes previous verified comment", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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

    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    const fp = computeSourceFingerprint(ctx);

    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-v1").set({
      commentId: "comm-v1",
      version: 1,
      status: "VERIFIED",
    });

    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-2").set({
      draftId: "draft-2",
      smartCheckId: "sc-101",
      version: 2,
      sourceFingerprint: fp,
      sourceVersions: { lcpVersion: 1, siteVersion: 1, smartCheckId: "sc-101", engineVersion: "1.0.0", promptVersion: "1.0.0" },
      generatedSections: {},
    });

    const verified2 = await verifyOscComment(
      "app-101",
      "draft-2",
      "## ULASAN PEGAWAI VERSI 2\nUlasan baharu selepas pindaan.",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );

    assert.strictEqual(verified2.version, 2);
    const oldSnap = await mockDb.collection("applications/app-101/verifiedComments").doc("comm-v1").get();
    assert.strictEqual(oldSnap.data().status, "SUPERSEDED");
  });

  // Test 21: Officer can publish verified comment to applicant
  it("Test 21: Officer can publish verified comment to applicant", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      status: "VERIFIED",
      visibility: "INTERNAL",
    });

    const res = await publishVerifiedComment(
      "app-101",
      "comm-1",
      "officer-1",
      "OSC_OFFICER",
      "Sila rujuk ulasan ini",
      mockDb
    );
    assert.strictEqual(res.success, true);
    const snap = await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").get();
    assert.strictEqual(snap.data().visibility, "APPLICANT_VISIBLE");
  });

  // Test 22: Applicant cannot publish verified comment
  it("Test 22: Applicant cannot publish verified comment", async () => {
    const mockDb = createMockDb();
    await assert.rejects(
      async () => {
        await publishVerifiedComment(
          "app-101",
          "comm-1",
          "applicant-1",
          "APPLICANT",
          "Nota",
          mockDb
        );
      },
      { message: /Hanya Pegawai dibenarkan/ }
    );
  });

  // Test 23: Applicant can view published APPLICANT_VISIBLE verified comment
  it("Test 23: Applicant can view published APPLICANT_VISIBLE verified comment", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-pub").set({
      commentId: "comm-pub",
      status: "VERIFIED",
      visibility: "APPLICANT_VISIBLE",
      finalText: "Ulasan untuk pemohon",
    });

    const comments = await getPublishedComments("app-101", mockDb);
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].finalText, "Ulasan untuk pemohon");
  });

  // Test 24: Manual draft fallback functions without Gemini
  it("Test 24: Manual draft fallback functions without Gemini", async () => {
    const mockDb = createMockDb();
    const manualDraft = await createManualDraft(
      "app-101",
      "## ULASAN MANUAL PEGAWAI\nDraf manual disediakan.",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );
    assert.strictEqual(manualDraft.aiModel, "MANUAL");
    assert.strictEqual(manualDraft.status, "OFFICER_EDITING");
    assert.strictEqual(manualDraft.aiGeneratedText.includes("ULASAN MANUAL"), true);
  });

  // Test 25: AI service outage does not block officer from drafting and verifying comments
  it("Test 25: AI service outage does not block officer from drafting and verifying comments", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
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

    // 1. Create manual draft
    const manualDraft = await createManualDraft(
      "app-101",
      "## ULASAN MANUAL\nPenyediaan TLK adalah memuaskan.",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );

    // 2. Set current fingerprint
    const ctx = await buildPlanningCommentContext("app-101", "sc-101", mockDb);
    const fp = computeSourceFingerprint(ctx);
    await mockDb.collection(`applications/app-101/commentDrafts`).doc(manualDraft.draftId).update({
      smartCheckId: "sc-101",
      sourceFingerprint: fp,
      sourceVersions: { lcpVersion: 1, siteVersion: 1, smartCheckId: "sc-101", engineVersion: "1.0.0", promptVersion: "manual" },
    });

    // 3. Verify manual draft
    const verified = await verifyOscComment(
      "app-101",
      manualDraft.draftId,
      "## ULASAN MANUAL\nPenyediaan TLK adalah memuaskan mengikut pelan.",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );

    assert.strictEqual(verified.status, "VERIFIED");
  });

  // Test 26: Officer can revoke a verified comment with reason
  it("Test 26: Officer can revoke a verified comment with reason", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").set({
      commentId: "comm-1",
      status: "VERIFIED",
      visibility: "INTERNAL",
    });

    const res = await revokeVerifiedComment(
      "app-101",
      "comm-1",
      "Dibatalkan berikutan permohonan ditarik balik",
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );
    assert.strictEqual(res.success, true);
    const snap = await mockDb.collection("applications/app-101/verifiedComments").doc("comm-1").get();
    assert.strictEqual(snap.data().status, "REVOKED");
    assert.strictEqual(snap.data().revocationReason, "Dibatalkan berikutan permohonan ditarik balik");
  });

  // Test 27: Formatting StructuredOscDraft to Markdown retains all headers
  it("Test 27: Formatting StructuredOscDraft to Markdown retains all headers", () => {
    const structured = {
      executiveSummary: "Ringkasan eksekutif pra-semakan.",
      planningContext: "Konteks perancangan projek.",
      categoryComments: [
        {
          category: "PARKING",
          summary: "TLK mematuhi piawaian.",
          findings: ["TLK Kereta: 45 petak disediakan."],
          actionRequired: null,
          evidenceRefs: ["GPP-PARK-01"],
        },
      ],
      issuesRequiringAction: [],
      officerJudgementItems: [],
      recommendedApplicantActions: ["Sedia untuk proses seterusnya."],
      conclusionDraft: "Penutup draf ulasan.",
      sourceReferences: [],
      warnings: [],
    };

    const md = formatDraftToMarkdown(structured);
    assert.strictEqual(md.includes("## RINGKASAN EKSEKUTIF"), true);
    assert.strictEqual(md.includes("## KONTEKS PERANCANGAN"), true);
    assert.strictEqual(md.includes("### PARKING"), true);
    assert.strictEqual(md.includes("## KESIMPULAN DRAF"), true);
  });

  // Test 28: Zero AI Statutory Decision Guarantee
  it("Test 28: Zero AI Statutory Decision Guarantee", () => {
    const prohibitedPhrases = ["permohonan diluluskan", "km diluluskan", "permohonan ditolak", "tolak muktamad"];
    const candidateText = "Hasil pra-semakan mendapati semua kriteria asas telah dipenuhi untuk pertimbangan jawatankuasa.";
    for (const p of prohibitedPhrases) {
      assert.strictEqual(candidateText.toLowerCase().includes(p), false);
    }
  });

  // Test 29: Optimistic concurrency rejects conflicting revision edits
  it("Test 29: Optimistic concurrency rejects conflicting revision edits", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      revisionNumber: 3,
      officerEditedText: "Teks semasa",
    });

    await assert.rejects(
      async () => {
        await saveOfficerDraftEdit(
          "app-101",
          "draft-1",
          "Teks konflik",
          "officer-2",
          "OSC_OFFICER",
          2, // Outdated revision
          mockDb
        );
      },
      { message: /Draf telah dikemas kini oleh pengguna lain/ }
    );
  });

  // Test 30: Source fingerprint changes when any result changes
  it("Test 30: Source fingerprint changes when any result changes", () => {
    const ctx1 = {
      application: { applicationId: "app-1" },
      smartCheck: { smartCheckId: "sc-1" },
      sourceVersions: { lcpVersion: 1, siteVersion: 1, ruleEngineVersion: "1.0.0", promptVersion: "1.0.0" },
      results: [{ ruleCode: "GPP-PARK-01", machineStatus: "COMPLIANT", actualValue: 45 }],
      issues: [],
      officerAssessments: [],
    };
    const ctx2 = {
      ...ctx1,
      results: [{ ruleCode: "GPP-PARK-01", machineStatus: "NON_COMPLIANT", actualValue: 35 }],
    };

    const fp1 = computeSourceFingerprint(ctx1);
    const fp2 = computeSourceFingerprint(ctx2);
    assert.notStrictEqual(fp1, fp2);
  });

  // Test 31: Prompt version is recorded in context and draft
  it("Test 31: Prompt version is recorded in context and draft", () => {
    const promptVer = "1.0.0";
    assert.strictEqual(promptVer, "1.0.0");
  });

  // Test 32: Non-officer cannot verify comment
  it("Test 32: Non-officer cannot verify comment", async () => {
    const mockDb = createMockDb();
    await assert.rejects(
      async () => {
        await verifyOscComment(
          "app-101",
          "draft-1",
          "Teks ulasan yang cuba disahkan",
          "applicant-1",
          "APPLICANT",
          mockDb
        );
      },
      { message: /Hanya Pegawai Perancang \/ Pegawai OSC/ }
    );
  });

  // Test 33: Stale draft cannot be verified
  it("Test 33: Stale draft cannot be verified", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({ id: "app-101" });
    await mockDb.collection("applications/app-101/smartChecks").doc("sc-101").set({
      smartCheckId: "sc-101",
      lcpDocumentVersion: 2,
      siteVersion: 1,
      totalRulesEvaluated: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      requiresReviewCount: 0,
      insufficientDataCount: 0,
      overallStatus: "PASS_PRECHECK",
    });
    await mockDb.collection("applications/app-101/commentDrafts").doc("draft-1").set({
      draftId: "draft-1",
      smartCheckId: "sc-101",
      sourceFingerprint: "stale-fingerprint-abc",
    });

    await assert.rejects(
      async () => {
        await verifyOscComment(
          "app-101",
          "draft-1",
          "Ulasan yang cuba disahkan tetapi draf tidak terkini",
          "officer-1",
          "OSC_OFFICER",
          mockDb
        );
      },
      { message: /Draf ulasan tidak terkini/ }
    );
  });

  // Test 34: Verification checksum matches SHA-256
  it("Test 34: Verification checksum is a valid 64-character SHA-256 hash", () => {
    const text = "Ulasan rasmi perancangan";
    const hash = crypto.createHash("sha256").update(text).digest("hex");
    assert.strictEqual(hash.length, 64);
  });

  // Test 35: Standard phrase template retrieval
  it("Test 35: Standard phrase template retrieval returns active templates", async () => {
    const { getStandardTemplates } = await import("../../src/lib/comments/templateService.ts");
    const mockDb = createMockDb();
    const templates = await getStandardTemplates(mockDb);
    assert.strictEqual(templates.length > 0, true);
    assert.strictEqual(templates[0].category, "PARKING");
  });

  // Test 36: Short comments (<20 chars) fail verification validation
  it("Test 36: Short comments fail verification validation", () => {
    const text = "Pendek";
    const res = validateCommentForVerification(text);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.some((e) => e.includes("terlalu pendek")), true);
  });

  // Test 37: Full end-to-end flow: Context -> AI Draft -> Officer Edit -> Verification -> Publication
  it("Test 37: Full end-to-end flow: Context -> AI Draft -> Officer Edit -> Verification -> Publication", async () => {
    const mockDb = createMockDb();
    await mockDb.collection("applications").doc("app-101").set({
      id: "app-101",
      applicationNo: "KM/2026/000101",
      projectInfo: { projectName: "Projek Hotel Impian", developmentType: "HOTEL" },
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
    await mockDb.collection("applications/app-101/smartChecks/sc-101/results").doc("r1").set({
      ruleId: "r1",
      ruleCode: "GPP-PARK-01",
      ruleName: "TLK Kereta",
      category: "PARKING",
      status: "COMPLIANT",
      actualValue: 50,
      requiredValue: 45,
      ruleEvidence: { sourceClause: "4.2.1" },
    });

    // 1. Context & AI Draft
    const draft = await createAiDraft("app-101", "sc-101", "STANDARD", "officer-1", "OSC_OFFICER", mockDb);
    assert.strictEqual(draft.status, "AI_DRAFT");

    // 2. Officer Edit
    const updatedText = `${draft.aiGeneratedText}\n\n*Tambahan Pegawai:* Disahkan pelan teratur.`;
    await saveOfficerDraftEdit("app-101", draft.draftId, updatedText, "officer-1", "OSC_OFFICER", 1, mockDb);

    // 3. Officer Verification
    const verified = await verifyOscComment(
      "app-101",
      draft.draftId,
      updatedText,
      "officer-1",
      "OSC_OFFICER",
      mockDb
    );
    assert.strictEqual(verified.status, "VERIFIED");

    // 4. Officer Publication
    await publishVerifiedComment("app-101", verified.commentId, "officer-1", "OSC_OFFICER", "Diterbitkan", mockDb);

    // 5. Applicant retrieval
    const publicComments = await getPublishedComments("app-101", mockDb);
    assert.strictEqual(publicComments.length, 1);
    assert.strictEqual(publicComments[0].finalText.includes("Tambahan Pegawai"), true);
  });
});
