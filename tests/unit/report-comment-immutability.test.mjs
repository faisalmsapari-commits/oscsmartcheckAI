import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "crypto";

// High-Risk Immutability & Versioning Domain Logic Simulation
class VerifiedCommentImmutabilityEngine {
  static createVerifiedCommentSnapshot({
    commentId,
    applicationId,
    draftId,
    contentMarkdown,
    officerUid,
    officerName,
    officerRole,
    version = 1,
  }) {
    const timestamp = new Date().toISOString();
    const payloadToHash = `${commentId}:${applicationId}:${contentMarkdown}:${officerUid}:${timestamp}:${version}`;
    const sha256Checksum = crypto.createHash("sha256").update(payloadToHash).digest("hex");

    return {
      commentId,
      applicationId,
      draftId,
      version,
      contentMarkdown,
      status: "VERIFIED",
      isPublished: false,
      publishedAt: null,
      publishedBy: null,
      sha256Checksum,
      integrityAlgorithm: "SHA-256",
      officerUid,
      officerName,
      officerRole,
      verifiedAt: timestamp,
      lockedAt: timestamp,
      isLocked: true, // Immutability Lock Flag
    };
  }

  static verifySnapshotIntegrity(snapshot) {
    if (!snapshot || !snapshot.sha256Checksum || !snapshot.isLocked) {
      return { valid: false, reason: "MISSING_LOCK_OR_CHECKSUM" };
    }

    const payloadToHash = `${snapshot.commentId}:${snapshot.applicationId}:${snapshot.contentMarkdown}:${snapshot.officerUid}:${snapshot.verifiedAt}:${snapshot.version}`;
    const calculatedHash = crypto.createHash("sha256").update(payloadToHash).digest("hex");

    if (calculatedHash !== snapshot.sha256Checksum) {
      return { valid: false, reason: "CHECKSUM_MISMATCH_TAMPERED" };
    }

    return { valid: true, reason: "INTEGRITY_VERIFIED" };
  }

  static attemptUpdateVerifiedComment(snapshot, newContent, actorRole) {
    if (snapshot.isLocked || snapshot.status === "VERIFIED") {
      return {
        allowed: false,
        error: "IMMUTABLE_RECORD: Verified officer comments are permanently locked and cannot be edited or overwritten.",
      };
    }
    return { allowed: true };
  }

  static attemptDeleteVerifiedComment(snapshot, actorRole) {
    if (snapshot.status === "VERIFIED" || snapshot.isPublished) {
      return {
        allowed: false,
        error: "IMMUTABLE_RECORD: Verified or published statutory comments cannot be deleted.",
      };
    }
    return { allowed: true };
  }
}

class ReportVersioningAndFreshnessEngine {
  static generateReportRecord({
    reportId,
    applicationId,
    reportType = "SMARTCHECK_INTERNAL",
    smartCheckId,
    verifiedCommentId,
    generatedBy,
    version = 1,
  }) {
    const timestamp = new Date().toISOString();
    const fingerprintPayload = `${reportId}:${applicationId}:${smartCheckId}:${verifiedCommentId || "NONE"}:${version}:${timestamp}`;
    const sha256Checksum = crypto.createHash("sha256").update(fingerprintPayload).digest("hex");

    return {
      reportId,
      applicationId,
      reportType,
      reportVersion: version,
      status: "GENERATED",
      visibility: reportType === "SMARTCHECK_APPLICANT" ? "APPLICANT_VISIBLE" : "INTERNAL",
      metadata: {
        reportId,
        reportType,
        reportVersion: version,
        applicationId,
        smartCheckId,
        verifiedCommentId,
        generatedAt: timestamp,
        generatedBy,
        systemVersion: "v1.0.0",
        sourceFingerprint: sha256Checksum,
      },
      sha256Checksum,
      isPublished: false,
      publishedAt: null,
      generatedAt: timestamp,
      supersededByReportId: null,
    };
  }

  static evaluateReportFreshness(reportRecord, latestSmartCheckId, latestVerifiedCommentId) {
    const isSmartCheckStale = reportRecord.metadata.smartCheckId !== latestSmartCheckId;
    const isCommentStale =
      latestVerifiedCommentId && reportRecord.metadata.verifiedCommentId !== latestVerifiedCommentId;

    if (isSmartCheckStale && isCommentStale) {
      return { freshness: "STALE_MULTIPLE", isStale: true, reason: "SmartCheck & Comment Updated" };
    }
    if (isSmartCheckStale) {
      return { freshness: "STALE_SMARTCHECK_CHANGED", isStale: true, reason: "SmartCheck Updated" };
    }
    if (isCommentStale) {
      return { freshness: "STALE_COMMENT_CHANGED", isStale: true, reason: "Comment Updated" };
    }

    return { freshness: "CURRENT", isStale: false, reason: "Report Up To Date" };
  }

  static createSupersedingReport(previousReport, newReportId, newSmartCheckId, officerUid) {
    const newVersion = previousReport.reportVersion + 1;
    const newReport = ReportVersioningAndFreshnessEngine.generateReportRecord({
      reportId: newReportId,
      applicationId: previousReport.applicationId,
      reportType: previousReport.reportType,
      smartCheckId: newSmartCheckId,
      verifiedCommentId: previousReport.metadata.verifiedCommentId,
      generatedBy: officerUid,
      version: newVersion,
    });

    const updatedPrevious = {
      ...previousReport,
      status: "SUPERSEDED",
      supersededByReportId: newReportId,
    };

    return { updatedPrevious, newReport };
  }
}

describe("High-Risk Immutability & Versioning Business Logic Tests", () => {
  it("1. Verified Comment: Snapshot generates valid SHA-256 digital checksum", () => {
    const snapshot = VerifiedCommentImmutabilityEngine.createVerifiedCommentSnapshot({
      commentId: "vc-101",
      applicationId: "app-demo-002",
      draftId: "draft-001",
      contentMarkdown: "# Ulasan Rasmi OSC\nAnjakan bangunan hadapan tidak mematuhi syarat.",
      officerUid: "officer-faisal-uid",
      officerName: "En. Faisal",
      officerRole: "PLANNING_OFFICER",
    });

    assert.strictEqual(snapshot.status, "VERIFIED");
    assert.strictEqual(snapshot.isLocked, true);
    assert.strictEqual(typeof snapshot.sha256Checksum, "string");
    assert.strictEqual(snapshot.sha256Checksum.length, 64);
  });

  it("2. Verified Comment: Integrity checker validates untampered snapshot", () => {
    const snapshot = VerifiedCommentImmutabilityEngine.createVerifiedCommentSnapshot({
      commentId: "vc-102",
      applicationId: "app-demo-003",
      draftId: "draft-002",
      contentMarkdown: "# Ulasan Rasmi Kompleks Komersial\nPetak TLK mencukupi.",
      officerUid: "officer-siti-uid",
      officerName: "Pn. Siti",
      officerRole: "OSC_OFFICER",
    });

    const check = VerifiedCommentImmutabilityEngine.verifySnapshotIntegrity(snapshot);
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.reason, "INTEGRITY_VERIFIED");
  });

  it("3. Verified Comment: Detects tampered content Markdown and fails integrity", () => {
    const snapshot = VerifiedCommentImmutabilityEngine.createVerifiedCommentSnapshot({
      commentId: "vc-103",
      applicationId: "app-demo-003",
      draftId: "draft-003",
      contentMarkdown: "Content Asal Disahkan",
      officerUid: "officer-faisal-uid",
      officerName: "En. Faisal",
      officerRole: "PLANNING_OFFICER",
    });

    // Tamper content
    const tampered = { ...snapshot, contentMarkdown: "Content Telah Diubah Secara Haram!" };
    const check = VerifiedCommentImmutabilityEngine.verifySnapshotIntegrity(tampered);

    assert.strictEqual(check.valid, false);
    assert.strictEqual(check.reason, "CHECKSUM_MISMATCH_TAMPERED");
  });

  it("4. Verified Comment Immutability: Block update or edit attempts on verified comment", () => {
    const snapshot = VerifiedCommentImmutabilityEngine.createVerifiedCommentSnapshot({
      commentId: "vc-104",
      applicationId: "app-demo-002",
      draftId: "draft-004",
      contentMarkdown: "Locked Comment",
      officerUid: "officer-faisal-uid",
      officerName: "En. Faisal",
      officerRole: "PLANNING_OFFICER",
    });

    const attempt = VerifiedCommentImmutabilityEngine.attemptUpdateVerifiedComment(
      snapshot,
      "New Illegal Text",
      "PLANNING_OFFICER"
    );

    assert.strictEqual(attempt.allowed, false);
    assert.ok(attempt.error.includes("IMMUTABLE_RECORD"));
  });

  it("5. Verified Comment Immutability: Block deletion attempts on verified comment", () => {
    const snapshot = VerifiedCommentImmutabilityEngine.createVerifiedCommentSnapshot({
      commentId: "vc-105",
      applicationId: "app-demo-002",
      draftId: "draft-005",
      contentMarkdown: "Locked Comment",
      officerUid: "officer-faisal-uid",
      officerName: "En. Faisal",
      officerRole: "PLANNING_OFFICER",
    });

    const attempt = VerifiedCommentImmutabilityEngine.attemptDeleteVerifiedComment(
      snapshot,
      "PLANNING_OFFICER"
    );

    assert.strictEqual(attempt.allowed, false);
    assert.ok(attempt.error.includes("IMMUTABLE_RECORD"));
  });

  it("6. Report Versioning: Report generation assigns version and SHA-256 fingerprint", () => {
    const report = ReportVersioningAndFreshnessEngine.generateReportRecord({
      reportId: "rep-001",
      applicationId: "app-demo-002",
      reportType: "SMARTCHECK_INTERNAL",
      smartCheckId: "sc-demo-002-v1",
      verifiedCommentId: "vc-101",
      generatedBy: "officer-faisal-uid",
      version: 1,
    });

    assert.strictEqual(report.reportVersion, 1);
    assert.strictEqual(report.status, "GENERATED");
    assert.strictEqual(report.visibility, "INTERNAL");
    assert.strictEqual(report.sha256Checksum.length, 64);
  });

  it("7. Report Freshness: Detects stale report when SmartCheck is re-run", () => {
    const report = ReportVersioningAndFreshnessEngine.generateReportRecord({
      reportId: "rep-002",
      applicationId: "app-demo-002",
      reportType: "SMARTCHECK_INTERNAL",
      smartCheckId: "sc-v1",
      verifiedCommentId: "vc-101",
      generatedBy: "officer-faisal-uid",
      version: 1,
    });

    // SmartCheck updated to sc-v2
    const check = ReportVersioningAndFreshnessEngine.evaluateReportFreshness(
      report,
      "sc-v2",
      "vc-101"
    );

    assert.strictEqual(check.isStale, true);
    assert.strictEqual(check.freshness, "STALE_SMARTCHECK_CHANGED");
  });

  it("8. Report Supersession: Creating new version marks previous report SUPERSEDED", () => {
    const v1Report = ReportVersioningAndFreshnessEngine.generateReportRecord({
      reportId: "rep-v1",
      applicationId: "app-demo-002",
      reportType: "SMARTCHECK_INTERNAL",
      smartCheckId: "sc-v1",
      verifiedCommentId: "vc-101",
      generatedBy: "officer-faisal-uid",
      version: 1,
    });

    const { updatedPrevious, newReport } = ReportVersioningAndFreshnessEngine.createSupersedingReport(
      v1Report,
      "rep-v2",
      "sc-v2",
      "officer-faisal-uid"
    );

    assert.strictEqual(updatedPrevious.status, "SUPERSEDED");
    assert.strictEqual(updatedPrevious.supersededByReportId, "rep-v2");
    assert.strictEqual(newReport.reportVersion, 2);
    assert.strictEqual(newReport.reportId, "rep-v2");
    assert.strictEqual(newReport.status, "GENERATED");
  });
});
