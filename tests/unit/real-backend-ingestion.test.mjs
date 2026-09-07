import test from "node:test";
import assert from "node:assert/strict";

// Import mapping logic from AiDocumentIngestionZone
import { mapRealFactsToApplication } from "../../src/lib/extraction/factMapper.ts";

test("Module — Real Backend Ingestion Mapping & Zero-Fabrication Safeguards", async (t) => {
  await t.test("1. Successful real extraction populates fields correctly without fabrication", () => {
    const mockRealFacts = [
      {
        factId: "fact-1",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "projectTitle",
        label: "Tajuk Projek",
        category: "PROJECT",
        value: "Cadangan Pembangunan Blok Komersial 4 Tingkat",
        confidence: 0.95,
        confidenceLevel: "HIGH",
        status: "EXTRACTED",
        sourceEvidence: [{ documentId: "doc-1", documentVersion: 1, pageNumber: 1, quotedText: "Cadangan Pembangunan Blok Komersial" }],
      },
      {
        factId: "fact-2",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "developmentType",
        label: "Jenis Pembangunan",
        category: "PROJECT",
        value: "COMMERCIAL",
        confidence: 0.92,
        confidenceLevel: "HIGH",
        status: "EXTRACTED",
        sourceEvidence: [],
      },
      {
        factId: "fact-3",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "siteAreaSqm",
        label: "Keluasan Tapak",
        category: "AREA",
        value: 15400,
        confidence: 0.88,
        confidenceLevel: "HIGH",
        status: "EXTRACTED",
        sourceEvidence: [],
      },
      {
        factId: "fact-4",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "plotRatio",
        label: "Nisbah Plot",
        category: "INTENSITY",
        value: 2.5,
        confidence: 0.85,
        confidenceLevel: "MEDIUM",
        status: "EXTRACTED",
        sourceEvidence: [],
      },
    ];

    const { extractedData, extractedKeys, unextractedKeys, unextractedNotice } = mapRealFactsToApplication(mockRealFacts);

    assert.equal(extractedData.title, "Cadangan Pembangunan Blok Komersial 4 Tingkat");
    assert.equal(extractedData.developmentType, "COMMERCIAL");
    assert.equal(extractedData.siteInfo?.siteArea?.siteAreaSqm, 15400);
    assert.equal(extractedData.developmentParameters?.plotRatio, 2.5);

    assert.ok(extractedKeys.includes("projectTitle"));
    assert.ok(extractedKeys.includes("siteAreaSqm"));
    assert.ok(unextractedKeys.includes("lotNumber"));
    assert.ok(unextractedKeys.includes("carParkingProvided"));

    // Notice is present when any field is unextracted
    assert.equal(unextractedNotice, "Tidak dapat dikesan secara automatik — sila isi secara manual");
  });

  await t.test("2. Low confidence or unextracted facts leave fields empty with manual-entry notice", () => {
    const mockLowConfidenceFacts = [
      {
        factId: "fact-low-1",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "siteAreaSqm",
        label: "Keluasan Tapak",
        category: "AREA",
        value: 99999, // Should be ignored because confidence is LOW
        confidence: 0.3,
        confidenceLevel: "LOW",
        status: "EXTRACTED",
        sourceEvidence: [],
      },
      {
        factId: "fact-low-2",
        applicationId: "app-123",
        documentId: "doc-1",
        documentVersion: 1,
        key: "carParkingProvided",
        label: "Tempat Letak Kereta",
        category: "PARKING",
        value: null,
        confidence: 0,
        confidenceLevel: "LOW",
        status: "NOT_FOUND",
        sourceEvidence: [],
      },
    ];

    const { extractedData, unextractedKeys, unextractedNotice } = mapRealFactsToApplication(mockLowConfidenceFacts);

    // Verified: No value is populated for LOW confidence or NOT_FOUND facts!
    assert.equal(extractedData.siteInfo?.siteArea?.siteAreaSqm, undefined);
    assert.equal(extractedData.developmentParameters?.parkingProvided, undefined);
    assert.ok(unextractedKeys.includes("siteAreaSqm"));
    assert.ok(unextractedKeys.includes("carParkingProvided"));
    assert.equal(unextractedNotice, "Tidak dapat dikesan secara automatik — sila isi secara manual");
  });

  await t.test("3. No pseudo-random or hash-based fabrication functions exist in module", async () => {
    const fs = await import("node:fs");
    const content = fs.readFileSync("src/components/applications/AiDocumentIngestionZone.tsx", "utf8");

    // Verify pseudo-random generator functions were completely deleted
    assert.equal(content.includes("parseOrGenerateCustomPreset"), false, "parseOrGenerateCustomPreset must be deleted");
    assert.equal(content.includes("createFastFallbackPreset"), false, "createFastFallbackPreset must be deleted");
    assert.equal(content.includes("absHash %"), false, "Hash-based modulo arithmetic must be deleted");
  });
});
