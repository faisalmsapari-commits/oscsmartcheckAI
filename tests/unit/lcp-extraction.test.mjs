import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeArea,
  normalizePlotRatio,
  normalizePercentage,
  normalizeInteger,
  normalizeDistance,
  normalizeUnitText,
} from "../../src/lib/extraction/normalizers.ts";

import {
  PlanningFactSchema,
  ProcessingJobSchema,
  FactEvidenceSchema,
} from "../../src/lib/validation/extraction.schema.ts";

import {
  DevelopmentDocumentAIProcessor,
  SAMPLE_LCP_FIXTURE_PAGES,
} from "../../src/lib/extraction/documentProcessor.ts";

import {
  extractPlanningFactsFromDocument,
  detectFactConflicts,
} from "../../src/lib/extraction/geminiExtractor.ts";

import {
  startLcpProcessing,
  processLcpDocument,
  confirmExtractedFact,
  correctExtractedFact,
  markFactUnknown,
  getExtractedFacts,
  getLcpExtractionCompleteness,
} from "../../src/lib/extraction/extractionService.ts";

// In-memory Mock Firestore implementation
function createMockDb() {
  const store = new Map();
  const auditLogs = [];

  const mockDb = {
    _store: store,
    _auditLogs: auditLogs,
    collection(path) {
      if (path === "auditLogs") {
        return {
          async add(data) {
            auditLogs.push({ id: `audit-${auditLogs.length + 1}`, ...data });
            return { id: `audit-${auditLogs.length}` };
          },
          doc(id = `audit-${auditLogs.length + 1}`) {
            return {
              async set(data) {
                auditLogs.push({ id, ...data });
              },
            };
          },
        };
      }

      if (path === "aiRuns") {
        return {
          doc(id) {
            return {
              async set(data) {
                store.set(`aiRuns/${id}`, data);
              },
            };
          },
        };
      }

      return {
        doc(id) {
          const docPath = `${path}/${id}`;
          return {
            ref: { path: docPath },
            id,
            async get() {
              const data = store.get(docPath);
              return {
                exists: !!data,
                id,
                data: () => data,
              };
            },
            async set(data) {
              store.set(docPath, data);
            },
            async update(partial) {
              const existing = store.get(docPath) || {};
              store.set(docPath, { ...existing, ...partial });
            },
          };
        },
        where(field, op, val) {
          return {
            where(f2, o2, v2) {
              return {
                where(f3, o3, v3) {
                  return {
                    orderBy() {
                      return {
                        limit() {
                          return this;
                        },
                        async get() {
                          const results = [];
                          for (const [key, value] of store.entries()) {
                            if (key.startsWith(path + "/")) {
                              if (
                                value[field] === val &&
                                value[f2] === v2 &&
                                value[f3] === v3
                              ) {
                                results.push({
                                  id: key.split("/").pop(),
                                  data: () => value,
                                });
                              }
                            }
                          }
                          return {
                            docs: results,
                            empty: results.length === 0,
                            size: results.length,
                            forEach(cb) {
                              results.forEach(cb);
                            },
                          };
                        },
                      };
                    },
                    limit() {
                      return this;
                    },
                    async get() {
                      const results = [];
                      for (const [key, value] of store.entries()) {
                        if (key.startsWith(path + "/")) {
                          if (
                            value[field] === val &&
                            value[f2] === v2 &&
                            value[f3] === v3
                          ) {
                            results.push({
                              id: key.split("/").pop(),
                              data: () => value,
                            });
                          }
                        }
                      }
                      return {
                        docs: results,
                        empty: results.length === 0,
                        size: results.length,
                        forEach(cb) {
                          results.forEach(cb);
                        },
                      };
                    },
                  };
                },
                orderBy() {
                  return {
                    limit() {
                      return this;
                    },
                    async get() {
                      const results = [];
                      for (const [key, value] of store.entries()) {
                        if (key.startsWith(path + "/")) {
                          if (value[field] === val && value[f2] === v2) {
                            results.push({
                              id: key.split("/").pop(),
                              data: () => value,
                            });
                          }
                        }
                      }
                      return {
                        docs: results,
                        empty: results.length === 0,
                        size: results.length,
                        forEach(cb) {
                          results.forEach(cb);
                        },
                      };
                    },
                  };
                },
                limit() {
                  return this;
                },
                async get() {
                  const results = [];
                  for (const [key, value] of store.entries()) {
                    if (key.startsWith(path + "/")) {
                      if (value[field] === val && value[f2] === v2) {
                        results.push({
                          id: key.split("/").pop(),
                          data: () => value,
                        });
                      }
                    }
                  }
                  return {
                    docs: results,
                    empty: results.length === 0,
                    size: results.length,
                    forEach(cb) {
                      results.forEach(cb);
                    },
                  };
                },
              };
            },
            orderBy() {
              return {
                limit() {
                  return this;
                },
                async get() {
                  const results = [];
                  for (const [key, value] of store.entries()) {
                    if (key.startsWith(path + "/")) {
                      if (value[field] === val) {
                        results.push({
                          id: key.split("/").pop(),
                          data: () => value,
                        });
                      }
                    }
                  }
                  return {
                    docs: results,
                    empty: results.length === 0,
                    size: results.length,
                    forEach(cb) {
                      results.forEach(cb);
                    },
                  };
                },
              };
            },
            limit() {
              return this;
            },
            async get() {
              const results = [];
              for (const [key, value] of store.entries()) {
                if (key.startsWith(path + "/")) {
                  if (value[field] === val) {
                    results.push({
                      id: key.split("/").pop(),
                      data: () => value,
                    });
                  }
                }
              }
              return {
                docs: results,
                empty: results.length === 0,
                size: results.length,
                forEach(cb) {
                  results.forEach(cb);
                },
              };
            },
          };
        },
        orderBy() {
          return {
            limit() {
              return this;
            },
            async get() {
              const results = [];
              for (const [key, value] of store.entries()) {
                if (key.startsWith(path + "/")) {
                  results.push({ id: key.split("/").pop(), data: () => value });
                }
              }
              return {
                docs: results,
                empty: results.length === 0,
                size: results.length,
                forEach(cb) {
                  results.forEach(cb);
                },
              };
            },
          };
        },
        async get() {
          const results = [];
          for (const [key, value] of store.entries()) {
            if (key.startsWith(path + "/")) {
              results.push({ id: key.split("/").pop(), data: () => value });
            }
          }
          return {
            docs: results,
            empty: results.length === 0,
            size: results.length,
            forEach(cb) {
              results.forEach(cb);
            },
          };
        },
      };
    },
    batch() {
      const operations = [];
      return {
        set(ref, data) {
          operations.push(() => store.set(ref.path || ref, data));
        },
        async commit() {
          for (const op of operations) op();
        },
      };
    },
  };

  return mockDb;
}

describe("Module 07: LCP Document Intelligence & Structured Data Extraction", () => {
  // Test 1: Normalization engine works deterministically
  it("Test 1: Normalization engine converts area, plot ratio, percentages, integers, and distances", () => {
    assert.strictEqual(normalizeArea("5.2 hektar"), 52000);
    assert.strictEqual(normalizeArea("2.5 ekar"), 10117.15);
    assert.strictEqual(normalizeArea("12,500 m2"), 12500);

    assert.strictEqual(normalizePlotRatio("1:2.5"), 2.5);
    assert.strictEqual(normalizePlotRatio("1:3"), 3.0);
    assert.strictEqual(normalizePlotRatio("2.8"), 2.8);

    assert.strictEqual(normalizePercentage("10%"), 10);
    assert.strictEqual(normalizePercentage("42%"), 42);
    assert.strictEqual(normalizePercentage(0.45), 45);

    assert.strictEqual(normalizeInteger("180 petak"), 180);
    assert.strictEqual(normalizeInteger("12 tingkat"), 12);

    assert.strictEqual(normalizeDistance("66 kaki"), 20.12);
    assert.strictEqual(normalizeDistance("20 meter"), 20);

    assert.strictEqual(normalizeUnitText("sqm"), "m²");
    assert.strictEqual(normalizeUnitText("petak"), "petak");
  });

  // Test 2: Current LCP can be queued for processing
  it("Test 2: Current LCP can be queued for processing", async () => {
    const db = createMockDb();
    const appId = "app-test-01";
    db._store.set(`applications/${appId}`, { applicantUid: "user-applicant-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-lcp-1`, {
      documentId: "doc-lcp-1",
      documentType: "LCP",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
      storagePath: `applications/${appId}/documents/LCP/v1/lcp_v1.pdf`,
      checksum: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    });

    const result = await startLcpProcessing(appId, "user-applicant-1", "APPLICANT", false, db);
    assert.strictEqual(result.status, "QUEUED");
    assert.ok(result.jobId.startsWith("job-lcp-"));

    const job = db._store.get(`applications/${appId}/processingJobs/${result.jobId}`);
    assert.ok(job);
    assert.ok(["QUEUED", "PROCESSING", "COMPLETED"].includes(job.status));
  });

  // Test 3: Non-LCP document cannot trigger LCP extraction
  it("Test 3: Non-LCP document cannot trigger LCP extraction", async () => {
    const db = createMockDb();
    const appId = "app-test-02";
    db._store.set(`applications/${appId}`, { applicantUid: "user-applicant-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-siteplan-1`, {
      documentId: "doc-siteplan-1",
      documentType: "SITE_PLAN",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
    });

    await assert.rejects(
      async () => {
        await startLcpProcessing(appId, "user-applicant-1", "APPLICANT", false, db);
      },
      { message: /Tiada fail LCP/ }
    );
  });

  // Test 4: Superseded LCP is not selected as current
  it("Test 4: Superseded LCP is not selected as current", async () => {
    const db = createMockDb();
    const appId = "app-test-03";
    db._store.set(`applications/${appId}`, { applicantUid: "user-applicant-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-lcp-v1`, {
      documentId: "doc-lcp-v1",
      documentType: "LCP",
      isCurrent: false,
      status: "SUPERSEDED",
      version: 1,
    });

    await assert.rejects(
      async () => {
        await startLcpProcessing(appId, "user-applicant-1", "APPLICANT", false, db);
      },
      { message: /Tiada fail LCP/ }
    );
  });

  // Test 5: Unauthorized user cannot trigger processing
  it("Test 5: Unauthorized user cannot trigger processing", async () => {
    const db = createMockDb();
    const appId = "app-test-04";
    db._store.set(`applications/${appId}`, { applicantUid: "user-applicant-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-lcp-1`, {
      documentId: "doc-lcp-1",
      documentType: "LCP",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
    });

    // Another applicant cannot process
    await assert.rejects(
      async () => {
        await startLcpProcessing(appId, "user-intruder", "APPLICANT", false, db);
      },
      { message: /Akses tidak dibenarkan/ }
    );
  });

  // Test 6: Duplicate active job is blocked (Idempotency)
  it("Test 6: Duplicate active job is blocked (Idempotency)", async () => {
    const db = createMockDb();
    const appId = "app-test-05";
    db._store.set(`applications/${appId}`, { applicantUid: "user-applicant-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-lcp-1`, {
      documentId: "doc-lcp-1",
      documentType: "LCP",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
    });

    const res1 = await startLcpProcessing(appId, "user-applicant-1", "APPLICANT", false, db);
    assert.strictEqual(res1.isNewJob, true);

    const res2 = await startLcpProcessing(appId, "user-applicant-1", "APPLICANT", false, db);
    assert.strictEqual(res2.isNewJob, false);
    assert.strictEqual(res2.jobId, res1.jobId);
  });

  // Test 7: Document AI response normalizes correctly
  it("Test 7: Document AI response normalizes correctly to pages and text", async () => {
    const processor = new DevelopmentDocumentAIProcessor();
    const doc = await processor.processDocument({
      storagePath: "applications/app-1/documents/LCP/v1/lcp_v1.pdf",
      applicationId: "app-1",
      documentId: "doc-lcp-1",
      documentVersion: 1,
    });

    assert.strictEqual(doc.totalPages, 6);
    assert.ok(doc.rawTextLength > 0);
    assert.strictEqual(doc.pages[0].pageNumber, 1);
    assert.ok(doc.pages[0].text.includes("LAPORAN CADANGAN PEMAJUAN"));
  });

  // Test 8: Extracted fact passes Zod schema
  it("Test 8: Extracted fact passes Zod schema", () => {
    const validFact = {
      factId: "carParkingProvided_v1",
      applicationId: "app-123",
      documentId: "doc-lcp-1",
      documentVersion: 1,
      key: "carParkingProvided",
      label: "Tempat Letak Kereta",
      category: "PARKING",
      value: 172,
      unit: "petak",
      normalizedValue: 172,
      status: "EXTRACTED",
      confidence: 0.98,
      confidenceLevel: "HIGH",
      sourceEvidence: [
        {
          documentId: "doc-lcp-1",
          documentVersion: 1,
          pageNumber: 42,
          quotedText: "Jumlah Tempat Letak Kereta Dicadangkan: 172 petak",
          tableReference: null,
        },
      ],
      aiGenerated: true,
      confirmedValue: null,
      confirmedBy: null,
      confirmedAt: null,
    };

    assert.doesNotThrow(() => {
      PlanningFactSchema.parse(validFact);
    });
  });

  // Test 9: Missing value returns NOT_FOUND
  it("Test 9: Missing value returns NOT_FOUND status with 0 confidence", async () => {
    const processor = new DevelopmentDocumentAIProcessor();
    const doc = await processor.processDocument({
      storagePath: "dummy",
      applicationId: "app-1",
      documentId: "doc-lcp-1",
      documentVersion: 1,
    });

    const result = await extractPlanningFactsFromDocument(doc, "app-1", 1);
    const residentialFact = result.facts.find((f) => f.key === "totalResidentialUnits");

    assert.ok(residentialFact);
    assert.strictEqual(residentialFact.status, "NOT_FOUND");
    assert.strictEqual(residentialFact.value, null);
    assert.strictEqual(residentialFact.confidence, 0);
  });

  // Test 10: Conflicting values return CONFLICT
  it("Test 10: Conflicting values across pages return CONFLICT", () => {
    const conflictFacts = [
      {
        factId: "numberOfUnits_v1",
        applicationId: "app-1",
        documentId: "doc-lcp-1",
        documentVersion: 1,
        key: "numberOfUnits",
        label: "Jumlah Unit",
        category: "HOUSING",
        value: 180,
        unit: "unit",
        normalizedValue: 180,
        status: "CONFLICT",
        confidence: 0.85,
        confidenceLevel: "MEDIUM",
        sourceEvidence: [
          {
            documentId: "doc-lcp-1",
            documentVersion: 1,
            pageNumber: 12,
            quotedText: "Jumlah unit = 180",
            tableReference: null,
          },
          {
            documentId: "doc-lcp-1",
            documentVersion: 1,
            pageNumber: 35,
            quotedText: "Jumlah unit = 192",
            tableReference: null,
          },
        ],
        aiGenerated: true,
        confirmedValue: null,
        confirmedBy: null,
        confirmedAt: null,
      },
    ];

    const conflicts = detectFactConflicts(conflictFacts);
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].key, "numberOfUnits");
    assert.strictEqual(conflicts[0].candidateValues.length, 2);
  });

  // Test 11: Fact contains source page and quoted text
  it("Test 11: Extracted fact contains mandatory source page and quoted text", async () => {
    const processor = new DevelopmentDocumentAIProcessor();
    const doc = await processor.processDocument({
      storagePath: "dummy",
      applicationId: "app-1",
      documentId: "doc-lcp-1",
      documentVersion: 1,
    });

    const result = await extractPlanningFactsFromDocument(doc, "app-1", 1);
    const parkingFact = result.facts.find((f) => f.key === "carParkingProvided");

    assert.ok(parkingFact);
    assert.ok(parkingFact.sourceEvidence.length > 0);
    assert.strictEqual(parkingFact.sourceEvidence[0].pageNumber, 42);
    assert.ok(parkingFact.sourceEvidence[0].quotedText.includes("172 petak kereta"));
  });

  // Test 12: Officer can confirm extracted fact
  it("Test 12: Officer can confirm extracted fact", async () => {
    const db = createMockDb();
    const appId = "app-test-06";
    const factId = "carParkingProvided_v1";

    db._store.set(`applications/${appId}/extractedFacts/${factId}`, {
      factId,
      applicationId: appId,
      key: "carParkingProvided",
      value: 172,
      status: "EXTRACTED",
      confirmedValue: null,
    });

    await confirmExtractedFact(appId, factId, "officer-uid-1", undefined, db);

    const fact = db._store.get(`applications/${appId}/extractedFacts/${factId}`);
    assert.strictEqual(fact.status, "MANUALLY_CONFIRMED");
    assert.strictEqual(fact.confirmedValue, 172);
    assert.strictEqual(fact.confirmedBy, "officer-uid-1");
  });

  // Test 13: Officer can correct extracted fact
  it("Test 13: Officer can correct extracted fact", async () => {
    const db = createMockDb();
    const appId = "app-test-07";
    const factId = "carParkingProvided_v1";

    db._store.set(`applications/${appId}/extractedFacts/${factId}`, {
      factId,
      applicationId: appId,
      key: "carParkingProvided",
      value: 172,
      status: "EXTRACTED",
      confirmedValue: null,
    });

    await correctExtractedFact(appId, factId, 176, "officer-uid-1", "Semakan pelan mendapati 4 petak tambahan", db);

    const fact = db._store.get(`applications/${appId}/extractedFacts/${factId}`);
    assert.strictEqual(fact.status, "MANUALLY_CORRECTED");
    assert.strictEqual(fact.confirmedValue, 176);
    assert.strictEqual(fact.confirmedBy, "officer-uid-1");
  });

  // Test 14: Original AI value is retained after correction
  it("Test 14: Original AI value is retained after correction", async () => {
    const db = createMockDb();
    const appId = "app-test-08";
    const factId = "carParkingProvided_v1";

    db._store.set(`applications/${appId}/extractedFacts/${factId}`, {
      factId,
      applicationId: appId,
      key: "carParkingProvided",
      value: 172,
      status: "EXTRACTED",
    });

    await correctExtractedFact(appId, factId, 180, "officer-uid-1", "Pindaan", db);

    const fact = db._store.get(`applications/${appId}/extractedFacts/${factId}`);
    assert.strictEqual(fact.value, 172); // Original retained
    assert.strictEqual(fact.confirmedValue, 180); // Corrected value stored
  });

  // Test 15: Officer can mark fact unknown
  it("Test 15: Officer can mark fact unknown", async () => {
    const db = createMockDb();
    const appId = "app-test-09";
    const factId = "busParkingProvided_v1";

    db._store.set(`applications/${appId}/extractedFacts/${factId}`, {
      factId,
      applicationId: appId,
      key: "busParkingProvided",
      value: 3,
      status: "EXTRACTED",
    });

    await markFactUnknown(appId, factId, "officer-uid-1", db);

    const fact = db._store.get(`applications/${appId}/extractedFacts/${factId}`);
    assert.strictEqual(fact.status, "NOT_FOUND");
    assert.strictEqual(fact.confirmedValue, null);
  });

  // Test 16: LCP v2 extraction does not overwrite v1 historical facts
  it("Test 16: LCP v2 extraction does not overwrite v1 historical facts", async () => {
    const db = createMockDb();
    const appId = "app-test-10";

    // Set v1 facts
    db._store.set(`applications/${appId}/extractedFacts/plotRatio_v1`, {
      factId: "plotRatio_v1",
      documentVersion: 1,
      key: "plotRatio",
      value: "1:2.0",
      status: "MANUALLY_CONFIRMED",
      confirmedValue: "1:2.0",
    });

    // Set v2 facts
    db._store.set(`applications/${appId}/extractedFacts/plotRatio_v2`, {
      factId: "plotRatio_v2",
      documentVersion: 2,
      key: "plotRatio",
      value: "1:2.5",
      status: "EXTRACTED",
      confirmedValue: null,
    });

    const v1Facts = await getExtractedFacts(appId, 1, db);
    const v2Facts = await getExtractedFacts(appId, 2, db);

    assert.strictEqual(v1Facts.length, 1);
    assert.strictEqual(v1Facts[0].value, "1:2.0");

    assert.strictEqual(v2Facts.length, 1);
    assert.strictEqual(v2Facts[0].value, "1:2.5");
  });

  // Test 17: Multi-stage processing completes asynchronously
  it("Test 17: Multi-stage processing advances through stages to COMPLETED", async () => {
    const db = createMockDb();
    const appId = "app-test-11";
    const docId = "doc-lcp-1";

    db._store.set(`applications/${appId}`, { applicantUid: "user-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/${docId}`, {
      documentId: docId,
      documentType: "LCP",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
      storagePath: "dummy",
    });

    const trigger = await startLcpProcessing(appId, "user-1", "APPLICANT", false, db);
    await processLcpDocument(
      appId,
      trigger.jobId,
      { documentId: docId, version: 1, storagePath: "dummy" },
      "user-1",
      db
    );

    const job = db._store.get(`applications/${appId}/processingJobs/${trigger.jobId}`);
    assert.strictEqual(job.status, "COMPLETED");
    assert.strictEqual(job.progressPercent, 100);

    const doc = db._store.get(`applications/${appId}/documents/${docId}`);
    assert.strictEqual(doc.processingStatus, "COMPLETED");
  });

  // Test 18: Failed processing updates status to FAILED
  it("Test 18: Failed processing updates status to FAILED with error diagnostic", async () => {
    const db = createMockDb();
    const appId = "app-test-12";
    const jobId = "job-fail-1";
    const docId = "doc-lcp-fail";

    db._store.set(`applications/${appId}/processingJobs/${jobId}`, {
      jobId,
      status: "QUEUED",
    });
    db._store.set(`applications/${appId}/documents/${docId}`, {
      documentId: docId,
      processingStatus: "QUEUED",
    });

    // Pass invalid document triggering error
    await processLcpDocument(
      appId,
      jobId,
      null, // causes error
      "user-1",
      db
    );

    const job = db._store.get(`applications/${appId}/processingJobs/${jobId}`);
    assert.strictEqual(job.status, "FAILED");
    assert.strictEqual(job.errorCode, "EXTRACTION_ERROR");
  });

  // Test 19: Audit events emitted for processing and verification
  it("Test 19: Audit events emitted for processing and verification", async () => {
    const db = createMockDb();
    const appId = "app-test-13";

    db._store.set(`applications/${appId}`, { applicantUid: "user-1", status: "DRAFT" });
    db._store.set(`applications/${appId}/documents/doc-lcp-1`, {
      documentId: "doc-lcp-1",
      documentType: "LCP",
      isCurrent: true,
      status: "ACTIVE",
      version: 1,
      storagePath: "dummy",
    });

    await startLcpProcessing(appId, "user-1", "APPLICANT", false, db);

    const startedEvent = db._auditLogs.find((l) => l.eventType === "LCP_PROCESSING_STARTED");
    assert.ok(startedEvent);
    assert.strictEqual(startedEvent.applicationId, appId);
  });

  // Test 20: Completeness evaluator calculates required vs extracted facts
  it("Test 20: Completeness evaluator calculates required vs extracted facts", async () => {
    const db = createMockDb();
    const appId = "app-test-14";
    db._store.set(`applications/${appId}`, { developmentType: "HOTEL" });

    db._store.set(`applications/${appId}/extractedFacts/projectTitle_v1`, {
      factId: "projectTitle_v1",
      documentVersion: 1,
      key: "projectTitle",
      value: "Cadangan Hotel",
      status: "EXTRACTED",
      confidenceLevel: "HIGH",
      sourceEvidence: [],
    });

    const { completeness, summary } = await getLcpExtractionCompleteness(appId, db);
    assert.ok(completeness.totalRequiredFacts > 0);
    assert.strictEqual(summary.totalExtracted, 1);
    assert.strictEqual(completeness.readyForSmartCheck, false); // missing other facts
  });

  // Test 21: ZERO COMPLIANCE DECISION GUARANTEE
  it("Test 21: Module 07 produces ZERO compliance decisions (no PATUH/TIDAK_PATUH)", async () => {
    const processor = new DevelopmentDocumentAIProcessor();
    const doc = await processor.processDocument({
      storagePath: "dummy",
      applicationId: "app-1",
      documentId: "doc-lcp-1",
      documentVersion: 1,
    });

    const result = await extractPlanningFactsFromDocument(doc, "app-1", 1);

    // Verify facts contain NO compliance status
    for (const fact of result.facts) {
      assert.notStrictEqual(fact.status, "PATUH");
      assert.notStrictEqual(fact.status, "TIDAK_PATUH");
      // @ts-expect-error Guardrail check
      assert.strictEqual(fact.complianceResult, undefined);
    }
  });
});
