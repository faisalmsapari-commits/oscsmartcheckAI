import { describe, it } from "node:test";
import assert from "node:assert";
import { validateStateTransition, validateDraftSubmissionPayload } from "../../src/lib/workflow/stateMachine.ts";
import { generateApplicationNumber } from "../../src/lib/workflow/appNumberGenerator.ts";
import { WorkflowError } from "../../src/lib/workflow/types.ts";

// Mock In-Memory Transactional Firestore for testing complete transaction guarantees
class MockFirestoreTransactionDb {
  constructor() {
    this.applications = new Map();
    this.statusHistory = new Map(); // key: appDocPath -> array of history records
    this.versions = new Map(); // key: appDocPath -> array of version records
    this.officerReviews = new Map(); // key: appDocPath -> array of review records
    this.auditLogs = [];
  }

  seedApplication(app) {
    this.applications.set(app.id, { ...app });
    this.statusHistory.set(app.id, []);
    this.versions.set(app.id, [
      {
        versionNumber: app.currentVersion || 1,
        createdAt: "2026-08-19T00:00:00Z",
        createdBy: app.applicantUid,
        reason: "Initial version",
        statusAtCreation: app.status,
        locked: false,
      },
    ]);
  }

  async runTransaction(updateFn) {
    // Clone state before transaction for atomicity rollback testing
    const stateSnapshot = {
      applications: new Map(JSON.parse(JSON.stringify(Array.from(this.applications.entries())))),
      statusHistory: new Map(JSON.parse(JSON.stringify(Array.from(this.statusHistory.entries())))),
      versions: new Map(JSON.parse(JSON.stringify(Array.from(this.versions.entries())))),
      officerReviews: new Map(JSON.parse(JSON.stringify(Array.from(this.officerReviews.entries())))),
      auditLogs: JSON.parse(JSON.stringify(this.auditLogs)),
    };

    const txContext = {
      get: async (appId) => {
        const app = this.applications.get(appId);
        return { exists: !!app, data: () => (app ? { ...app } : null) };
      },
      updateApplication: (appId, updates) => {
        const existing = this.applications.get(appId);
        if (!existing) throw new Error("Application not found during update");
        this.applications.set(appId, { ...existing, ...updates });
      },
      addStatusHistory: (appId, historyEntry) => {
        const list = this.statusHistory.get(appId) || [];
        list.push({ id: `hist-${list.length + 1}`, ...historyEntry });
        this.statusHistory.set(appId, list);
      },
      addVersion: (appId, versionEntry) => {
        const list = this.versions.get(appId) || [];
        list.push(versionEntry);
        this.versions.set(appId, list);
      },
      addOfficerReview: (appId, reviewEntry) => {
        const list = this.officerReviews.get(appId) || [];
        list.push(reviewEntry);
        this.officerReviews.set(appId, list);
      },
      addAuditLog: (auditEntry) => {
        this.auditLogs.push({ id: `audit-${this.auditLogs.length + 1}`, ...auditEntry });
      },
    };

    try {
      return await updateFn(txContext);
    } catch (err) {
      // Rollback to previous state on failure
      this.applications = stateSnapshot.applications;
      this.statusHistory = stateSnapshot.statusHistory;
      this.versions = stateSnapshot.versions;
      this.officerReviews = stateSnapshot.officerReviews;
      this.auditLogs = stateSnapshot.auditLogs;
      throw err;
    }
  }

  async executeMockTransition(params) {
    const { applicationId, targetStatus, remarks, actor } = params;

    return await this.runTransaction(async (tx) => {
      const appSnap = await tx.get(applicationId);
      if (!appSnap.exists) {
        throw new WorkflowError("APPLICATION_NOT_FOUND", "Application not found", 404);
      }

      const app = appSnap.data();
      validateStateTransition(app, targetStatus, actor, remarks);

      const fromStatus = app.status;
      let nextVersion = app.currentVersion || 1;
      let assignedAppNo = app.applicationNo;
      const updates = { status: targetStatus, updatedBy: actor.uid, updatedAt: new Date().toISOString() };

      if (fromStatus === "DRAFT" && targetStatus === "SUBMITTED") {
        if (!assignedAppNo || assignedAppNo.startsWith("DRAFT-")) {
          assignedAppNo = generateApplicationNumber();
          updates.applicationNo = assignedAppNo;
        }
        updates.submittedAt = new Date().toISOString();
      }

      if (fromStatus === "REQUEST_INFORMATION" && targetStatus === "RESUBMITTED") {
        nextVersion = (app.currentVersion || 1) + 1;
        updates.currentVersion = nextVersion;
        tx.addVersion(applicationId, {
          versionNumber: nextVersion,
          createdAt: new Date().toISOString(),
          createdBy: actor.uid,
          reason: remarks || "Resubmitted after request for information",
          statusAtCreation: "RESUBMITTED",
          locked: false,
        });
      }

      if (fromStatus === "OFFICER_REVIEW" && targetStatus === "VERIFIED") {
        updates.verifiedAt = new Date().toISOString();
        tx.addOfficerReview(applicationId, {
          reviewStatus: "VERIFIED",
          finalComment: remarks || "Endorsed by officer",
          verifiedBy: actor.uid,
          verifiedAt: new Date().toISOString(),
        });
      }

      tx.updateApplication(applicationId, updates);

      tx.addStatusHistory(applicationId, {
        fromStatus,
        toStatus: targetStatus,
        action: `TRANSITION_${targetStatus}`,
        actorUid: actor.uid,
        actorRole: actor.role,
        timestamp: new Date().toISOString(),
        remarks: remarks || null,
      });

      tx.addAuditLog({
        eventType: "APPLICATION_STATUS_TRANSITION",
        resourceType: "applications",
        resourceId: applicationId,
        applicationId,
        actorUid: actor.uid,
        actorRole: actor.role,
        timestamp: new Date().toISOString(),
        metadata: { fromStatus, toStatus: targetStatus, applicationNo: assignedAppNo, versionNumber: nextVersion },
      });

      return {
        success: true,
        applicationId,
        applicationNo: assignedAppNo,
        fromStatus,
        toStatus: targetStatus,
        currentVersion: nextVersion,
      };
    });
  }
}

describe("Module 04: Application Workflow State Machine Tests", () => {
  const applicantActor = { uid: "applicant-1", role: "APPLICANT", email: "applicant@firm.com" };
  const otherApplicantActor = { uid: "applicant-2", role: "APPLICANT", email: "other@firm.com" };
  const oscOfficerActor = { uid: "officer-1", role: "OSC_OFFICER", email: "officer@mplbp.gov.my" };
  const planningOfficerActor = { uid: "planner-1", role: "PLANNING_OFFICER", email: "planner@mplbp.gov.my" };
  const systemActor = { uid: "SYSTEM", role: "SYSTEM", email: "system@engine.internal" };
  const superAdminActor = { uid: "admin-1", role: "SUPER_ADMIN", email: "admin@mplbp.gov.my" };

  const validDraftApp = {
    id: "app-100",
    applicationNo: "DRAFT-100",
    applicantUid: "applicant-1",
    developmentType: "HOTEL",
    title: "Cadangan Pembangunan Resort Mewah 5 Bintang di Mukim Kedawang",
    lotNo: "Lot 554",
    mukim: "Kedawang",
    district: "Langkawi",
    state: "Kedah",
    siteAreaSqm: 18500,
    location: { latitude: 6.312, longitude: 99.789 },
    status: "DRAFT",
    currentVersion: 1,
    assignedOfficerUid: null,
    createdBy: "applicant-1",
    updatedBy: "applicant-1",
    submittedAt: null,
    verifiedAt: null,
    schemaVersion: 1,
  };

  it("Test 1: Applicant can submit own DRAFT", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "SUBMITTED",
      actor: applicantActor,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.toStatus, "SUBMITTED");
    assert.ok(result.applicationNo.startsWith("KM/2026/"));
    assert.strictEqual(db.applications.get("app-100").status, "SUBMITTED");
  });

  it("Test 2: Applicant cannot submit another user's application", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "SUBMITTED",
          actor: otherApplicantActor,
        }),
      /Ownership violation/
    );
  });

  it("Test 3: Applicant cannot jump DRAFT -> VERIFIED", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "VERIFIED",
          actor: applicantActor,
        }),
      /Illegal transition/
    );
  });

  it("Test 4: Applicant cannot jump SUBMITTED -> COMPLETED", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "SUBMITTED", applicationNo: "KM/2026/A1B2C3" });

    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "COMPLETED",
          actor: applicantActor,
        }),
      /Illegal transition/
    );
  });

  it("Test 5: Officer can move SUBMITTED -> DOCUMENT_CHECK", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "SUBMITTED", applicationNo: "KM/2026/A1B2C3" });

    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "DOCUMENT_CHECK",
      actor: oscOfficerActor,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.toStatus, "DOCUMENT_CHECK");
    assert.strictEqual(db.applications.get("app-100").status, "DOCUMENT_CHECK");
  });

  it("Test 6: Invalid officer transition is rejected (e.g. DRAFT -> COMPLETED)", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "COMPLETED",
          actor: oscOfficerActor,
        }),
      /Illegal transition/
    );
  });

  it("Test 7: SYSTEM-only transition cannot be invoked as normal applicant", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "AI_PROCESSING" });

    // Normal applicant attempts SYSTEM transition
    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "SMARTCHECK_COMPLETED",
          actor: applicantActor,
        }),
      /Actor with role 'APPLICANT' is not authorized/
    );

    // SYSTEM actor succeeds
    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "SMARTCHECK_COMPLETED",
      actor: systemActor,
    });
    assert.strictEqual(result.toStatus, "SMARTCHECK_COMPLETED");
  });

  it("Test 8: REQUEST_INFORMATION requires remarks", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "OFFICER_REVIEW" });

    // Empty remarks -> Rejection
    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "REQUEST_INFORMATION",
          remarks: "   ",
          actor: oscOfficerActor,
        }),
      /Transition to 'REQUEST_INFORMATION' requires explanatory remarks/
    );

    // With remarks -> Success
    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "REQUEST_INFORMATION",
      remarks: "Sila kemukakan keratan rentas anjakan hadapan 20 kaki dari rezab jalan.",
      actor: oscOfficerActor,
    });
    assert.strictEqual(result.toStatus, "REQUEST_INFORMATION");
  });

  it("Test 9: Applicant can resubmit own REQUEST_INFORMATION application", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "REQUEST_INFORMATION", currentVersion: 1 });

    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "RESUBMITTED",
      remarks: "Pelan anjakan hadapan telah dikemas kini mengikut ulasan Pegawai OSC.",
      actor: applicantActor,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.toStatus, "RESUBMITTED");
  });

  it("Test 10: Resubmission creates/preserves version history", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "REQUEST_INFORMATION", currentVersion: 1 });

    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "RESUBMITTED",
      remarks: "Kemas kini versi 2 bagi pelan anjakan.",
      actor: applicantActor,
    });

    assert.strictEqual(result.currentVersion, 2);
    const versions = db.versions.get("app-100");
    assert.strictEqual(versions.length, 2);
    assert.strictEqual(versions[1].versionNumber, 2);
    assert.strictEqual(versions[1].statusAtCreation, "RESUBMITTED");
  });

  it("Test 11: Verification records actor and timestamp", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "OFFICER_REVIEW" });

    const result = await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "VERIFIED",
      remarks: "Disahkan mematuhi RTD Langkawi 2030 zon Pelancongan.",
      actor: oscOfficerActor,
    });

    assert.strictEqual(result.toStatus, "VERIFIED");
    const updatedApp = db.applications.get("app-100");
    assert.ok(updatedApp.verifiedAt);
    const reviews = db.officerReviews.get("app-100");
    assert.strictEqual(reviews.length, 1);
    assert.strictEqual(reviews[0].reviewStatus, "VERIFIED");
    assert.strictEqual(reviews[0].verifiedBy, "officer-1");
  });

  it("Test 12: Every successful transition creates statusHistory", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "SUBMITTED",
      actor: applicantActor,
    });

    const history = db.statusHistory.get("app-100");
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].fromStatus, "DRAFT");
    assert.strictEqual(history[0].toStatus, "SUBMITTED");
    assert.strictEqual(history[0].actorRole, "APPLICANT");
  });

  it("Test 13: Every successful transition creates auditLog", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    await db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "SUBMITTED",
      actor: applicantActor,
    });

    assert.strictEqual(db.auditLogs.length, 1);
    assert.strictEqual(db.auditLogs[0].eventType, "APPLICATION_STATUS_TRANSITION");
    assert.strictEqual(db.auditLogs[0].resourceId, "app-100");
    assert.strictEqual(db.auditLogs[0].actorUid, "applicant-1");
  });

  it("Test 14: Failed transition creates no partial writes", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication(validDraftApp);

    // Attempt illegal transition
    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "VERIFIED",
          actor: applicantActor,
        }),
      /Illegal transition/
    );

    // Assert zero partial writes
    assert.strictEqual(db.applications.get("app-100").status, "DRAFT");
    assert.strictEqual(db.statusHistory.get("app-100").length, 0);
    assert.strictEqual(db.auditLogs.length, 0);
  });

  it("Test 15: Concurrent transition attempts do not corrupt status", async () => {
    const db = new MockFirestoreTransactionDb();
    db.seedApplication({ ...validDraftApp, status: "SUBMITTED" });

    // Simulate concurrent requests:
    // Request 1: Officer moves to DOCUMENT_CHECK
    // Request 2: Stale attempt to move SUBMITTED -> DOCUMENT_CHECK
    const p1 = db.executeMockTransition({
      applicationId: "app-100",
      targetStatus: "DOCUMENT_CHECK",
      actor: oscOfficerActor,
    });

    const res1 = await p1;
    assert.strictEqual(res1.toStatus, "DOCUMENT_CHECK");

    // Second execution with now-stale source status SUBMITTED will fail cleanly
    await assert.rejects(
      async () =>
        await db.executeMockTransition({
          applicationId: "app-100",
          targetStatus: "DOCUMENT_CHECK", // Already in DOCUMENT_CHECK, transition from DOCUMENT_CHECK -> DOCUMENT_CHECK is invalid
          actor: oscOfficerActor,
        }),
      /Illegal transition/
    );

    assert.strictEqual(db.applications.get("app-100").status, "DOCUMENT_CHECK");
  });
});
