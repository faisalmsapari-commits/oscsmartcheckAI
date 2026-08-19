import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getCadastralProvider,
  getRtdSpatialProvider,
  searchLots,
  findLotByPoint,
  setApplicationLocation,
  getApplicationSite,
  compareLcpAndGisSite,
  analyzeRtdIntersection,
  analyzeSiteBuffer,
  verifyApplicationSite,
  getSpatialReadiness,
} from "../../src/lib/gis/index.ts";

import {
  createDataset,
  publishDataset,
  getDatasets,
} from "../../src/lib/gis/adminService.ts";

import { localSpatialDb } from "../../src/lib/server/db/postgres.ts";

// Mock Firestore for GIS Unit Tests
function createMockDb() {
  const store = new Map();
  const auditLogs = [];

  const mockDb = {
    _store: store,
    _auditLogs: auditLogs,
    collection(path) {
      if (path === "auditLogs") {
        return {
          async add(data) {
            auditLogs.push(data);
            return { id: `audit-${Date.now()}` };
          },
        };
      }

      return {
        doc(id) {
          const docPath = `${path}/${id}`;
          return {
            async get() {
              const data = store.get(docPath);
              return {
                exists: Boolean(data),
                id,
                data: () => data,
              };
            },
            async set(data) {
              store.set(docPath, { ...data });
            },
            async update(data) {
              const existing = store.get(docPath) || {};
              store.set(docPath, { ...existing, ...data });
            },
          };
        },
        async get() {
          const docs = [];
          for (const [k, v] of store.entries()) {
            if (k.startsWith(path)) {
              docs.push({ id: k.split("/").pop(), data: () => v });
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        },
      };
    },
  };

  return mockDb;
}

describe("Module 08: GIS Smart Location, Lot Integration & RTD Spatial Context", () => {
  const cadastralProvider = getCadastralProvider();
  const rtdProvider = getRtdSpatialProvider();

  it("Test 1: Search lot by number", async () => {
    const results = await cadastralProvider.searchLots({ lotNumber: "1234" });
    assert.strictEqual(results.length >= 1, true);
    assert.strictEqual(results[0].lotNumber, "Lot 1234");
    assert.strictEqual(results[0].mukimName, "Kuah");
  });

  it("Test 2: Search lot by number + mukim", async () => {
    const results = await cadastralProvider.searchLots({ lotNumber: "1234", mukim: "Kuah" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].mukimName, "Kuah");
    assert.strictEqual(results[0].landAreaSqm, 12730.0);
  });

  it("Test 3: Point inside lot returns correct lot", async () => {
    // Inside Lot 1234 bounds (lat: 6.33, lng: 99.85)
    const result = await cadastralProvider.findByPoint(6.33, 99.85);
    assert.strictEqual(result.status, "MATCHED");
    assert.strictEqual(result.lots.length, 1);
    assert.strictEqual(result.lots[0].lotNumber, "Lot 1234");
  });

  it("Test 4: Boundary point produces safe candidate results", async () => {
    // Point on boundary between Lot 1234 and Lot 1235 (lng: 99.855)
    const result = await cadastralProvider.findByPoint(6.33, 99.855);
    assert.strictEqual(result.status === "MULTIPLE_CANDIDATES" || result.status === "MATCHED", true);
  });

  it("Test 5: Unknown lot returns no match", async () => {
    const result = await cadastralProvider.findByPoint(5.0, 100.0);
    assert.strictEqual(result.status, "NO_MATCH");
    assert.strictEqual(result.lots.length, 0);
  });

  it("Test 6: Multiple lot union works", async () => {
    const union = await cadastralProvider.getCombinedGeometry(["LOT-1234-KUAH", "LOT-1235-KUAH"]);
    assert.strictEqual(union.combinedLots.length, 2);
    assert.strictEqual(union.totalAreaSqm, 12730.0 + 8500.0); // 21,230 sqm
  });

  it("Test 7: Site area calculated correctly server-side", async () => {
    const union = await cadastralProvider.getCombinedGeometry(["LOT-1234-KUAH"]);
    assert.strictEqual(union.totalAreaSqm, 12730.0);
  });

  it("Test 8: Spatial index and query service work", async () => {
    const lots = await searchLots({ limit: 10 });
    assert.strictEqual(lots.length >= 2, true);
  });

  it("Test 9: LCP area vs GIS area comparison produces accurate percentage difference", async () => {
    const mockDb = createMockDb();
    const appId = "app-km-gis-1";

    // Set GIS lot
    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      {
        siteType: "SINGLE_LOT",
        selectedLotIds: ["LOT-1234-KUAH"],
      },
      mockDb
    );

    // Mock Prompt 07 LCP Extracted Facts
    mockDb._store.set(`applications/${appId}/extractedFacts/fact-1`, {
      key: "site.lotNumber",
      value: "Lot 1234",
    });
    mockDb._store.set(`applications/${appId}/extractedFacts/fact-2`, {
      key: "site.mukim",
      value: "Kuah",
    });
    mockDb._store.set(`applications/${appId}/extractedFacts/fact-3`, {
      key: "site.areaSqm",
      value: 12500.0,
      normalizedValue: 12500.0,
    });

    const comp = await compareLcpAndGisSite(appId, mockDb);
    assert.strictEqual(comp.lotMatch, true);
    assert.strictEqual(comp.mukimMatch, true);
    assert.strictEqual(comp.differenceSqm, 230.0);
    assert.strictEqual(comp.differencePercent, 1.84);
    assert.strictEqual(comp.status, "MATCH"); // Difference < 2%
  });

  it("Test 10: RTD intersection returns active dataset", async () => {
    const activeDataset = await rtdProvider.getActiveDataset();
    assert.strictEqual(activeDataset !== null, true);
    assert.strictEqual(activeDataset?.datasetType, "RTD_ZONING");
    assert.strictEqual(activeDataset?.status, "ACTIVE");
  });

  it("Test 11: RTD intersection returns multiple zones with percentages", async () => {
    const mockDb = createMockDb();
    const appId = "app-km-gis-rtd-1";

    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      {
        siteType: "SINGLE_LOT",
        selectedLotIds: ["LOT-1234-KUAH"],
      },
      mockDb
    );

    const rtd = await analyzeRtdIntersection(appId, mockDb);
    assert.strictEqual(rtd.zones.length, 2);
    assert.strictEqual(rtd.zones[0].zoneCode, "PERDAGANGAN");
    assert.strictEqual(rtd.zones[0].intersectionPercent, 85);
    assert.strictEqual(rtd.zones[1].zoneCode, "PENGANGKUTAN");
    assert.strictEqual(rtd.zones[1].intersectionPercent, 15);
  });

  it("Test 12: Intersection percentage totals equal 100%", async () => {
    const zones = await rtdProvider.findZonesForLotGeometry([], 12730.0);
    const totalPercent = zones.reduce((acc, z) => acc + z.intersectionPercent, 0);
    assert.strictEqual(totalPercent, 100);
  });

  it("Test 13: Primary zone selected by largest overlap percentage", async () => {
    const mockDb = createMockDb();
    const appId = "app-km-gis-rtd-2";

    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      {
        siteType: "SINGLE_LOT",
        selectedLotIds: ["LOT-1234-KUAH"],
      },
      mockDb
    );

    const rtd = await analyzeRtdIntersection(appId, mockDb);
    assert.strictEqual(rtd.primaryZone?.zoneCode, "PERDAGANGAN");
    assert.strictEqual(rtd.primaryZone?.intersectionPercent, 85);
  });

  it("Test 14: 250m buffer analysis works", async () => {
    const res = await analyzeSiteBuffer("app-1", 250);
    assert.strictEqual(res.bufferDistanceMeters, 250);
    assert.strictEqual(res.features.length >= 1, true);
  });

  it("Test 15: 500m buffer analysis works", async () => {
    const res = await analyzeSiteBuffer("app-1", 500);
    assert.strictEqual(res.bufferDistanceMeters, 500);
    assert.strictEqual(res.features.length >= 2, true);
  });

  it("Test 16: 1000m buffer analysis works", async () => {
    const res = await analyzeSiteBuffer("app-1", 1000);
    assert.strictEqual(res.bufferDistanceMeters, 1000);
    assert.strictEqual(res.features.length >= 3, true);
  });

  it("Test 17: Nearby feature distance calculation is deterministic", async () => {
    const res = await analyzeSiteBuffer("app-1", 500);
    const road = res.features.find((f) => f.featureType === "ROAD");
    assert.strictEqual(road !== undefined, true);
    assert.strictEqual(road?.distanceMeters, 15.0);
  });

  it("Test 18: Applicant cannot verify official location", async () => {
    const mockDb = createMockDb();
    const appId = "app-verify-1";

    await setApplicationLocation(
      appId,
      "applicant-uid-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );

    await assert.rejects(
      async () => {
        await verifyApplicationSite(appId, "applicant-uid-1", "APPLICANT", "Self verify", mockDb);
      },
      { message: /Akses tidak dibenarkan/ }
    );
  });

  it("Test 19: Authorized officer can verify location", async () => {
    const mockDb = createMockDb();
    const appId = "app-verify-2";

    await setApplicationLocation(
      appId,
      "applicant-uid-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );

    const verified = await verifyApplicationSite(
      appId,
      "officer-uid-1",
      "OSC_OFFICER",
      "Semakan pelan disahkan",
      mockDb
    );

    assert.strictEqual(verified.verificationStatus, "OFFICER_VERIFIED");
    assert.strictEqual(verified.verifiedBy, "officer-uid-1");
    assert.strictEqual(mockDb._auditLogs.some((l) => l.eventType === "SITE_LOCATION_VERIFIED"), true);
  });

  it("Test 20: Site change revokes/invalidates previous verification status", async () => {
    const mockDb = createMockDb();
    const appId = "app-verify-3";

    // 1. Initial site
    await setApplicationLocation(
      appId,
      "applicant-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );

    // 2. Officer verifies
    await verifyApplicationSite(appId, "officer-1", "OSC_OFFICER", "OK", mockDb);
    let site = await getApplicationSite(appId, mockDb);
    assert.strictEqual(site?.verificationStatus, "OFFICER_VERIFIED");

    // 3. Applicant modifies selected lot to include Lot 1235
    await setApplicationLocation(
      appId,
      "applicant-1",
      "APPLICANT",
      { siteType: "MULTIPLE_LOTS", selectedLotIds: ["LOT-1234-KUAH", "LOT-1235-KUAH"] },
      mockDb
    );

    site = await getApplicationSite(appId, mockDb);
    assert.strictEqual(site?.verificationStatus, "UNVERIFIED"); // Verification must be revoked
    assert.strictEqual(site?.siteVersion, 2);
  });

  it("Test 21: Historical site versions remain preserved", async () => {
    const mockDb = createMockDb();
    const appId = "app-hist-1";

    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );

    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      { siteType: "MULTIPLE_LOTS", selectedLotIds: ["LOT-1234-KUAH", "LOT-1235-KUAH"] },
      mockDb
    );

    const v1 = mockDb._store.get(`applications/${appId}/siteHistory/v1`);
    const v2 = mockDb._store.get(`applications/${appId}/siteHistory/v2`);

    assert.strictEqual(v1 !== undefined, true);
    assert.strictEqual(v2 !== undefined, true);
    assert.strictEqual(v1.siteVersion, 1);
    assert.strictEqual(v2.siteVersion, 2);
  });

  it("Test 22: GIS dataset version lineage is retained", async () => {
    const mockDb = createMockDb();
    const ds = await createDataset(
      {
        datasetCode: "RTD_LANGKAWI_2030_P3",
        datasetName: "RTD Langkawi 2030 (Pengubahan 3)",
        datasetType: "RTD_ZONING",
        sourceAgency: "PLANMalaysia",
        version: "V2026.03",
        importedBy: "officer-gis-1",
      },
      mockDb
    );

    assert.strictEqual(ds.status, "DRAFT");
    assert.strictEqual(ds.version, "V2026.03");
  });

  it("Test 23: Superseded dataset remains queryable historically", async () => {
    const mockDb = createMockDb();
    const ds = await createDataset(
      {
        datasetCode: "CADASTRAL_LANGKAWI_HIST",
        datasetName: "Kadaster 2025",
        datasetType: "CADASTRAL",
        sourceAgency: "JUPEM",
        version: "V2025.1",
        importedBy: "officer-gis-1",
      },
      mockDb
    );

    await publishDataset(ds.id, "officer-gis-1", mockDb);
    const datasets = await getDatasets();
    assert.strictEqual(datasets.some((d) => d.id === ds.id), true);
  });

  it("Test 24: Spatial readiness evaluator reports accurately", async () => {
    const mockDb = createMockDb();
    const appId = "app-readiness-1";

    let readiness = await getSpatialReadiness(appId, mockDb);
    assert.strictEqual(readiness.readyForRuleEngine, false);

    // Add and verify site
    await setApplicationLocation(
      appId,
      "applicant-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );
    await verifyApplicationSite(appId, "officer-1", "OSC_OFFICER", "OK", mockDb);

    readiness = await getSpatialReadiness(appId, mockDb);
    assert.strictEqual(readiness.readyForRuleEngine, true);
    assert.strictEqual(readiness.isOfficerVerified, true);
  });

  it("Test 25: SQL injection-style input is safely handled via parameterized queries", async () => {
    const maliciousInput = "1234' OR '1'='1";
    const lots = await searchLots({ lotNumber: maliciousInput });
    assert.strictEqual(Array.isArray(lots), true);
  });

  it("Test 26: Zero Compliance Decision Guarantee (No PATUH/TIDAK_PATUH)", async () => {
    const mockDb = createMockDb();
    const appId = "app-zero-compliance";

    await setApplicationLocation(
      appId,
      "user-1",
      "APPLICANT",
      { siteType: "SINGLE_LOT", selectedLotIds: ["LOT-1234-KUAH"] },
      mockDb
    );

    const rtd = await analyzeRtdIntersection(appId, mockDb);
    const buffer = await analyzeSiteBuffer(appId, 500);

    const jsonString = JSON.stringify({ rtd, buffer });
    assert.strictEqual(jsonString.includes("PATUH"), false);
    assert.strictEqual(jsonString.includes("TIDAK_PATUH"), false);
    assert.strictEqual(jsonString.includes("DIBENARKAN"), false);
    assert.strictEqual(jsonString.includes("TIDAK_DIBENARKAN"), false);
    assert.strictEqual(jsonString.includes("LULUS"), false);
    assert.strictEqual(jsonString.includes("TOLAK"), false);
  });
});
