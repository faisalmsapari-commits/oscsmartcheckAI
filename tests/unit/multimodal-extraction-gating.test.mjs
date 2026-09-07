import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPlanningFactsFromDocument } from "../../src/lib/extraction/geminiExtractor.ts";

describe("Multimodal Visual Extraction Gating Unit Tests", () => {
  const sampleDoc = {
    documentId: "doc-layout-01",
    totalPages: 1,
    rawTextLength: 100,
    pages: [
      {
        pageNumber: 1,
        text: "PELAN SUSUNATUR CADANGAN PEMBANGUNAN RESORT HARMONI LOT 1042 MUKIM KUAH LANGKAWI",
      },
    ],
  };

  it("should use text-only path for LCP documents", async () => {
    const res = await extractPlanningFactsFromDocument(sampleDoc, "APP-001", 1, {
      documentType: "LCP",
    });
    assert.strictEqual(res.isMultimodal, false);
  });

  it("should activate multimodal vision path for LAYOUT_PLAN when page images are provided", async () => {
    const res = await extractPlanningFactsFromDocument(sampleDoc, "APP-001", 1, {
      documentType: "LAYOUT_PLAN",
      pageImages: [
        {
          pageNumber: 1,
          mimeType: "image/jpeg",
          base64Data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ],
    });
    assert.strictEqual(res.isMultimodal, true);
  });

  it("should keep text-only path for LAYOUT_PLAN if no page images are provided", async () => {
    const res = await extractPlanningFactsFromDocument(sampleDoc, "APP-001", 1, {
      documentType: "LAYOUT_PLAN",
    });
    assert.strictEqual(res.isMultimodal, false);
  });
});
