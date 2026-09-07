import { describe, it } from "node:test";
import assert from "node:assert";
import { verifyEvidenceQuotes, computeTextSimilarity } from "../../src/lib/extraction/geminiExtractor.ts";

describe("Anti-Hallucination Evidence Verification Tests", () => {
  const sampleDoc = {
    documentId: "doc-test-123",
    totalPages: 2,
    rawTextLength: 300,
    pages: [
      {
        pageNumber: 1,
        text: "CADANGAN PEMBANGUNAN HOTEL 12 TINGKAT DI ATAS LOT 1234, MUKIM KUAH, DAERAH LANGKAWI",
      },
      {
        pageNumber: 2,
        text: "Nisbah plot: 1:2.5. Liputan bangunan: 42%. Jumlah petak tempat letak kereta: 172 petak.",
      },
    ],
  };

  it("should compute high similarity for valid quotes and exact matches", () => {
    const sim = computeTextSimilarity(
      "Nisbah plot: 1:2.5",
      "Nisbah plot: 1:2.5. Liputan bangunan: 42%"
    );
    assert.ok(sim >= 0.8, `Expected similarity >= 0.8, got ${sim}`);
  });

  it("should verify valid quotes and preserve HIGH confidence and evidenceVerified: true", () => {
    const facts = [
      {
        factId: "lotNumber_v1",
        applicationId: "APP-001",
        documentId: "doc-test-123",
        documentVersion: 1,
        key: "lotNumber",
        label: "Nombor Lot",
        category: "SITE",
        value: "Lot 1234",
        unit: null,
        normalizedValue: "Lot 1234",
        status: "EXTRACTED",
        confidence: 0.95,
        confidenceLevel: "HIGH",
        sourceEvidence: [
          {
            documentId: "doc-test-123",
            documentVersion: 1,
            pageNumber: 1,
            quotedText: "LOT 1234, MUKIM KUAH",
            tableReference: null,
          },
        ],
        aiGenerated: true,
        confirmedValue: null,
        confirmedBy: null,
        confirmedAt: null,
        createdAt: "2026-09-07T00:00:00Z",
        updatedAt: "2026-09-07T00:00:00Z",
      },
    ];

    verifyEvidenceQuotes(facts, sampleDoc);

    assert.strictEqual(facts[0].evidenceVerified, true);
    assert.strictEqual(facts[0].sourceEvidence[0].evidenceVerified, true);
    assert.strictEqual(facts[0].confidenceLevel, "HIGH");
    assert.strictEqual(facts[0].confidence, 0.95);
  });

  it("should flag fabricated/unverifiable quote with evidenceVerified: false and downgrade confidence to LOW", () => {
    const facts = [
      {
        factId: "fakeFact_v1",
        applicationId: "APP-001",
        documentId: "doc-test-123",
        documentVersion: 1,
        key: "fakeKey",
        label: "Fakta Rekaan",
        category: "BUILDING",
        value: "99 Tingkat",
        unit: null,
        normalizedValue: 99,
        status: "EXTRACTED",
        confidence: 0.98,
        confidenceLevel: "HIGH",
        sourceEvidence: [
          {
            documentId: "doc-test-123",
            documentVersion: 1,
            pageNumber: 2,
            quotedText: "BANGUNAN 99 TINGKAT MENARA PENCAKAR LANGIT REKAAN GEMINI",
            tableReference: null,
          },
        ],
        aiGenerated: true,
        confirmedValue: null,
        confirmedBy: null,
        confirmedAt: null,
        createdAt: "2026-09-07T00:00:00Z",
        updatedAt: "2026-09-07T00:00:00Z",
      },
    ];

    verifyEvidenceQuotes(facts, sampleDoc);

    assert.strictEqual(facts[0].evidenceVerified, false);
    assert.strictEqual(facts[0].sourceEvidence[0].evidenceVerified, false);
    assert.strictEqual(facts[0].confidenceLevel, "LOW");
    assert.ok(facts[0].confidence <= 0.49);
  });
});
