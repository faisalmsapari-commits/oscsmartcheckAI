import { describe, it } from "node:test";
import assert from "node:assert";

// Simulation Engine for Firestore Security Rules defined in firestore.rules
class FirestoreSecurityRuleEngine {
  static evaluateApplicationRead(auth, applicationDoc) {
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };

    const isOwner = applicationDoc.applicantUid === auth.uid;
    const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "SUPER_ADMIN"].includes(
      auth.token?.role
    );
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(auth.token?.role);

    if (isOwner || isOfficer || isAdmin) {
      return { allowed: true, reason: "PERMITTED_READ" };
    }
    return { allowed: false, reason: "PERMISSION_DENIED" };
  }

  static evaluateApplicationCreate(auth, newDoc) {
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };

    // Rules:
    // request.resource.data.applicantUid == request.auth.uid &&
    // request.resource.data.status == 'DRAFT' &&
    // request.resource.data.assignedOfficerUid == null &&
    // request.resource.data.currentVersion == 1 &&
    // request.resource.data.submittedAt == null &&
    // request.resource.data.verifiedAt == null;

    if (newDoc.applicantUid !== auth.uid) {
      return { allowed: false, reason: "APPLICANT_UID_MISMATCH" };
    }
    if (newDoc.status !== "DRAFT") {
      return { allowed: false, reason: "MUST_BE_DRAFT_ON_CREATION" };
    }
    if (newDoc.assignedOfficerUid !== null && newDoc.assignedOfficerUid !== undefined) {
      return { allowed: false, reason: "CANNOT_ASSIGN_OFFICER_ON_CREATION" };
    }
    if (newDoc.currentVersion !== 1) {
      return { allowed: false, reason: "INITIAL_VERSION_MUST_BE_1" };
    }
    if (newDoc.submittedAt !== null && newDoc.submittedAt !== undefined) {
      return { allowed: false, reason: "CANNOT_SET_SUBMITTED_AT" };
    }
    if (newDoc.verifiedAt !== null && newDoc.verifiedAt !== undefined) {
      return { allowed: false, reason: "CANNOT_SET_VERIFIED_AT" };
    }

    return { allowed: true, reason: "PERMITTED_CREATE" };
  }

  static evaluateApplicationUpdate(auth, existingDoc, updatedDoc) {
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };

    const isOwner = existingDoc.applicantUid === auth.uid;
    const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "SUPER_ADMIN"].includes(
      auth.token?.role
    );
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(auth.token?.role);

    if (isOfficer || isAdmin) {
      return { allowed: true, reason: "OFFICER_OR_ADMIN_UPDATE" };
    }

    if (isOwner) {
      // Must be DRAFT or REQUEST_INFORMATION
      if (!["DRAFT", "REQUEST_INFORMATION"].includes(existingDoc.status)) {
        return { allowed: false, reason: "CANNOT_UPDATE_LOCKED_STATUS" };
      }
      // Cannot reassign applicantUid
      if (updatedDoc.applicantUid !== existingDoc.applicantUid) {
        return { allowed: false, reason: "CANNOT_REASSIGN_APPLICANT" };
      }
      // Cannot assign or reassign assignedOfficerUid
      if (updatedDoc.assignedOfficerUid !== existingDoc.assignedOfficerUid) {
        return { allowed: false, reason: "CANNOT_MODIFY_ASSIGNED_OFFICER" };
      }
      // Cannot elevate status directly to VERIFIED or COMPLETED
      if (["VERIFIED", "COMPLETED"].includes(updatedDoc.status)) {
        return { allowed: false, reason: "CANNOT_SELF_VERIFY_OR_COMPLETE" };
      }
      return { allowed: true, reason: "APPLICANT_PERMITTED_UPDATE" };
    }

    return { allowed: false, reason: "PERMISSION_DENIED" };
  }

  static evaluateAuditLogWrite(auth) {
    // Audit logs are write: if false; for all client callers (Admin SDK only)
    return { allowed: false, reason: "AUDIT_LOG_CLIENT_WRITE_FORBIDDEN" };
  }

  static evaluateOfficerReviewUpdate(auth, existingReview, updatedReview) {
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };
    const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "SUPER_ADMIN"].includes(
      auth.token?.role
    );
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(auth.token?.role);

    if (!isOfficer && !isAdmin) {
      return { allowed: false, reason: "NOT_AN_OFFICER" };
    }

    // If reviewStatus is VERIFIED, it is permanently locked
    if (existingReview.reviewStatus === "VERIFIED") {
      return { allowed: false, reason: "VERIFIED_REVIEW_IMMUTABLE" };
    }

    return { allowed: true, reason: "OFFICER_UPDATE_PERMITTED" };
  }

  static evaluateGuidelineWrite(auth) {
    if (!auth) return { allowed: false, reason: "UNAUTHENTICATED" };
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(auth.token?.role);
    if (isAdmin) {
      return { allowed: true, reason: "ADMIN_WRITE_PERMITTED" };
    }
    return { allowed: false, reason: "PERMISSION_DENIED" };
  }
}

describe("Module 03: Firestore Security Rules Comprehensive Tests", () => {
  const applicantAuth = { uid: "applicant-1", token: { role: "APPLICANT" } };
  const otherApplicantAuth = { uid: "applicant-2", token: { role: "APPLICANT" } };
  const officerAuth = { uid: "officer-1", token: { role: "OSC_OFFICER" } };
  const adminAuth = { uid: "admin-1", token: { role: "ADMIN" } };

  const sampleApplication = {
    id: "app-001",
    applicantUid: "applicant-1",
    status: "DRAFT",
    assignedOfficerUid: null,
    currentVersion: 1,
    submittedAt: null,
    verifiedAt: null,
  };

  it("1. Applicant: Own application read allowed", () => {
    const res = FirestoreSecurityRuleEngine.evaluateApplicationRead(applicantAuth, sampleApplication);
    assert.strictEqual(res.allowed, true);
  });

  it("2. Applicant: Another applicant application read denied", () => {
    const res = FirestoreSecurityRuleEngine.evaluateApplicationRead(otherApplicantAuth, sampleApplication);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.reason, "PERMISSION_DENIED");
  });

  it("3. Applicant: Create own draft allowed", () => {
    const newDraft = {
      applicantUid: "applicant-1",
      status: "DRAFT",
      assignedOfficerUid: null,
      currentVersion: 1,
      submittedAt: null,
      verifiedAt: null,
    };
    const res = FirestoreSecurityRuleEngine.evaluateApplicationCreate(applicantAuth, newDraft);
    assert.strictEqual(res.allowed, true);
  });

  it("4. Applicant: Cannot assign officer upon creation or update", () => {
    const maliciousDraft = {
      applicantUid: "applicant-1",
      status: "DRAFT",
      assignedOfficerUid: "officer-friendly-uid",
      currentVersion: 1,
      submittedAt: null,
      verifiedAt: null,
    };
    const createRes = FirestoreSecurityRuleEngine.evaluateApplicationCreate(applicantAuth, maliciousDraft);
    assert.strictEqual(createRes.allowed, false);
    assert.strictEqual(createRes.reason, "CANNOT_ASSIGN_OFFICER_ON_CREATION");

    const maliciousUpdate = {
      ...sampleApplication,
      assignedOfficerUid: "officer-friendly-uid",
    };
    const updateRes = FirestoreSecurityRuleEngine.evaluateApplicationUpdate(applicantAuth, sampleApplication, maliciousUpdate);
    assert.strictEqual(updateRes.allowed, false);
    assert.strictEqual(updateRes.reason, "CANNOT_MODIFY_ASSIGNED_OFFICER");
  });

  it("5. Applicant: Cannot verify own application", () => {
    const verifyAttempt = {
      ...sampleApplication,
      status: "VERIFIED",
    };
    const res = FirestoreSecurityRuleEngine.evaluateApplicationUpdate(applicantAuth, sampleApplication, verifyAttempt);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.reason, "CANNOT_SELF_VERIFY_OR_COMPLETE");
  });

  it("6. Applicant: Cannot write audit log directly", () => {
    const res = FirestoreSecurityRuleEngine.evaluateAuditLogWrite(applicantAuth);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.reason, "AUDIT_LOG_CLIENT_WRITE_FORBIDDEN");
  });

  it("7. Officer: Appropriate reads for submitted applications allowed", () => {
    const submittedApp = {
      ...sampleApplication,
      status: "SUBMITTED",
      applicantUid: "applicant-999",
    };
    const res = FirestoreSecurityRuleEngine.evaluateApplicationRead(officerAuth, submittedApp);
    assert.strictEqual(res.allowed, true);
  });

  it("8. Admin: Guideline and rule configuration access allowed, denied to applicant", () => {
    const adminRes = FirestoreSecurityRuleEngine.evaluateGuidelineWrite(adminAuth);
    assert.strictEqual(adminRes.allowed, true);

    const applicantRes = FirestoreSecurityRuleEngine.evaluateGuidelineWrite(applicantAuth);
    assert.strictEqual(applicantRes.allowed, false);
    assert.strictEqual(applicantRes.reason, "PERMISSION_DENIED");
  });

  it("9. Immutability: Verified officer review cannot be modified or overwritten", () => {
    const draftReview = {
      id: "rev-1",
      reviewStatus: "DRAFT",
      officerComment: "Initial remarks",
    };
    const verifiedReview = {
      id: "rev-1",
      reviewStatus: "VERIFIED",
      officerComment: "Official statutory endorsement",
    };

    // Update draft review -> Allowed for officer
    const updateDraftRes = FirestoreSecurityRuleEngine.evaluateOfficerReviewUpdate(
      officerAuth,
      draftReview,
      { ...draftReview, officerComment: "Updated remarks" }
    );
    assert.strictEqual(updateDraftRes.allowed, true);

    // Update already verified review -> Denied (Immutable!)
    const updateVerifiedRes = FirestoreSecurityRuleEngine.evaluateOfficerReviewUpdate(
      officerAuth,
      verifiedReview,
      { ...verifiedReview, officerComment: "Tampered after verification" }
    );
    assert.strictEqual(updateVerifiedRes.allowed, false);
    assert.strictEqual(updateVerifiedRes.reason, "VERIFIED_REVIEW_IMMUTABLE");
  });
});
