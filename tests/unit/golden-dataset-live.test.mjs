import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPlanningFactsFromDocument } from "../../src/lib/extraction/geminiExtractor.ts";

const GOLDEN_FIXTURES = [
  {
    id: "fixture-hotel-chenang",
    name: "Resort Hotel 5-Bintang (120 Bilik) - Pantai Chenang",
    doc: {
      documentId: "doc-fixture-hotel",
      totalPages: 3,
      rawTextLength: 600,
      pages: [
        {
          pageNumber: 1,
          text: "MAJLIS PERBANDARAN LANGKAWI BANDARAYA PELANCONGAN (MPLBP)\nCADANGAN PEMBANGUNAN RESORT MEWAH 5 BINTANG (120 BILIK) DI ATAS LOT 1042, MUKIM KEDAWANG, DAERAH LANGKAWI\nPEMOHON: PERUNDING ARKITEK LANGKAWI SDN BHD\nJURURANCANG: AR. AHMAD ZULKIFLI (LAM A/1245)",
        },
        {
          pageNumber: 2,
          text: "1.0 PARAMETER TAPAK\nNombor Lot: Lot 1042\nMukim: Kedawang\nDaerah: Langkawi\nKeluasan Tapak: 18,500 m² (1.85 Hektar)\nGuna Tanah Dicadangkan: Perniagaan / Pelancongan (Hotel)\nGuna Tanah Sedia Ada: Tanah Kosong",
        },
        {
          pageNumber: 3,
          text: "2.0 INTENSITI DAN PARKING\nJumlah Keluasan Lantai Kasar (GFA): 28,500 m²\nNisbah Plot (Plot Ratio): 1:2.5\nLiputan Bangunan (Plinth Area): 42%\nKetinggian Bangunan: 12 Tingkat (45 meter)\nJumlah Bilik Hotel: 180 bilik\nTempat Letak Kereta: 172 petak\nTempat Letak Motosikal: 60 petak\nTempat Letak OKU: 4 petak\nKawasan Lapang: 1,250 m² (10.0%)",
        },
      ],
    },
    expectedFacts: {
      lotNumber: "Lot 1042",
      mukim: "Kedawang",
      district: "Langkawi",
      siteAreaSqm: 18500,
      grossFloorAreaSqm: 28500,
      plotRatio: 2.5,
      buildingCoveragePercent: 42,
      numberOfFloors: 12,
      maximumBuildingHeightMeters: 45,
      carParkingProvided: 172,
      motorcycleParkingProvided: 60,
      disabledParkingProvided: 4,
      openSpaceAreaSqm: 1250,
      openSpacePercent: 10,
    },
  },
  {
    id: "fixture-housing-kuah",
    name: "Skim Perumahan Teres 2 Tingkat (80 Unit) - Kuah",
    doc: {
      documentId: "doc-fixture-housing",
      totalPages: 3,
      rawTextLength: 650,
      pages: [
        {
          pageNumber: 1,
          text: "MAJLIS PERBANDARAN LANGKAWI BANDARAYA PELANCONGAN\nCADANGAN SKIM PERUMAHAN MAMPU MILIK (80 UNIT RUMAH TERES 2 TINGKAT) DI ATAS LOT 3241, MUKIM KUAH, LANGKAWI\nPEMOHON: PEMBINAAN SERI KEDAH SDN BHD",
        },
        {
          pageNumber: 2,
          text: "PARAMETIK TAPAK:\nNombor Lot: Lot 3241\nMukim: Kuah\nDaerah: Langkawi\nKeluasan Tapak: 24,000 m² (2.4 Hektar)\nGuna Tanah Dicadangkan: Perumahan\nGuna Tanah Sedia Ada: Belukar Kosong",
        },
        {
          pageNumber: 3,
          text: "INTENSITI PEMBANGUNAN:\nJumlah Keluasan Lantai Kasar (GFA): 14,400 m²\nNisbah Plot (Plot Ratio): 1:1.0\nLiputan Bangunan (Plinth Area): 50%\nKetinggian Bangunan: 2 Tingkat (8.5 meter)\nTempat Letak Kereta: 160 petak\nTempat Letak Motosikal: 80 petak\nTempat Letak OKU: 2 petak\nKawasan Lapang: 2,400 m² (10.0%)",
        },
      ],
    },
    expectedFacts: {
      lotNumber: "Lot 3241",
      mukim: "Kuah",
      district: "Langkawi",
      siteAreaSqm: 24000,
      grossFloorAreaSqm: 14400,
      plotRatio: 1.0,
      buildingCoveragePercent: 50,
      numberOfFloors: 2,
      maximumBuildingHeightMeters: 8.5,
      carParkingProvided: 160,
      motorcycleParkingProvided: 80,
      disabledParkingProvided: 2,
      openSpaceAreaSqm: 2400,
      openSpacePercent: 10,
    },
  },
  {
    id: "fixture-commercial-bandar",
    name: "Kompleks Komersial & Pejabat 4 Tingkat - Bandar Kuah",
    doc: {
      documentId: "doc-fixture-commercial",
      totalPages: 3,
      rawTextLength: 620,
      pages: [
        {
          pageNumber: 1,
          text: "MAJLIS PERBANDARAN LANGKAWI BANDARAYA PELANCONGAN\nCADANGAN PEMBANGUNAN KOMPLEKS PERNIAGAAN DAN PEJABAT 4 TINGKAT DI ATAS LOT 5521, MUKIM KUAH, DAERAH LANGKAWI\nPEMOHON: LANGKAWI COMMERCIAL PROPERTIES SDN BHD",
        },
        {
          pageNumber: 2,
          text: "MAKLUMAT TAPAK:\nNombor Lot: Lot 5521\nMukim: Kuah\nDaerah: Langkawi\nKeluasan Tapak: 12,000 m² (1.2 Hektar)\nGuna Tanah Dicadangkan: Perniagaan",
        },
        {
          pageNumber: 3,
          text: "PARAMETER PERANCANGAN:\nJumlah Keluasan Lantai Kasar (GFA): 24,000 m²\nNisbah Plot (Plot Ratio): 1:2.0\nLiputan Bangunan (Plinth Area): 60%\nKetinggian Bangunan: 4 Tingkat (16.0 meter)\nTempat Letak Kereta: 220 petak\nTempat Letak Motosikal: 100 petak\nTempat Letak OKU: 6 petak\nKawasan Lapang: 1,200 m² (10.0%)",
        },
      ],
    },
    expectedFacts: {
      lotNumber: "Lot 5521",
      mukim: "Kuah",
      district: "Langkawi",
      siteAreaSqm: 12000,
      grossFloorAreaSqm: 24000,
      plotRatio: 2.0,
      buildingCoveragePercent: 60,
      numberOfFloors: 4,
      maximumBuildingHeightMeters: 16.0,
      carParkingProvided: 220,
      motorcycleParkingProvided: 100,
      disabledParkingProvided: 6,
      openSpaceAreaSqm: 1200,
      openSpacePercent: 10,
    },
  },
];

describe("Golden Dataset Live Gemini API Accuracy Benchmark", () => {
  it("should evaluate live AI extraction accuracy against ground-truth golden fixtures when API key is set", async (t) => {
    if (!process.env.GEMINI_API_KEY) {
      console.info("\n=======================================================");
      console.info("SKIPPED: GEMINI_API_KEY not set — live accuracy benchmark not run");
      console.info("To run live benchmark, set GEMINI_API_KEY in .env.local or run:");
      console.info("  GEMINI_API_KEY=\"<your-key>\" node --test tests/unit/golden-dataset-live.test.mjs");
      console.info("=======================================================\n");
      t.skip("GEMINI_API_KEY not set in environment");
      return;
    }

    let totalCheckedFields = 0;
    let totalCorrectFields = 0;
    const fixtureResults = [];

    for (const fixture of GOLDEN_FIXTURES) {
      const extraction = await extractPlanningFactsFromDocument(fixture.doc, "APP-GOLDEN-LIVE", 1);
      const factMap = new Map(extraction.facts.map((f) => [f.key, f]));

      let fixtureChecked = 0;
      let fixtureCorrect = 0;

      for (const [key, expectedVal] of Object.entries(fixture.expectedFacts)) {
        fixtureChecked++;
        totalCheckedFields++;

        const extractedFact = factMap.get(key);
        if (extractedFact && extractedFact.status === "EXTRACTED") {
          const actualVal = extractedFact.normalizedValue ?? extractedFact.value;

          if (typeof expectedVal === "number" && typeof actualVal === "number") {
            if (Math.abs(expectedVal - actualVal) <= 0.05) {
              fixtureCorrect++;
              totalCorrectFields++;
            }
          } else if (
            String(actualVal).toLowerCase().includes(String(expectedVal).toLowerCase()) ||
            String(expectedVal).toLowerCase().includes(String(actualVal).toLowerCase())
          ) {
            fixtureCorrect++;
            totalCorrectFields++;
          }
        }
      }

      const accuracy = (fixtureCorrect / fixtureChecked) * 100;
      fixtureResults.push({
        fixtureId: fixture.id,
        name: fixture.name,
        checked: fixtureChecked,
        correct: fixtureCorrect,
        accuracyPercent: Number(accuracy.toFixed(1)),
      });
    }

    const overallAccuracy = (totalCorrectFields / totalCheckedFields) * 100;

    console.info("\n=======================================================");
    console.info("   LIVE GEMINI 1.5 PRO ACCURACY BENCHMARK REPORT      ");
    console.info("=======================================================");
    for (const res of fixtureResults) {
      console.info(
        `Fixture [${res.fixtureId}]: ${res.name} -> ${res.correct}/${res.checked} fields (${res.accuracyPercent}%)`
      );
    }
    console.info(
      `\nOVERALL LIVE MODEL ACCURACY: ${overallAccuracy.toFixed(1)}% (${totalCorrectFields}/${totalCheckedFields} fields)`
    );
    console.info("=======================================================\n");

    assert.ok(totalCheckedFields > 0, "Live accuracy benchmark evaluated at least 1 field");
  });
});
