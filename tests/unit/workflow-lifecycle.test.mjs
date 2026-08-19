import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  WORKFLOW_TRANSITION_RULES,
  validateStateTransition,
} from "../../src/lib/workflow/stateMachine.ts";
import {
  calculateBusinessDueTime,
} from "../../src/lib/workflow/serviceTargetService.ts";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  renderNotificationTemplate,
} from "../../src/lib/notifications/templates.ts";
import {
  CreateRfiSchema,
  AmendRfiSchema,
  ExtendRfiDeadlineSchema,
  SubmitApplicantResponseSchema,
  ReviewApplicantResponseSchema,
  CaseCompletionRequestSchema,
  ReopenCaseRequestSchema,
  CreateNotificationTemplateSchema,
} from "../../src/lib/validation/workflow.schema.ts";

describe("Module 14 — Workflow State Machine & Transition Rules", () => {
  const baseApp = {
    id: "app-100",
    applicationNo: "KM/2026/000100",
    title: "Cadangan Pembangunan Hotel 5 Bintang di Mukim Kedawang",
    developmentType: "HOTEL",
    district: "Langkawi",
    state: "Kedah",
    applicantUid: "user-applicant-1",
    status: "DRAFT",
    currentVersion: 1,
    landDetails: {
      lotNo: "Lot 1234",
      section: "Seksyen 5",
      mukim: "Kedawang",
      district: "Langkawi",
      state: "Kedah",
    },
    location: {
      latitude: 6.312,
      longitude: 99.789,
    },
  };

  test("1. Allows APPLICANT to transition DRAFT -> SUBMITTED for own application", () => {
    const rule = validateStateTransition(
      baseApp,
      "SUBMITTED",
      { uid: "user-applicant-1", role: "APPLICANT" }
    );
    assert.equal(rule.from, "DRAFT");
    assert.equal(rule.to, "SUBMITTED");
  });

  test("2. Blocks unauthorized applicant from submitting someone else's application", () => {
    assert.throws(
      () => {
        validateStateTransition(
          baseApp,
          "SUBMITTED",
          { uid: "other-user", role: "APPLICANT" }
        );
      },
      (err) => err.code === "PERMISSION_DENIED"
    );
  });

  test("3. Blocks illegal skipping of workflow states (DRAFT -> OFFICER_REVIEW)", () => {
    assert.throws(
      () => {
        validateStateTransition(
          baseApp,
          "OFFICER_REVIEW",
          { uid: "user-officer-1", role: "OSC_OFFICER" }
        );
      },
      (err) => err.code === "INVALID_TRANSITION"
    );
  });

  test("4. Allows OSC_OFFICER transition SUBMITTED -> DOCUMENT_CHECK", () => {
    const submittedApp = { ...baseApp, status: "SUBMITTED" };
    const rule = validateStateTransition(
      submittedApp,
      "DOCUMENT_CHECK",
      { uid: "user-officer-1", role: "OSC_OFFICER" }
    );
    assert.equal(rule.to, "DOCUMENT_CHECK");
  });

  test("5. Allows transition OFFICER_REVIEW -> REQUEST_INFORMATION with remarks", () => {
    const reviewApp = { ...baseApp, status: "OFFICER_REVIEW" };
    const rule = validateStateTransition(
      reviewApp,
      "REQUEST_INFORMATION",
      { uid: "user-officer-1", role: "OSC_OFFICER" },
      "Perlu pelan pinda tempat letak kenderaan."
    );
    assert.equal(rule.to, "REQUEST_INFORMATION");
  });

  test("6. Allows APPLICANT to transition REQUEST_INFORMATION -> RESUBMITTED", () => {
    const rfiApp = { ...baseApp, status: "REQUEST_INFORMATION" };
    const rule = validateStateTransition(
      rfiApp,
      "RESUBMITTED",
      { uid: "user-applicant-1", role: "APPLICANT" }
    );
    assert.equal(rule.to, "RESUBMITTED");
  });

  test("7. Allows OFFICER_REVIEW -> VERIFIED for compliant application", () => {
    const reviewApp = { ...baseApp, status: "OFFICER_REVIEW" };
    const rule = validateStateTransition(
      reviewApp,
      "VERIFIED",
      { uid: "user-officer-1", role: "PLANNING_OFFICER" }
    );
    assert.equal(rule.to, "VERIFIED");
  });

  test("8. Allows VERIFIED -> COMPLETED transition by authorized officer", () => {
    const verifiedApp = { ...baseApp, status: "VERIFIED" };
    const rule = validateStateTransition(
      verifiedApp,
      "COMPLETED",
      { uid: "user-officer-1", role: "OSC_OFFICER" }
    );
    assert.equal(rule.to, "COMPLETED");
  });

  test("9. Supports extended intermediate states (AWAITING_DOCUMENT_COMPLETION -> RESUBMITTED)", () => {
    const docWaitApp = { ...baseApp, status: "AWAITING_DOCUMENT_COMPLETION" };
    const rule = validateStateTransition(
      docWaitApp,
      "RESUBMITTED",
      { uid: "user-applicant-1", role: "APPLICANT" }
    );
    assert.equal(rule.to, "RESUBMITTED");
  });

  test("10. Supports RECHECK_REQUIRED state transitions", () => {
    const resubApp = { ...baseApp, status: "RESUBMITTED" };
    const rule = validateStateTransition(
      resubApp,
      "RECHECK_REQUIRED",
      { uid: "system", role: "SYSTEM" }
    );
    assert.equal(rule.to, "RECHECK_REQUIRED");
  });
});

describe("Module 14 — Service Target & Business Day Calculation", () => {
  test("11. Calculates business days correctly by skipping Saturday and Sunday", () => {
    // Friday Aug 21, 2026
    const friday = new Date(2026, 7, 21, 10, 0, 0);
    // + 2 business days -> Tuesday Aug 25, 2026
    const due = calculateBusinessDueTime(friday, 2, "BUSINESS_DAYS");
    assert.equal(due.getDay(), 2); // Tuesday
  });

  test("12. Calculates calendar hours correctly", () => {
    const start = new Date(2026, 7, 21, 10, 0, 0);
    const due = calculateBusinessDueTime(start, 24, "HOURS");
    assert.equal(due.getTime() - start.getTime(), 24 * 3600 * 1000);
  });

  test("13. Calculates business hours correctly", () => {
    const start = new Date(2026, 7, 21, 10, 0, 0); // Friday
    const due = calculateBusinessDueTime(start, 16, "BUSINESS_HOURS"); // 2 business days equivalent
    assert.equal(due.getDay(), 2); // Tuesday
  });
});

describe("Module 14 — Notification Template Rendering & Variable Safeguards", () => {
  test("14. Renders RFI_ISSUED template with dynamic variables", () => {
    const template = DEFAULT_NOTIFICATION_TEMPLATES.RFI_ISSUED;
    const rendered = renderNotificationTemplate(template, {
      applicationNo: "KM/2026/000100",
      requestTitle: "Pelan Pinda Tempat Letak Kereta",
      deadline: "30 Ogos 2026",
    });

    assert.ok(rendered.subject.includes("KM/2026/000100"));
    assert.ok(rendered.body.includes("Pelan Pinda Tempat Letak Kereta"));
    assert.ok(rendered.body.includes("30 Ogos 2026"));
  });

  test("15. Renders APPLICATION_COMPLETED template with statutory messaging", () => {
    const template = DEFAULT_NOTIFICATION_TEMPLATES.APPLICATION_COMPLETED;
    const rendered = renderNotificationTemplate(template, {
      applicationNo: "KM/2026/000100",
    });

    assert.ok(rendered.body.includes("selesai diproses sepenuhnya"));
    assert.ok(!rendered.body.includes("DILULUSKAN")); // Must NOT imply KM approval
  });

  test("16. Renders REPORT_PUBLISHED template", () => {
    const template = DEFAULT_NOTIFICATION_TEMPLATES.REPORT_PUBLISHED;
    const rendered = renderNotificationTemplate(template, {
      applicationNo: "KM/2026/000100",
    });
    assert.ok(rendered.subject.includes("Laporan Rasmi SmartCheck Diterbitkan"));
  });
});

describe("Module 14 — Validation Schemas & Governance Guardrails", () => {
  test("17. Validates CreateRfiSchema with valid inputs", () => {
    const valid = {
      requestType: "PLAN_AMENDMENT",
      title: "Pelan Pinda Anjakan Bangunan",
      description: "Sila kemukakan pelan anjakan hadapan minimum 6 meter.",
      responseDeadline: "2026-08-30",
    };
    const parsed = CreateRfiSchema.parse(valid);
    assert.equal(parsed.title, "Pelan Pinda Anjakan Bangunan");
  });

  test("18. Rejects CreateRfiSchema with too short title", () => {
    assert.throws(() => {
      CreateRfiSchema.parse({
        requestType: "DOCUMENT",
        title: "a",
        description: "valid description here",
      });
    });
  });

  test("19. Enforces statutory notice confirmation in CaseCompletionRequestSchema", () => {
    const valid = {
      remarks: "Selesai penilaian",
      confirmStatutoryNotice: true,
    };
    const parsed = CaseCompletionRequestSchema.parse(valid);
    assert.equal(parsed.confirmStatutoryNotice, true);

    assert.throws(() => {
      CaseCompletionRequestSchema.parse({
        remarks: "Selesai",
        confirmStatutoryNotice: false,
      });
    });
  });

  test("20. Validates ReviewApplicantResponseSchema actions", () => {
    const accept = ReviewApplicantResponseSchema.parse({
      action: "ACCEPT",
      reviewComment: "Maklum balas diterima dan lengkap.",
    });
    assert.equal(accept.action, "ACCEPT");

    const partial = ReviewApplicantResponseSchema.parse({
      action: "PARTIAL_ACCEPT",
      reviewComment: "Perlu dokumen sokongan tambahan.",
    });
    assert.equal(partial.action, "PARTIAL_ACCEPT");
  });

  test("21. Validates ExtendRfiDeadlineSchema", () => {
    const parsed = ExtendRfiDeadlineSchema.parse({
      newDeadline: "2026-09-15",
      reason: "Permohonan lanjutan masa daripada perunding arkitek.",
    });
    assert.equal(parsed.newDeadline, "2026-09-15");
  });

  test("22. Validates ReopenCaseRequestSchema", () => {
    const parsed = ReopenCaseRequestSchema.parse({
      reason: "Permintaan pindaan pelan susun atur pasca-kelulusan mesyuarat OSC.",
    });
    assert.ok(parsed.reason.includes("Permintaan pindaan"));
  });

  test("23. Validates CreateNotificationTemplateSchema", () => {
    const parsed = CreateNotificationTemplateSchema.parse({
      templateId: "TPL_CUSTOM_1",
      eventType: "RFI_ISSUED",
      channel: "IN_APP",
      language: "ms",
      subject: "Notifikasi Khas",
      body: "Kandungan notifikasi khas bagi {{applicationNo}}",
      allowedVariables: ["applicationNo"],
    });
    assert.equal(parsed.templateId, "TPL_CUSTOM_1");
  });
});
