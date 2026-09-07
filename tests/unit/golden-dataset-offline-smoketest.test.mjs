import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPlanningFactsFromDocument } from "../../src/lib/extraction/geminiExtractor.ts";

const OFFLINE_SMOKE_FIXTURE = {
  documentId: "doc-smoke-test",
  totalPages: 1,
  rawTextLength: 200,
  pages: [
    {
      pageNumber: 1,
      text: "CADANGAN PEMBANGUNAN DI ATAS LOT 1042, MUKIM KEDAWANG, DAERAH LANGKAWI. Keluasan Tapak: 18,500 m². Nisbah Plot: 1:2.5",
    },
  ],
};

describe("Offline Pipeline Self-Test", () => {
  it("should process offline normalized document through extraction pipeline", async () => {
    console.info("\n=======================================================");
    console.info("   OFFLINE SMOKE TEST — NOT AN ACCURACY BENCHMARK      ");
    console.info("   (Validates local code paths only; does not test live AI) ");
    console.info("=======================================================\n");

    const result = await extractPlanningFactsFromDocument(OFFLINE_SMOKE_FIXTURE, "APP-SMOKE", 1);
    assert.ok(Array.isArray(result.facts), "Facts should be returned as an array");
    assert.ok(result.facts.length > 0, "Should extract at least 1 fact from offline fixture");
  });
});
