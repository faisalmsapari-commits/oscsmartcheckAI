import { describe, it } from "node:test";
import assert from "node:assert";
import { getDemoCorrectionAnalytics, getFactCorrectionAnalytics } from "../../src/lib/extraction/correctionAnalytics.ts";

describe("Fact Correction Analytics Module", () => {
  it("should return demo correction analytics fallback structure when DB is not configured", async () => {
    const demoData = getDemoCorrectionAnalytics();
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

  it("should calculate correction analytics via getFactCorrectionAnalytics", async () => {
    const analytics = await getFactCorrectionAnalytics();
    assert.ok(analytics.overallCorrectionRate >= 0);
    assert.ok(analytics.top5MostCorrectedFields.length <= 5);
  });
});
