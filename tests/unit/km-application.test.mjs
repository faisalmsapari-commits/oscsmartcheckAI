import { describe, it } from "node:test";
import assert from "node:assert";
import { convertToSqm, formatArea } from "../../src/lib/utils/areaConverter.ts";
import {
  DraftApplicationFormSchema,
  StrictSubmitApplicationSchema,
  LotDetailSchema,
  DevelopmentParametersSchema,
} from "../../src/lib/validation/application.schema.ts";
import { validateStateTransition } from "../../src/lib/workflow/stateMachine.ts";
import { generateApplicationNumber } from "../../src/lib/workflow/appNumberGenerator.ts";

describe("Phase 05: New KM Application & Applicant Submission Tests", () => {
  // 1. Site Area Conversion Tests
  describe("1. Site Area Normalization Engine", () => {
    it("should accurately convert SQM, HECTARE and ACRE to normalized square meters", () => {
      // 1. SQM (1:1)
      assert.strictEqual(convertToSqm(2500, "SQM"), 2500);

      // 2. HECTARE (1 Ha = 10,000 m²)
      assert.strictEqual(convertToSqm(1.5, "HECTARE"), 15000);
      assert.strictEqual(convertToSqm(0.25, "HECTARE"), 2500);

      // 3. ACRE (1 Acre = 4,046.86 m²)
      assert.strictEqual(convertToSqm(2.0, "ACRE"), 8093.72);
      assert.strictEqual(convertToSqm(0.5, "ACRE"), 2023.43);

      // 4. Handles null, undefined and negative values safely
      assert.strictEqual(convertToSqm(null, "SQM"), null);
      assert.strictEqual(convertToSqm(undefined, "HECTARE"), null);
      assert.strictEqual(convertToSqm(-50, "ACRE"), null);
    });

    it("should format area strings with correct localized labels", () => {
      assert.strictEqual(formatArea(15000, "SQM"), "15,000 m²");
      assert.strictEqual(formatArea(null), "-");
    });
  });

  // 2. Lot Validation & Multi-Lot Management
  describe("2. Multi-Lot Management & Validation", () => {
    it("should validate valid lot detail records", () => {
      const validLot = {
        lotNumber: "Lot 1082",
        mukim: "Padang Matsirat",
        titleNumber: "GM 542",
        landStatus: "HAKMILIK_KEKAL",
      };

      const parsed = LotDetailSchema.parse(validLot);
      assert.strictEqual(parsed.lotNumber, "Lot 1082");
      assert.strictEqual(parsed.mukim, "Padang Matsirat");
    });

    it("should reject lot records with missing lot number or mukim", () => {
      assert.throws(() => LotDetailSchema.parse({ lotNumber: "", mukim: "Kuah" }));
      assert.throws(() => LotDetailSchema.parse({ lotNumber: "Lot 12", mukim: "" }));
    });
  });

  // 3. Draft vs Strict Submission Schemas
  describe("3. Draft vs Submission Form Validation", () => {
    it("should allow partial saves under DraftApplicationFormSchema", () => {
      const partialDraft = {
        title: "Draf Cadangan Hotel",
        planningApplicationCategory: "PELANCONGAN",
        submissionTitle: "Cadangan Hotel",
        projectInfo: {
          projectName: "Hotel Butik Pantai Cenang",
          developmentType: "HOTEL",
        },
      };

      const parsed = DraftApplicationFormSchema.parse(partialDraft);
      assert.strictEqual(parsed.planningApplicationCategory, "PELANCONGAN");
      assert.strictEqual(parsed.projectInfo.developmentType, "HOTEL");
    });

    it("should reject statutory submission when mandatory fields are missing", () => {
      const incompleteSubmission = {
        title: "Draf Ringkas",
        developmentType: "HOTEL",
        district: "Langkawi",
        state: "Kedah",
        applicantUid: "applicant-123",
        siteInfo: {
          lots: [], // Missing required lot
          mukim: "Kuah",
          district: "Langkawi",
          state: "Kedah",
          siteArea: {
            originalValue: 0,
            originalUnit: "SQM",
            siteAreaSqm: 0,
          },
        },
        declaration: {
          declarationAccepted: false, // Missing declaration
        },
      };

      assert.throws(() => StrictSubmitApplicationSchema.parse(incompleteSubmission));
    });

    it("should accept valid submission satisfying all statutory criteria", () => {
      const validSubmission = {
        title: "Cadangan Pembangunan Hotel 5 Bintang di Mukim Kedawang",
        developmentType: "HOTEL",
        district: "Langkawi",
        state: "Kedah",
        applicantUid: "applicant-123",
        siteInfo: {
          lots: [
            { lotNumber: "Lot 554", mukim: "Kedawang", titleNumber: "GM 100", landStatus: "HAKMILIK_KEKAL" },
            { lotNumber: "Lot 555", mukim: "Kedawang", titleNumber: "GM 101", landStatus: "HAKMILIK_KEKAL" },
          ],
          mukim: "Kedawang",
          district: "Langkawi",
          state: "Kedah",
          siteArea: {
            originalValue: 2.5,
            originalUnit: "HECTARE",
            siteAreaSqm: 25000,
          },
        },
        declaration: {
          declarationAccepted: true,
        },
      };

      const parsed = StrictSubmitApplicationSchema.parse(validSubmission);
      assert.strictEqual(parsed.siteInfo.lots.length, 2);
      assert.strictEqual(parsed.declaration.declarationAccepted, true);
    });
  });

  // 4. Parameter Pembangunan
  describe("4. Structured Development Parameters", () => {
    it("should parse development parameters and tag source as APPLICANT", () => {
      const params = {
        totalDevelopmentUnits: 80,
        hotelRooms: 80,
        grossFloorAreaSqm: 6500,
        plotRatio: 1.5,
        siteCoveragePercent: 45,
        parkingProvided: 100,
      };

      const parsed = DevelopmentParametersSchema.parse(params);
      assert.strictEqual(parsed.source, "APPLICANT");
      assert.strictEqual(parsed.hotelRooms, 80);
      assert.strictEqual(parsed.plotRatio, 1.5);
    });
  });

  // 5. State Machine Transition & Immutability Integration
  describe("5. Application Submission & Immutability Enforcement", () => {
    const applicant = { uid: "applicant-123", role: "APPLICANT", email: "applicant@firm.com" };
    const otherApplicant = { uid: "other-applicant-999", role: "APPLICANT", email: "other@firm.com" };

    const validDraftApp = {
      id: "app-km-001",
      applicationNo: "DRAFT-KM-001",
      applicantUid: "applicant-123",
      developmentType: "HOTEL",
      title: "Cadangan Mendirikan Resort di Mukim Kedawang",
      lotNo: "Lot 554, Lot 555",
      mukim: "Kedawang",
      district: "Langkawi",
      state: "Kedah",
      siteAreaSqm: 25000,
      location: { latitude: 6.312, longitude: 99.789 },
      status: "DRAFT",
      currentVersion: 1,
      assignedOfficerUid: null,
      createdBy: "applicant-123",
      updatedBy: "applicant-123",
      submittedAt: null,
      verifiedAt: null,
      schemaVersion: 1,
    };

    it("should permit applicant to transition valid DRAFT to SUBMITTED", () => {
      const rule = validateStateTransition(validDraftApp, "SUBMITTED", applicant);
      assert.strictEqual(rule.from, "DRAFT");
      assert.strictEqual(rule.to, "SUBMITTED");

      const officialAppNo = generateApplicationNumber();
      assert.ok(officialAppNo.startsWith("KM/2026/"));
    });

    it("should reject transition if attempted by a different applicant (ownership security check)", () => {
      assert.throws(
        () => validateStateTransition(validDraftApp, "SUBMITTED", otherApplicant),
        /Ownership violation/
      );
    });

    it("should reject transition if application is already SUBMITTED", () => {
      const submittedApp = {
        ...validDraftApp,
        status: "SUBMITTED",
        applicationNo: "KM/2026/A9B8C7",
      };

      // Applicant cannot edit or re-submit already SUBMITTED application
      assert.throws(
        () => validateStateTransition(submittedApp, "SUBMITTED", applicant),
        /Illegal transition/
      );
    });
  });
});
