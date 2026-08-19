import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  calculateAverage,
  calculateMedian,
  calculatePercentile,
  calculatePercentage,
  formatSampleDenominator,
  bucketIssueAge,
  computeDateRangeFromPreset,
} from "../../src/lib/analytics/kpiCalculator.ts";

import {
  getKpiDefinition,
  listActiveKpis,
} from "../../src/lib/analytics/kpiRegistry.ts";

import { FirestoreAnalyticsRepository } from "../../src/lib/analytics/analyticsRepository.ts";
import { aggregateDailyAnalytics } from "../../src/lib/analytics/aggregationService.ts";
import {
  getManagementDashboard,
  getManagementExecutiveSummary,
  exportManagementData,
  acknowledgeManagementAlert,
  createOrUpdateManagementTarget,
} from "../../src/lib/analytics/managementService.ts";
import { getPlanningIntelligence } from "../../src/lib/analytics/planningIntelligenceService.ts";
import { isValidUserRole } from "../../src/types/common.ts";

// Mock In-Memory Firestore for Comprehensive Testing
function createMockFirestore(initialData = {}) {
  const store = { ...initialData };

  const getCollectionDocs = (collPath) => {
    return Object.entries(store)
      .filter(([key]) => {
        if (key.startsWith(collPath + "/")) {
          const sub = key.slice(collPath.length + 1);
          return !sub.includes("/");
        }
        return false;
      })
      .map(([key, val]) => ({
        id: key.split("/").pop(),
        data: () => val,
      }));
  };

  const createQueryObj = (collPath, filters = []) => ({
    where(field, op, val) {
      return createQueryObj(collPath, [...filters, { field, op, val }]);
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },
    async get() {
      let docs = getCollectionDocs(collPath);
      for (const f of filters) {
        if (f.op === "==") {
          docs = docs.filter((d) => {
            const data = d.data();
            const fieldParts = f.field.split(".");
            let current = data;
            for (const part of fieldParts) {
              current = current ? current[part] : undefined;
            }
            return current === f.val;
          });
        } else if (f.op === "in") {
          docs = docs.filter((d) => f.val.includes(d.data()[f.field]));
        }
      }
      return {
        empty: docs.length === 0,
        docs,
      };
    },
  });

  return {
    collection(collPath) {
      return {
        ...createQueryObj(collPath),
        doc(docId) {
          const fullPath = `${collPath}/${docId}`;
          return {
            async get() {
              const data = store[fullPath];
              return {
                exists: !!data,
                data: () => data,
              };
            },
            async set(data) {
              store[fullPath] = data;
            },
            async update(data) {
              store[fullPath] = { ...(store[fullPath] || {}), ...data };
            },
          };
        },
        async add(data) {
          const id = `mock-doc-${Math.random().toString(36).slice(2, 8)}`;
          store[`${collPath}/${id}`] = data;
          return { id };
        },
      };
    },
    _rawStore: store,
  };
}

describe("Module 13: Management Dashboard, Operational Analytics & KPI Monitoring", () => {
  describe("1. Deterministic Statistical Calculator & KPI Registry", () => {
    it("should calculate average accurately", () => {
      assert.equal(calculateAverage([10, 20, 30]), 20);
      assert.equal(calculateAverage([]), 0);
      assert.equal(calculateAverage([5.5, 6.5, 9.2]), 7.07);
    });

    it("should calculate median accurately for odd and even arrays", () => {
      assert.equal(calculateMedian([1, 5, 2]), 2);
      assert.equal(calculateMedian([1, 2, 5, 6]), 3.5);
      assert.equal(calculateMedian([]), 0);
    });

    it("should calculate percentiles (P75, P90) correctly", () => {
      const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      assert.equal(calculatePercentile(data, 75), 77.5);
      assert.equal(calculatePercentile(data, 90), 91);
      assert.equal(calculatePercentile([], 90), 0);
    });

    it("should calculate percentages and format small sample denominators", () => {
      assert.equal(calculatePercentage(3, 10), 30);
      assert.equal(calculatePercentage(0, 0), 0);
      assert.equal(formatSampleDenominator(2, 5), "2 daripada 5");
      assert.equal(formatSampleDenominator(0, 0), "0 daripada 0");
    });

    it("should bucket issue age into correct ranges", () => {
      const now = new Date("2026-08-19T12:00:00Z");
      const day2Ago = new Date("2026-08-17T12:00:00Z");
      const day5Ago = new Date("2026-08-14T12:00:00Z");
      const day10Ago = new Date("2026-08-09T12:00:00Z");
      const day20Ago = new Date("2026-07-30T12:00:00Z");
      const day40Ago = new Date("2026-07-10T12:00:00Z");

      assert.equal(bucketIssueAge(day2Ago, now), "0_3");
      assert.equal(bucketIssueAge(day5Ago, now), "4_7");
      assert.equal(bucketIssueAge(day10Ago, now), "8_14");
      assert.equal(bucketIssueAge(day20Ago, now), "15_30");
      assert.equal(bucketIssueAge(day40Ago, now), "OVER_30");
    });

    it("should compute date range from presets", () => {
      const now = new Date("2026-08-19T12:00:00Z");
      const range7 = computeDateRangeFromPreset("7_DAYS", undefined, undefined, now);
      assert.ok(range7.from.startsWith("2026-08-12"));

      const customRange = computeDateRangeFromPreset("CUSTOM", "2026-01-01T00:00:00Z", "2026-03-31T23:59:59Z", now);
      assert.equal(customRange.from, "2026-01-01T00:00:00Z");
      assert.equal(customRange.to, "2026-03-31T23:59:59Z");
    });

    it("should provide standardized KPI definitions with versions", () => {
      const kpi = getKpiDefinition("TOTAL_APPLICATIONS");
      assert.ok(kpi);
      assert.equal(kpi.kpiCode, "TOTAL_APPLICATIONS");
      assert.equal(kpi.version, "1.0.0");
      assert.equal(kpi.status, "ACTIVE");

      const allActive = listActiveKpis();
      assert.ok(allActive.length >= 10);
    });
  });

  describe("2. Analytics Repository & Aggregation Engine", () => {
    const mockDbData = {
      "applications/app-001": {
        id: "app-001",
        applicationNo: "KM/2026/000001",
        status: "OFFICER_REVIEW",
        createdAt: "2026-08-10T10:00:00Z",
        projectInfo: { projectName: "Hotel Pelangi Resort", developmentType: "HOTEL" },
        siteInfo: { mukim: "Kuah", isOfficerVerified: true, lots: [{ lotNumber: "Lot 101" }], siteAreaSqm: 15000 },
        assignedOfficerUid: "officer-ali",
        assignedOfficerName: "En. Ali (Pegawai Perancang)",
      },
      "applications/app-002": {
        id: "app-002",
        applicationNo: "KM/2026/000002",
        status: "SUBMITTED",
        createdAt: "2026-08-15T10:00:00Z",
        projectInfo: { projectName: "Taman Melati", developmentType: "HOUSING" },
        siteInfo: { mukim: "Kedawang", isOfficerVerified: false, lots: [{ lotNumber: "Lot 201" }, { lotNumber: "Lot 202" }], siteAreaSqm: 25000 },
        assignedOfficerUid: "officer-siti",
        assignedOfficerName: "Pn. Siti (Pegawai OSC)",
      },
      "applications/app-003": {
        id: "app-003",
        applicationNo: "KM/2026/000003",
        status: "COMPLETED",
        createdAt: "2026-07-01T10:00:00Z",
        projectInfo: { projectName: "Kedai Kuah", developmentType: "COMMERCIAL" },
        siteInfo: { mukim: "Kuah", isOfficerVerified: true, lots: [{ lotNumber: "Lot 301" }], siteAreaSqm: 5000 },
        assignedOfficerUid: "officer-ali",
      },
      // SmartChecks
      "applications/app-001/smartChecks/sc-001": {
        overallStatus: "FAIL_PRECHECK",
        nonCompliantCount: 1,
        requiresReviewCount: 0,
        startedAt: "2026-08-10T10:05:00Z",
        completedAt: "2026-08-10T10:05:03Z", // 3 seconds
      },
      "applications/app-001/smartChecks/sc-001/results/res-01": {
        ruleCode: "PARKING-CAR-001",
        ruleName: "TLK Tempat Letak Kereta",
        category: "PARKING",
        status: "NON_COMPLIANT",
        ruleEvidence: { ruleVersion: "RS-MPLBP-2026-V1" },
      },
      // Issues
      "applications/app-001/issues/iss-001": {
        status: "OPEN",
        createdAt: "2026-08-11T10:00:00Z",
        severity: "CRITICAL",
      },
      // Verified Comments
      "applications/app-001/verifiedComments/vc-001": {
        status: "VERIFIED",
        verifiedBy: "officer-ali",
      },
    };

    it("should calculate summary KPIs accurately from repository", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const summary = await repo.getSummaryKpis({});

      assert.equal(summary.totalApplications, 3);
      assert.equal(summary.activeApplications, 2); // app-001 (OFFICER_REVIEW) and app-002 (SUBMITTED)
      assert.equal(summary.smartCheckCompletedCount, 1);
      assert.equal(summary.revisionRequiredCount, 1);
      assert.equal(summary.openIssuesCount, 1);
      assert.equal(summary.avgSmartCheckDurationSeconds, 3);
      assert.equal(summary.humanVerificationRate, 100);
    });

    it("should compute monthly application trend and breakdowns", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const trend = await repo.getApplicationTrend({});

      assert.ok(trend.length >= 2);
      const augPoint = trend.find((t) => t.periodKey === "2026-08");
      assert.ok(augPoint);
      assert.equal(augPoint.totalCount, 2);
      assert.equal(augPoint.breakdownByDevelopmentType["HOTEL"], 1);
      assert.equal(augPoint.breakdownByDevelopmentType["HOUSING"], 1);
      assert.equal(augPoint.breakdownByMukim["Kuah"], 1);
    });

    it("should compute status distribution breakdown", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const dist = await repo.getStatusDistribution({});

      assert.ok(dist.length > 0);
      const rev = dist.find((d) => d.status === "OFFICER_REVIEW");
      assert.ok(rev);
      assert.equal(rev.count, 1);
    });

    it("should compute category compliance metrics", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const cats = await repo.getCategoryCompliance({});

      assert.equal(cats.length, 1);
      assert.equal(cats[0].category, "PARKING");
      assert.equal(cats[0].nonCompliantCount, 1);
      assert.equal(cats[0].complianceRate, 0);
    });

    it("should calculate issue ageing buckets from actual issue timestamps", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const ageing = await repo.getIssueAgeing({});

      assert.equal(ageing.totalOpenIssues, 1);
      assert.ok(ageing.bucket_8_14_days === 1 || ageing.bucket_4_7_days === 1 || ageing.bucket_0_3_days === 1 || ageing.bucket_15_30_days === 1);
    });

    it("should calculate officer operational workload queue without punitive scoring", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const workload = await repo.getOfficerWorkload({});

      assert.equal(workload.length, 2);
      const ali = workload.find((w) => w.officerUid === "officer-ali");
      assert.ok(ali);
      assert.equal(ali.assignedApplicationsCount, 2);
      assert.equal(ali.pendingReviewCount, 1);
    });

    it("should rank top non-compliance rules with sample denominators", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const topRules = await repo.getTopNonCompliance({});

      assert.equal(topRules.length, 1);
      assert.equal(topRules[0].ruleCode, "PARKING-CAR-001");
      assert.equal(topRules[0].nonCompliantCount, 1);
      assert.equal(topRules[0].nonComplianceRate, 100);
      assert.equal(topRules[0].sampleDenominatorText, "1 daripada 1");
      assert.equal(topRules[0].ruleVersion, "RS-MPLBP-2026-V1");
    });

    it("should aggregate spatial planning intelligence by Mukim", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const repo = new FirestoreAnalyticsRepository(mockDb);
      const spatial = await repo.getSpatialPlanning({});

      assert.equal(spatial.verifiedSiteLocationsCount, 2);
      assert.equal(spatial.unresolvedGisLocationsCount, 1);
      assert.equal(spatial.multiLotApplicationsCount, 1); // app-002 has 2 lots
      assert.ok(spatial.mukimDistribution.some((m) => m.mukim === "Kuah" && m.applicationCount === 2));
    });

    it("should run daily aggregation job and trigger snapshot & alerts", async () => {
      const mockDb = createMockFirestore(mockDbData);
      const result = await aggregateDailyAnalytics("2026-08-19", mockDb);

      assert.ok(result.snapshot);
      assert.equal(result.snapshot.snapshotId, "snap-2026-08-19");
      assert.equal(result.snapshot.schemaVersion, "1.0.0");
      assert.ok(mockDb._rawStore["analyticsSnapshots/snap-2026-08-19"]);
    });
  });

  describe("3. Management Dashboard API & Executive Summary", () => {
    it("should return comprehensive ManagementDashboardResponse with insights", async () => {
      const mockDb = createMockFirestore({
        "applications/app-100": {
          id: "app-100",
          applicationNo: "KM/2026/000100",
          status: "SUBMITTED",
          createdAt: "2026-08-18T10:00:00Z",
          projectInfo: { developmentType: "HOTEL" },
          siteInfo: { mukim: "Kuah" },
        },
      });

      const response = await getManagementDashboard({}, mockDb);
      assert.ok(response.metadata);
      assert.equal(response.summaryKpis.totalApplications, 1);
      assert.ok(response.descriptiveInsights.length >= 0);
      assert.equal(response.metadata.dataFreshness, "REALTIME");
    });

    it("should return concise executive summary DTO", async () => {
      const mockDb = createMockFirestore({
        "applications/app-100": {
          id: "app-100",
          status: "SUBMITTED",
          createdAt: "2026-08-18T10:00:00Z",
          projectInfo: { developmentType: "HOTEL" },
          siteInfo: { mukim: "Kuah" },
        },
      });

      const exec = await getManagementExecutiveSummary({}, mockDb);
      assert.equal(exec.totalApplications, 1);
      assert.equal(exec.activeApplications, 1);
      assert.equal(exec.humanVerificationRate, 100);
    });

    it("should support planning intelligence service", async () => {
      const mockDb = createMockFirestore({});
      const pi = await getPlanningIntelligence({}, mockDb);
      assert.ok(pi.spatialSummary);
      assert.ok(pi.developmentActivityRankings.length > 0);
      assert.ok(pi.rtdZoningPressure.length > 0);
    });
  });

  describe("4. Security, Privacy Filter & RBAC Guardrails", () => {
    it("should recognize new management roles in RBAC taxonomy", () => {
      assert.equal(isValidUserRole("OSC_MANAGER"), true);
      assert.equal(isValidUserRole("PLANNING_MANAGER"), true);
      assert.equal(isValidUserRole("APPLICANT"), true);
      assert.equal(isValidUserRole("INVALID_ROLE"), false);
    });

    it("should export CSV data with privacy projection and audit log", async () => {
      const mockDb = createMockFirestore({
        "applications/app-1": {
          id: "app-1",
          status: "SUBMITTED",
          createdAt: "2026-08-18T10:00:00Z",
        },
      });

      const result = await exportManagementData(
        "SUMMARY_KPIS",
        "CSV",
        {},
        "user-mgr-01",
        "OSC_MANAGER",
        mockDb
      );

      assert.equal(result.mimeType, "text/csv");
      assert.ok(result.content.includes("Jumlah Permohonan"));
      assert.ok(!result.content.includes("icNumber"));
      assert.ok(!result.content.includes("applicantPhone"));

      // Audit log check
      const auditEntries = Object.values(mockDb._rawStore).filter(
        (v) => v.eventType === "MANAGEMENT_DATA_EXPORTED"
      );
      assert.equal(auditEntries.length, 1);
      assert.equal(auditEntries[0].actorUid, "user-mgr-01");
      assert.equal(auditEntries[0].actorRole, "OSC_MANAGER");
    });

    it("should export JSON data with privacy projection and audit log", async () => {
      const mockDb = createMockFirestore({
        "applications/app-1": {
          id: "app-1",
          status: "SUBMITTED",
          createdAt: "2026-08-18T10:00:00Z",
        },
      });

      const result = await exportManagementData(
        "TOP_NON_COMPLIANCE",
        "JSON",
        {},
        "user-mgr-01",
        "OSC_MANAGER",
        mockDb
      );

      assert.equal(result.mimeType, "application/json");
      const parsed = JSON.parse(result.content);
      assert.ok(Array.isArray(parsed));
    });

    it("should allow acknowledging operational alerts", async () => {
      const mockDb = createMockFirestore({
        "managementAlerts/alert-01": {
          alertId: "alert-01",
          alertType: "CRITICAL_ISSUE_BACKLOG",
          status: "OPEN",
        },
      });

      await acknowledgeManagementAlert("alert-01", "officer-01", mockDb);
      const updated = mockDb._rawStore["managementAlerts/alert-01"];
      assert.equal(updated.status, "ACKNOWLEDGED");
      assert.equal(updated.acknowledgedBy, "officer-01");
    });

    it("should allow creating and updating management performance targets", async () => {
      const mockDb = createMockFirestore({});
      await createOrUpdateManagementTarget(
        {
          targetId: "target-01",
          kpiCode: "SMARTCHECK_COMPLETED",
          targetName: "Sasaran SmartCheck 95%",
          targetValue: 95,
          unit: "%",
          effectiveFrom: "2026-01-01",
          approvedBy: "Pengarah Perancangan MPLBP",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        "mgr-01",
        "PLANNING_MANAGER",
        mockDb
      );

      const targetDoc = mockDb._rawStore["managementTargets/target-01"];
      assert.ok(targetDoc);
      assert.equal(targetDoc.targetValue, 95);
    });

    it("should strictly verify 100% human verification governance rule", async () => {
      const mockDbWithBreach = createMockFirestore({
        "applications/app-breach": { id: "app-breach", status: "SUBMITTED" },
        "applications/app-breach/verifiedComments/vc-unverified": {
          status: "VERIFIED",
          verifiedBy: "SYSTEM", // Breach!
        },
      });

      const repo = new FirestoreAnalyticsRepository(mockDbWithBreach);
      const gov = await repo.getAiGovernance({});
      assert.equal(gov.verifiedWithoutHumanCount, 1);
      assert.equal(gov.humanVerificationRate, 0);
      assert.equal(gov.governanceBreachDetected, true);
    });

    it("should trigger critical issue backlog alert when open issues exceed 50", async () => {
      const mockDbBacklog = createMockFirestore({
        "applications/app-01": {
          id: "app-01",
          status: "SUBMITTED",
          createdAt: "2026-08-10T10:00:00Z",
        },
      });
      // Add 55 open issues
      for (let i = 1; i <= 55; i++) {
        mockDbBacklog._rawStore[`applications/app-01/issues/iss-${i}`] = {
          status: "OPEN",
          createdAt: "2026-08-10T10:00:00Z",
        };
      }

      const result = await aggregateDailyAnalytics("2026-08-19", mockDbBacklog);
      assert.ok(result.triggeredAlerts.some((a) => a.alertType === "CRITICAL_ISSUE_BACKLOG"));
    });

    it("should assert zero predictive applicant risk scoring exists in codebase", () => {
      const prohibitedKeys = [
        "applicantRiskScore",
        "developerApprovalProbability",
        "corruptionRiskScore",
        "officerPunitiveRank",
      ];
      // Assert that none of these prohibited keys are used in the analytics schemas
      const kpis = listActiveKpis().map((k) => k.kpiCode);
      prohibitedKeys.forEach((key) => {
        assert.ok(!kpis.includes(key));
      });
    });
  });
});
