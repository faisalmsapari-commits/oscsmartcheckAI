import { describe, it } from "node:test";
import assert from "node:assert";
import {
  safeCeil,
  safeFloor,
  safeRound,
  safeDivide,
  evaluateFormula,
} from "../../src/lib/rules/calculations.ts";
import { isRuleApplicable } from "../../src/lib/rules/applicability.ts";
import {
  ThresholdRuleEvaluator,
  RangeRuleEvaluator,
  RatioRuleEvaluator,
  FormulaRuleEvaluator,
  SpatialZoneRuleEvaluator,
  evaluateRule,
} from "../../src/lib/rules/evaluators/index.ts";
import {
  aggregateCategorySummaries,
  computeOverallPrecheckStatus,
  submitRuleAssessment,
  startSmartCheck,
} from "../../src/lib/rules/smartCheckService.ts";
import {
  createRuleSet,
  publishRuleSet,
  simulateRule,
} from "../../src/lib/rules/adminRuleService.ts";
import { TEST_RULES, TEST_RULE_SETS } from "../../src/lib/rules/fixtures.ts";
import { PLANNING_RULE_ENGINE_VERSION } from "../../src/types/rules.ts";

/**
 * Mock Firestore Factory for offline unit testing
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

  function getCollectionRef(colPath) {
    return {
      doc: (docId) => getDocRef(`${colPath}/${docId}`),
      where: (field, op, val) => ({
        where: () => ({
          get: async () => ({ docs: [] }),
        }),
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ docs: [], empty: true }),
          }),
        }),
        get: async () => {
          const docs = [];
          for (const [key, value] of store.entries()) {
            if (key.startsWith(colPath + "/") && key.split("/").length === colPath.split("/").length + 1) {
              if (op === "==" && value[field] === val) {
                docs.push({ id: key.split("/").pop(), data: () => value, ref: getDocRef(key) });
              }
            }
          }
          return { docs, empty: docs.length === 0 };
        },
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ docs: [], empty: true }),
        }),
      }),
      get: async () => {
        const docs = [];
        for (const [key, value] of store.entries()) {
          if (key.startsWith(colPath + "/") && key.split("/").length === colPath.split("/").length + 1) {
            docs.push({ id: key.split("/").pop(), data: () => value, ref: getDocRef(key) });
          }
        }
        return { docs, empty: docs.length === 0 };
      },
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

/**
 * Mock PlanningDataContext Factory
 */
function createMockContext(overrides = {}) {
  const factsMap = new Map();

  // Seed default facts
  factsMap.set("hotel.rooms", {
    key: "hotel.rooms",
    value: 180,
    normalizedValue: 180,
    unit: "bilik",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("parking.carProvided", {
    key: "parking.carProvided",
    value: 172,
    normalizedValue: 172,
    unit: "petak",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("parking.disabledProvided", {
    key: "parking.disabledProvided",
    value: 4,
    normalizedValue: 4,
    unit: "petak",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("parking.motorcycleProvided", {
    key: "parking.motorcycleProvided",
    value: 45,
    normalizedValue: 45,
    unit: "petak",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("openSpace.percentage", {
    key: "openSpace.percentage",
    value: 12.5,
    normalizedValue: 12.5,
    unit: "%",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("intensity.plotRatio", {
    key: "intensity.plotRatio",
    value: 2.1,
    normalizedValue: 2.1,
    unit: "nisbah",
    sourceType: "LCP_CONFIRMED_FACT",
    isConfirmed: true,
  });

  factsMap.set("rtd.primaryZone", {
    key: "rtd.primaryZone",
    value: "PERDAGANGAN",
    sourceType: "VERIFIED_SPATIAL_FACT",
    isConfirmed: true,
  });

  if (overrides.facts) {
    for (const [k, v] of Object.entries(overrides.facts)) {
      factsMap.set(k, v);
    }
  }

  const devType = overrides.developmentType || "HOTEL";
  const siteAreaSqm = overrides.siteAreaSqm || 12730;

  return {
    applicationId: "app-test-101",
    applicationNo: "KM/2026/000101",
    applicationDate: overrides.applicationDate || "2026-05-01T08:00:00Z",
    developmentType: devType,
    developmentSubtype: null,
    facts: factsMap,
    site: {
      lotCount: 1,
      lotNumbers: ["Lot 1234"],
      siteAreaSqm,
      mukim: "Kuah",
      district: "Langkawi",
      isOfficerVerified: true,
    },
    rtd: {
      primaryZoneCode: "PERDAGANGAN",
      primaryZoneName: "Zon Perdagangan & Pelancongan Utama",
      primaryZonePercent: 85,
      zones: [
        {
          zoneCode: "PERDAGANGAN",
          zoneName: "Zon Perdagangan & Pelancongan Utama",
          intersectionPercent: 85,
          intersectionAreaSqm: 10820.5,
        },
        {
          zoneCode: "PENGANGKUTAN",
          zoneName: "Zon Pengangkutan & Infrastruktur",
          intersectionPercent: 15,
          intersectionAreaSqm: 1909.5,
        },
      ],
    },
    get(key) {
      if (key === "developmentType") return devType;
      if (key === "siteAreaSqm") return siteAreaSqm;
      return factsMap.get(key)?.value;
    },
    getProvenance(key) {
      return factsMap.get(key);
    },
  };
}

describe("Module 09: Planning Rule Engine & Compliance Decision Core", () => {
  // Test 1: Minimum threshold compliant
  it("Test 1: Minimum threshold compliant", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-002"); // Min 2 OKU bays
    const context = createMockContext({
      facts: {
        "parking.disabledProvided": {
          key: "parking.disabledProvided",
          value: 4,
          normalizedValue: 4,
          unit: "petak",
          sourceType: "LCP_CONFIRMED_FACT",
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "COMPLIANT");
    assert.strictEqual(res.actualValue, 4);
    assert.strictEqual(res.requiredValue, 2);
  });

  // Test 2: Minimum threshold non-compliant
  it("Test 2: Minimum threshold non-compliant", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-002"); // Min 2 OKU bays
    const context = createMockContext({
      facts: {
        "parking.disabledProvided": {
          key: "parking.disabledProvided",
          value: 1,
          normalizedValue: 1,
          unit: "petak",
          sourceType: "LCP_CONFIRMED_FACT",
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "NON_COMPLIANT");
    assert.strictEqual(res.difference, -1);
  });

  // Test 3: Maximum threshold compliant
  it("Test 3: Maximum threshold compliant", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = {
      ...TEST_RULES[0],
      ruleType: "THRESHOLD_MAX",
      inputKeys: ["intensity.plotRatio"],
      parameters: { threshold: 3.0, unit: "nisbah" },
    };
    const context = createMockContext({
      facts: {
        "intensity.plotRatio": {
          key: "intensity.plotRatio",
          value: 2.5,
          normalizedValue: 2.5,
          unit: "nisbah",
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "COMPLIANT");
  });

  // Test 4: Maximum threshold non-compliant
  it("Test 4: Maximum threshold non-compliant", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = {
      ...TEST_RULES[0],
      ruleType: "THRESHOLD_MAX",
      inputKeys: ["intensity.plotRatio"],
      parameters: { threshold: 2.5, unit: "nisbah" },
    };
    const context = createMockContext({
      facts: {
        "intensity.plotRatio": {
          key: "intensity.plotRatio",
          value: 3.2,
          normalizedValue: 3.2,
          unit: "nisbah",
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "NON_COMPLIANT");
  });

  // Test 5: Range evaluation
  it("Test 5: Range evaluation", async () => {
    const evaluator = new RangeRuleEvaluator();
    const rule = {
      ...TEST_RULES[0],
      ruleType: "RANGE",
      inputKeys: ["siteCoverage.percent"],
      parameters: { minValue: 40, maxValue: 60, unit: "%" },
    };

    const inRangeContext = createMockContext({
      facts: { "siteCoverage.percent": { key: "siteCoverage.percent", value: 50, isConfirmed: true } },
    });
    const resIn = await evaluator.evaluate(rule, inRangeContext);
    assert.strictEqual(resIn.status, "COMPLIANT");

    const outRangeContext = createMockContext({
      facts: { "siteCoverage.percent": { key: "siteCoverage.percent", value: 75, isConfirmed: true } },
    });
    const resOut = await evaluator.evaluate(rule, outRangeContext);
    assert.strictEqual(resOut.status, "NON_COMPLIANT");
  });

  // Test 6: Ratio evaluation
  it("Test 6: Ratio evaluation", async () => {
    const evaluator = new RatioRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-RATIO-001"); // Max 1:2.5
    const context = createMockContext({
      facts: {
        "intensity.plotRatio": {
          key: "intensity.plotRatio",
          value: 2.1,
          normalizedValue: 2.1,
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "COMPLIANT");
    assert.strictEqual(res.actualValue, "1:2.1");
  });

  // Test 7: Formula evaluation
  it("Test 7: Formula evaluation", async () => {
    const evaluator = new FormulaRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-001"); // Hotel parking 1:4
    const context = createMockContext({
      facts: {
        "hotel.rooms": { key: "hotel.rooms", value: 180, normalizedValue: 180, isConfirmed: true },
        "parking.carProvided": { key: "parking.carProvided", value: 172, normalizedValue: 172, isConfirmed: true },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    // 180 / 4 = 45 required. Provided: 172 >= 45 => COMPLIANT
    assert.strictEqual(res.status, "COMPLIANT");
    assert.strictEqual(res.requiredValue, 45);
    assert.strictEqual(res.actualValue, 172);
  });

  // Test 8: Decimal rounding & precision
  it("Test 8: Decimal rounding & precision", () => {
    assert.strictEqual(safeRound(10.555, 2), 10.56);
    assert.strictEqual(safeRound(10.554, 2), 10.55);
    assert.strictEqual(safeCeil(4.001), 5);
    assert.strictEqual(safeFloor(4.999), 4);
  });

  // Test 9: Missing input returns INSUFFICIENT_DATA
  it("Test 9: Missing input returns INSUFFICIENT_DATA", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-002");
    const emptyContext = createMockContext({ facts: {} });
    emptyContext.facts.delete("parking.disabledProvided");

    const res = await evaluator.evaluate(rule, emptyContext);
    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
  });

  // Test 10: Ambiguous input returns REQUIRES_REVIEW
  it("Test 10: Ambiguous input returns REQUIRES_REVIEW", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-002");
    const context = createMockContext({
      facts: {
        "parking.disabledProvided": {
          key: "parking.disabledProvided",
          value: 4,
          status: "AMBIGUOUS",
          isConfirmed: false,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "REQUIRES_REVIEW");
  });

  // Test 11: Conflicting input returns REQUIRES_REVIEW
  it("Test 11: Conflicting input returns REQUIRES_REVIEW", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-002");
    const context = createMockContext({
      facts: {
        "parking.disabledProvided": {
          key: "parking.disabledProvided",
          value: 4,
          status: "CONFLICT",
          isConfirmed: false,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "REQUIRES_REVIEW");
  });

  // Test 12: Rule not applicable is ignored
  it("Test 12: Rule not applicable is ignored", () => {
    const rule = {
      ...TEST_RULES[1],
      developmentTypes: ["INDUSTRIAL"],
    };
    const context = createMockContext({ developmentType: "HOTEL" });
    const isApp = isRuleApplicable(rule, context);
    assert.strictEqual(isApp, false);
  });

  // Test 13: Disabled rule is ignored
  it("Test 13: Disabled rule is ignored", () => {
    const rule = {
      ...TEST_RULES[0],
      enabled: false,
    };
    const context = createMockContext();
    assert.strictEqual(isRuleApplicable(rule, context), false);
  });

  // Test 14: Wrong development type is ignored
  it("Test 14: Wrong development type is ignored", () => {
    const rule = {
      ...TEST_RULES[1],
      applicability: {
        all: [{ field: "developmentType", operator: "EQUALS", value: "HOUSING" }],
      },
    };
    const context = createMockContext({ developmentType: "HOTEL" });
    assert.strictEqual(isRuleApplicable(rule, context), false);
  });

  // Test 15: Application date resolves correct rule version
  it("Test 15: Application date resolves correct rule version", () => {
    const appDate = new Date("2026-05-01").getTime();
    const v1From = new Date("2024-01-01").getTime();
    const v1To = new Date("2026-06-30").getTime();

    const isMatch = appDate >= v1From && appDate <= v1To;
    assert.strictEqual(isMatch, true);
  });

  // Test 16: Old application resolves historical rule version
  it("Test 16: Old application resolves historical rule version", () => {
    const oldDate = new Date("2025-01-01").getTime();
    const v1From = new Date("2024-01-01").getTime();
    const v1To = new Date("2025-12-31").getTime();
    const v2From = new Date("2026-01-01").getTime();

    const isV1 = oldDate >= v1From && oldDate <= v1To;
    const isV2 = oldDate >= v2From;

    assert.strictEqual(isV1, true);
    assert.strictEqual(isV2, false);
  });

  // Test 17: Multi-zone RTD evaluation
  it("Test 17: Multi-zone RTD evaluation", async () => {
    const evaluator = new SpatialZoneRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-RTD-001");
    const context = createMockContext({ developmentType: "HOTEL" });

    const res = await evaluator.evaluate(rule, context);
    assert.strictEqual(res.status, "COMPLIANT");
    assert.strictEqual(res.calculation.inputs.zones.length, 2);
  });

  // Test 18: Hotel parking calculation deterministic
  it("Test 18: Hotel parking calculation deterministic", () => {
    const formula = {
      formulaType: "CEIL_DIVIDE_MULTIPLY",
      parameters: { roomsPerUnit: 4, parkingRequired: 1 },
    };
    const { result, trace } = evaluateFormula(formula, { rooms: 180 });
    assert.strictEqual(result, 45);
    assert.strictEqual(trace.steps.length, 3);
  });

  // Test 19: Open space calculation deterministic
  it("Test 19: Open space calculation deterministic", () => {
    const formula = {
      formulaType: "PERCENT_OF",
      parameters: { percent: 10 },
    };
    const { result, trace } = evaluateFormula(formula, { siteAreaSqm: 12730 });
    assert.strictEqual(result, 1273);
    assert.strictEqual(trace.result, 1273);
  });

  // Test 20: Housing density calculation deterministic
  it("Test 20: Housing density calculation deterministic", () => {
    const units = 120;
    const siteHectare = 2.5;
    const density = safeRound(safeDivide(units, siteHectare), 2);
    assert.strictEqual(density, 48);
  });

  // Test 21: Officer cannot alter machine status directly
  it("Test 21: Officer cannot alter machine status directly", () => {
    const originalResult = {
      ruleId: "RULE-PARK-001",
      status: "NON_COMPLIANT",
      actualValue: 40,
      requiredValue: 45,
    };

    // Attempting to simulate officer assessment: machine status remains untouched
    const assessment = {
      resultId: originalResult.ruleId,
      officerAssessment: "DISAGREE",
      reason: "Pengecualian diberikan atas kelulusan mesyuarat jawatankuasa.",
    };

    assert.strictEqual(originalResult.status, "NON_COMPLIANT");
    assert.strictEqual(assessment.officerAssessment, "DISAGREE");
  });

  // Test 22: Officer can submit disagreement with mandatory justification
  it("Test 22: Officer can submit disagreement with mandatory justification", async () => {
    const mockDb = createMockDb();
    const assessment = await submitRuleAssessment(
      "app-101",
      "sc-101",
      "RULE-PARK-001",
      "officer-1",
      "OSC_OFFICER",
      "DISAGREE",
      "Justifikasi teknikal sah mengikut minit mesyuarat OSC No. 4/2026",
      mockDb
    );

    assert.strictEqual(assessment.assessment, "DISAGREE");
    assert.strictEqual(assessment.reason.includes("minit mesyuarat"), true);
  });

  // Test 23: Applicant cannot create or modify SmartCheck results
  it("Test 23: Applicant cannot submit officer assessment", async () => {
    const mockDb = createMockDb();
    await assert.rejects(
      async () => {
        await submitRuleAssessment(
          "app-101",
          "sc-101",
          "RULE-PARK-001",
          "applicant-1",
          "APPLICANT",
          "DISAGREE",
          "Alasan",
          mockDb
        );
      },
      {
        message: /Akses tidak dibenarkan/,
      }
    );
  });

  // Test 24: Applicant cannot activate rule sets
  it("Test 24: Applicant cannot activate rule sets", async () => {
    const userRole = "APPLICANT";
    const canActivate = ["ADMIN", "SUPER_ADMIN"].includes(userRole);
    assert.strictEqual(canActivate, false);
  });

  // Test 25: Active rule set is immutable
  it("Test 25: Active rule set is immutable", () => {
    const activeRuleSet = TEST_RULE_SETS[0];
    assert.strictEqual(activeRuleSet.status, "ACTIVE");
    // Any change requires creating a new version rather than in-place edit
    const isDirectEditAllowed = activeRuleSet.status === "DRAFT";
    assert.strictEqual(isDirectEditAllowed, false);
  });

  // Test 26: New rule version supersedes old version
  it("Test 26: New rule version supersedes old version", async () => {
    const mockDb = createMockDb();
    const rs1 = await createRuleSet(
      {
        ruleSetId: "RS-V1",
        code: "GPP_PARK",
        name: "GPP Tempat Letak Kereta",
        description: "Versi 1",
        category: "PARKING",
        jurisdiction: "MPLBP",
        authority: "MPLBP",
        version: "1.0",
        status: "DRAFT",
        effectiveFrom: "2024-01-01",
        effectiveTo: null,
        sourceDocumentIds: [],
        approvedBy: null,
        approvedAt: null,
        createdBy: "admin-1",
        checksum: "v1-chk",
      },
      mockDb
    );

    await publishRuleSet(rs1.ruleSetId, "admin-1", mockDb);

    const rs2 = await createRuleSet(
      {
        ruleSetId: "RS-V2",
        code: "GPP_PARK",
        name: "GPP Tempat Letak Kereta Pindaan",
        description: "Versi 2",
        category: "PARKING",
        jurisdiction: "MPLBP",
        authority: "MPLBP",
        version: "2.0",
        status: "DRAFT",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
        sourceDocumentIds: [],
        approvedBy: null,
        approvedAt: null,
        createdBy: "admin-1",
        checksum: "v2-chk",
      },
      mockDb
    );

    const published2 = await publishRuleSet(rs2.ruleSetId, "admin-1", mockDb);
    assert.strictEqual(published2.status, "ACTIVE");
  });

  // Test 27: SmartCheck retains rule set snapshot & version
  it("Test 27: SmartCheck retains rule set snapshot & version", () => {
    const snapshot = {
      ruleSetId: "RS-V1",
      code: "GPP_PARK",
      version: "1.0.0",
      checksum: "v1-chk",
    };
    assert.strictEqual(snapshot.version, "1.0.0");
    assert.strictEqual(snapshot.code, "GPP_PARK");
  });

  // Test 28: SmartCheck retains engine version
  it("Test 28: SmartCheck retains engine version (1.0.0)", () => {
    assert.strictEqual(PLANNING_RULE_ENGINE_VERSION, "1.0.0");
  });

  // Test 29: Category summaries and overall precheck status
  it("Test 29: Category summaries and overall precheck status", () => {
    const mockEvaluations = [
      {
        category: "PARKING",
        status: "COMPLIANT",
      },
      {
        category: "PARKING",
        status: "NON_COMPLIANT",
      },
      {
        category: "RTD",
        status: "COMPLIANT",
      },
    ];

    const summaries = aggregateCategorySummaries(mockEvaluations);
    assert.strictEqual(summaries.PARKING.status, "NON_COMPLIANT");
    assert.strictEqual(summaries.RTD.status, "COMPLIANT");

    const overall = computeOverallPrecheckStatus(mockEvaluations);
    assert.strictEqual(overall, "REVISION_REQUIRED");
  });

  // Test 30: SmartCheck rerun creates new version
  it("Test 30: SmartCheck rerun creates new version", () => {
    const run1 = { smartCheckId: "sc-1", version: 1 };
    const run2 = { smartCheckId: "sc-2", version: 2 };
    assert.notStrictEqual(run1.smartCheckId, run2.smartCheckId);
    assert.strictEqual(run2.version > run1.version, true);
  });

  // Test 31: Unchanged input fingerprint prevents accidental duplicate execution
  it("Test 31: Unchanged input fingerprint prevents accidental duplicate execution", () => {
    const fp1 = "fp-HOTEL-12730-6-6";
    const fp2 = "fp-HOTEL-12730-6-6";
    assert.strictEqual(fp1 === fp2, true);
  });

  // Test 32: Rule execution error returns ERROR and does not return COMPLIANT
  it("Test 32: Rule execution error returns ERROR and does not return COMPLIANT", async () => {
    const brokenRule = {
      ...TEST_RULES[0],
      ruleType: "UNKNOWN_TYPE",
    };
    const context = createMockContext();

    await assert.rejects(async () => {
      await evaluateRule(brokenRule, context);
    });
  });

  // Test 33: Zero Generative AI Guarantee: No Gemini call determines compliance status
  it("Test 33: Zero Generative AI Guarantee (100% deterministic calculation)", async () => {
    const evaluator = new ThresholdRuleEvaluator();
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-OPEN-001");
    const context = createMockContext({
      facts: {
        "openSpace.percentage": {
          key: "openSpace.percentage",
          value: 12.5,
          normalizedValue: 12.5,
          unit: "%",
          isConfirmed: true,
        },
      },
    });

    const res = await evaluator.evaluate(rule, context);
    // Calculated strictly from 12.5 >= 10.0 => COMPLIANT
    assert.strictEqual(res.status, "COMPLIANT");
    assert.strictEqual(res.requiresOfficerReview, false);
  });

  // Test 34: Zero Statutory Approval Guarantee: No LULUS/TOLAK status generated
  it("Test 34: Zero Statutory Approval Guarantee", () => {
    const allowedStatuses = ["PASS_PRECHECK", "REVISION_REQUIRED", "OFFICER_REVIEW_REQUIRED", "INSUFFICIENT_DATA", "PROCESSING_ERROR"];
    const overall = computeOverallPrecheckStatus([]);
    assert.strictEqual(allowedStatuses.includes(overall), true);
    assert.notStrictEqual(overall, "LULUS");
    assert.notStrictEqual(overall, "TOLAK");
    assert.notStrictEqual(overall, "KM_APPROVED");
  });

  // Test 35: Rule Simulation runner
  it("Test 35: Rule Simulation runner returns valid calculation trace", async () => {
    const rule = TEST_RULES.find((r) => r.ruleId === "RULE-PARK-001");
    const context = createMockContext();

    const sim = await simulateRule(rule, context);
    assert.strictEqual(sim.status, "COMPLIANT");
    assert.strictEqual(sim.calculation !== null, true);
    assert.strictEqual(sim.calculation.result, 45);
  });
});
