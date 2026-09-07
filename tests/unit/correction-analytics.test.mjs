import { describe, it } from "node:test";
import assert from "node:assert";
import { getDemoCorrectionAnalytics, getFactCorrectionAnalytics } from "../../src/lib/extraction/correctionAnalytics.ts";

describe("Fact Correction Analytics Module", () => {
  it("should return demo correction analytics fallback structure with isDemoData: true when DB is not configured", async () => {
    const demoData = getDemoCorrectionAnalytics();
    assert.strictEqual(demoData.isDemoData, true, "Demo data should explicitly specify isDemoData: true");
    assert.strictEqual(typeof demoData.totalFactsCount, "number");
    assert.strictEqual(typeof demoData.totalCorrectionsCount, "number");
    assert.strictEqual(typeof demoData.overallCorrectionRate, "number");
    assert.ok(demoData.totalFactsCount > 0);
    assert.ok(demoData.totalCorrectionsCount > 0);
    assert.ok(Array.isArray(demoData.top5MostCorrectedFields));
    assert.ok(demoData.top5MostCorrectedFields.length <= 5);
    assert.ok(Array.isArray(demoData.sampleCorrections));
    assert.ok(demoData.sampleCorrections.length > 0);

    const firstSample = demoData.sampleCorrections[0];
    assert.ok(firstSample.key);
    assert.ok(firstSample.originalAiValue !== undefined);
    assert.ok(firstSample.correctedValue !== undefined);
  });

  it("should return isDemoData correctly in mock DB vs unconfigured DB case", async () => {
    const analytics = await getFactCorrectionAnalytics();
    assert.strictEqual(typeof analytics.isDemoData, "boolean");

    // Create a mock Firestore db with sample docs to test real DB code path
    const mockDocs = [
      {
        id: "fact-1",
        ref: { path: "applications/app-100/extractedFacts/fact-1" },
        data: () => ({
          key: "plotRatio",
          status: "MANUALLY_CORRECTED",
          value: 3.0,
          confirmedValue: 3.5,
          originalAiValue: 3.0,
          rejectionReason: "Jadual perancangan terkini",
          applicationId: "app-100",
        }),
      },
      {
        id: "fact-2",
        ref: { path: "applications/app-100/extractedFacts/fact-2" },
        data: () => ({
          key: "landAreaM2",
          status: "EXTRACTED",
          value: 15000,
          applicationId: "app-100",
        }),
      },
    ];

    const mockDb = {
      collectionGroup: () => ({
        get: async () => ({
          empty: false,
          forEach: (fn) => mockDocs.forEach(fn),
        }),
      }),
    };

    const realAnalytics = await getFactCorrectionAnalytics(mockDb);
    assert.strictEqual(realAnalytics.isDemoData, false, "Live DB analytics should return isDemoData: false");
    assert.strictEqual(realAnalytics.totalFactsCount, 2);
    assert.strictEqual(realAnalytics.totalCorrectionsCount, 1);
    assert.strictEqual(realAnalytics.overallCorrectionRate, 50.0);
    assert.strictEqual(realAnalytics.sampleCorrections.length, 1);
    assert.strictEqual(realAnalytics.sampleCorrections[0].originalAiValue, 3.0);
    assert.strictEqual(realAnalytics.sampleCorrections[0].correctedValue, 3.5);
  });
});
