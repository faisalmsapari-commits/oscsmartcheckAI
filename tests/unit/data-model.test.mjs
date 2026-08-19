import { describe, it } from "node:test";
import assert from "node:assert";
import { CreateDraftApplicationSchema } from "../../src/lib/validation/application.schema.ts";
import { DocumentMetadataSchema } from "../../src/lib/validation/document.schema.ts";
import { ExtractedFactSchema, SmartCheckRunSchema } from "../../src/lib/validation/smartcheck.schema.ts";
import { OfficerReviewSchema } from "../../src/lib/validation/review.schema.ts";
import { GuidelineSchema, RuleSetSchema } from "../../src/lib/validation/guideline.schema.ts";
import { AuditLogSchema } from "../../src/lib/validation/audit.schema.ts";

describe("Module 03: Data Model & Schema Validation Tests", () => {
  it("should validate a compliant DRAFT application input", () => {
    const validDraftInput = {
      applicationNo: "MPLBP/OSC/KM/2026/001",
      applicantUid: "applicant-uid-123",
      organizationId: null,
      developmentType: "HOTEL",
      title: "Cadangan Pembangunan Resort 5 Bintang di Mukim Padang Matsirat",
      lotNo: "Lot 1082",
      mukim: "Padang Matsirat",
      district: "Langkawi",
      state: "Kedah",
      siteAreaSqm: 12500.5,
      location: { latitude: 6.352, longitude: 99.731 },
      createdBy: "applicant-uid-123",
      updatedBy: "applicant-uid-123",
    };

    const parsed = CreateDraftApplicationSchema.parse(validDraftInput);
    assert.strictEqual(parsed.status, "DRAFT");
    assert.strictEqual(parsed.currentVersion, 1);
    assert.strictEqual(parsed.assignedOfficerUid, null);
    assert.strictEqual(parsed.submittedAt, null);
    assert.strictEqual(parsed.verifiedAt, null);
    assert.strictEqual(parsed.schemaVersion, 1);
  });

  it("should reject an application with an invalid development type", () => {
    const invalidInput = {
      applicationNo: "MPLBP/OSC/KM/2026/002",
      applicantUid: "applicant-uid-123",
      developmentType: "INVALID_MEGA_CITY_TYPE",
      title: "Projek Pembinaan Stadium",
      district: "Langkawi",
      state: "Kedah",
      createdBy: "applicant-uid-123",
      updatedBy: "applicant-uid-123",
    };

    assert.throws(() => CreateDraftApplicationSchema.parse(invalidInput));
  });

  it("should validate document metadata and reject oversize files (>100MB)", () => {
    const validDoc = {
      documentType: "SITE_PLAN",
      fileName: "Pelan_Tapak_Cadangan_Rev1.pdf",
      storagePath: "applications/app-123/documents/doc-456.pdf",
      mimeType: "application/pdf",
      sizeBytes: 15420000, // ~15.4MB
      versionNumber: 1,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      uploadedBy: "applicant-uid-123",
    };

    const parsedDoc = DocumentMetadataSchema.parse(validDoc);
    assert.strictEqual(parsedDoc.processingStatus, "UPLOADED");

    const oversizedDoc = {
      ...validDoc,
      sizeBytes: 200000000, // 200MB (limit is 100MB)
    };
    assert.throws(() => DocumentMetadataSchema.parse(oversizedDoc));
  });

  it("should validate extracted facts with source references", () => {
    const fact = {
      parameterCode: "PLOT_RATIO",
      parameterName: "Nisbah Plot Dicadangkan",
      detectedValue: 1.85,
      unit: "ratio",
      confidence: 0.94,
      source: {
        documentId: "doc-123",
        page: 2,
        textReference: "Jadual Keluasan Lantai Kasar, Muka Surat 2",
      },
    };

    const parsedFact = ExtractedFactSchema.parse(fact);
    assert.strictEqual(parsedFact.status, "AI_DETECTED");
    assert.strictEqual(parsedFact.confirmedValue, null);
  });

  it("should validate smartcheck runs and officer reviews", () => {
    const checkRun = {
      ruleSetVersion: "RTD-LANGKAWI-2030-V1",
      status: "COMPLETED",
      overallResult: "PATUH",
      score: 95,
    };
    const parsedRun = SmartCheckRunSchema.parse(checkRun);
    assert.strictEqual(parsedRun.overallResult, "PATUH");

    const review = {
      smartCheckId: "check-789",
      reviewStatus: "DRAFT",
      officerComment: "Ketinggian dan anjakan mematuhi peruntukan RTD Langkawi 2030 zon Pelancongan.",
    };
    const parsedReview = OfficerReviewSchema.parse(review);
    assert.strictEqual(parsedReview.reviewStatus, "DRAFT");
  });

  it("should validate guideline and ruleset schemas", () => {
    const guideline = {
      title: "Rancangan Tempatan Daerah Langkawi 2030 (Penggantian)",
      code: "RTD_LANGKAWI_2030",
      version: "2.1",
      createdBy: "admin-uid-1",
    };
    const parsedGuideline = GuidelineSchema.parse(guideline);
    assert.strictEqual(parsedGuideline.active, true);

    const ruleset = {
      code: "RS_SETBACK_COMMERCIAL_2026",
      name: "Peraturan Anjakan Bangunan Komersial",
      version: "1.0",
      createdBy: "admin-uid-1",
    };
    const parsedRuleset = RuleSetSchema.parse(ruleset);
    assert.strictEqual(parsedRuleset.status, "DRAFT");
  });

  it("should validate audit log structure", () => {
    const log = {
      eventType: "APPLICATION_DRAFT_CREATED",
      resourceType: "applications",
      resourceId: "app-123",
      applicationId: "app-123",
      actorUid: "applicant-uid-123",
      actorRole: "APPLICANT",
      metadata: { source: "WEB_PORTAL", clientIp: "127.0.0.1" },
    };
    const parsedLog = AuditLogSchema.parse(log);
    assert.strictEqual(parsedLog.eventType, "APPLICATION_DRAFT_CREATED");
  });
});
