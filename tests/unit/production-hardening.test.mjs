import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getEnvironmentConfig,
  validateProductionConfiguration,
  isNotificationRecipientAllowed,
} from "../../src/lib/config/environment.ts";
import {
  checkRateLimit,
  resetRateLimits,
} from "../../src/lib/security/rateLimiter.ts";
import {
  sanitizeHtml,
  escapeHtml,
  containsSqlInjection,
} from "../../src/lib/security/sanitization.ts";
import {
  validatePdfSignature,
  sanitizeFilename,
  validateUploadedFile,
} from "../../src/lib/security/fileSecurity.ts";
import {
  isFeatureEnabled,
  setFeatureFlag,
  resetFeatureFlags,
} from "../../src/lib/security/killSwitch.ts";
import {
  runMigration,
} from "../../src/lib/migration/migrationRunner.ts";
import {
  importLegacyApplications,
} from "../../src/lib/migration/legacyImporter.ts";
import {
  getGoLiveReadiness,
  DEFAULT_GO_LIVE_ITEMS,
} from "../../src/lib/golive/goLiveService.ts";

describe("Module 15 — Environment Separation & Production Config Validation", () => {
  test("1. Correctly resolves environment configuration", () => {
    const config = getEnvironmentConfig();
    assert.ok(config.appVersion);
    assert.ok(["development", "staging", "production"].includes(config.env));
  });

  test("2. Rejects localhost URLs in production configuration", () => {
    const res = validateProductionConfiguration({
      isProduction: true,
      appUrl: "http://localhost:3000",
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("localhost")));
  });

  test("3. Rejects TEST_ONLY rules in production configuration", () => {
    const res = validateProductionConfiguration({
      isProduction: true,
      appUrl: "https://osc.mplbp.gov.my",
      activeRuleSetCodes: ["RTD_2030_STANDARD", "TEST_ONLY_MOCK_RULES"],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("TEST/MOCK")));
  });

  test("4. Rejects test GIS datasets in production configuration", () => {
    const res = validateProductionConfiguration({
      isProduction: true,
      appUrl: "https://osc.mplbp.gov.my",
      activeRuleSetCodes: ["RTD_2030_STANDARD"],
      activeGisDatasets: ["MPLBP_CADASTRAL", "SAMPLE_TEST_ZONES"],
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("TEST atau SAMPLE")));
  });

  test("5. Validates production configuration when all requirements are met", () => {
    const res = validateProductionConfiguration({
      isProduction: true,
      appUrl: "https://osc.mplbp.gov.my",
      activeRuleSetCodes: ["RTD_2030_STANDARD"],
      activeGisDatasets: ["MPLBP_CADASTRAL_2026", "MPLBP_RTD_2030"],
      emailSender: "osc@mplbp.gov.my",
    });
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  test("6. Staging notification allowlist protects real applicants", () => {
    const stagingConfig = {
      ...getEnvironmentConfig(),
      env: "staging",
      isProduction: false,
      notificationAllowlist: ["tester@mplbp.gov.my", "consultant@example.com"],
    };

    assert.equal(isNotificationRecipientAllowed("tester@mplbp.gov.my", stagingConfig), true);
    assert.equal(isNotificationRecipientAllowed("real.applicant@gmail.com", stagingConfig), false);
  });
});

describe("Module 15 — Security Hardening, XSS, SQLi & File Protection", () => {
  test("7. Sanitizes dangerous HTML and script injections", () => {
    const dirty = `<script>alert('xss')</script><p>Ulasan rasmi: <iframe src="evil.com"></iframe><b>Mematuhi</b></p>`;
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes("<script>"));
    assert.ok(!clean.includes("<iframe>"));
    assert.ok(clean.includes("<b>Mematuhi</b>"));
  });

  test("8. Escapes HTML characters safely", () => {
    const escaped = escapeHtml(`Plan & Elevation <Section 5> "Quoted"`);
    assert.equal(escaped, `Plan &amp; Elevation &lt;Section 5&gt; &quot;Quoted&quot;`);
  });

  test("9. Detects SQL injection patterns", () => {
    assert.equal(containsSqlInjection("Lot 1234 Mukim Kedawang"), false);
    assert.equal(containsSqlInjection("Lot 1234' OR '1'='1"), true);
    assert.equal(containsSqlInjection("123; DROP TABLE users; --"), true);
    assert.equal(containsSqlInjection("SELECT * FROM cadastral WHERE id=1 UNION SELECT * FROM passwords"), true);
  });

  test("10. Validates PDF magic byte header (%PDF-)", () => {
    const validPdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    const fakePdfHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a

    assert.equal(validatePdfSignature(validPdfHeader), true);
    assert.equal(validatePdfSignature(fakePdfHeader), false);
  });

  test("11. Sanitizes uploaded filenames from path traversal", () => {
    assert.equal(sanitizeFilename("../../../etc/passwd.pdf"), "passwd.pdf");
    assert.equal(sanitizeFilename("Pelan_Susun_Atur (1).pdf"), "Pelan_Susun_Atur__1_.pdf");
  });

  test("12. Validates uploaded file size and extension", () => {
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const validRes = validateUploadedFile("pelan.pdf", 1024 * 1024, validPdf);
    assert.equal(validRes.valid, true);

    const oversizedRes = validateUploadedFile("huge_file.pdf", 60 * 1024 * 1024);
    assert.equal(oversizedRes.valid, false);
    assert.ok(oversizedRes.error?.includes("50MB"));

    const badExtRes = validateUploadedFile("virus.exe", 1024);
    assert.equal(badExtRes.valid, false);
  });

  test("13. Sliding-window rate limiter blocks excessive requests", () => {
    resetRateLimits();
    const key = "test-user-ip-1";
    const opts = { windowMs: 10000, maxRequests: 3 };

    assert.equal(checkRateLimit(key, opts).allowed, true);
    assert.equal(checkRateLimit(key, opts).allowed, true);
    assert.equal(checkRateLimit(key, opts).allowed, true);
    assert.equal(checkRateLimit(key, opts).allowed, false); // 4th request blocked
  });

  test("14. Operational Kill Switch allows safe fallbacks", () => {
    resetFeatureFlags();
    assert.equal(isFeatureEnabled("AI_COMMENT_ENABLED"), true);

    setFeatureFlag("AI_COMMENT_ENABLED", false);
    assert.equal(isFeatureEnabled("AI_COMMENT_ENABLED"), false);

    // Reset
    resetFeatureFlags();
    assert.equal(isFeatureEnabled("AI_COMMENT_ENABLED"), true);
  });
});

describe("Module 15 — Database Migrations & Legacy Data Ingestion", () => {
  test("15. Migration runner executes dry-run without persistent mutations", async () => {
    const mockDb = {
      collection: () => ({
        get: async () => ({
          size: 5,
          docs: [
            { data: () => ({ currentVersion: 1 }), ref: { update: async () => {} } },
            { data: () => ({}), ref: { update: async () => {} } },
          ],
        }),
        doc: () => ({ set: async () => {} }),
      }),
    };

    const dummyMigration = {
      migrationId: "test-001",
      name: "Test Migration",
      description: "Test",
      async up(ctx) {
        return { scanned: 5, affected: 1, errors: [] };
      },
    };

    const result = await runMigration(dummyMigration, true, mockDb);
    assert.equal(result.dryRun, true);
    assert.equal(result.documentsScanned, 5);
    assert.equal(result.documentsAffected, 1);
    assert.equal(result.errorsCount, 0);
  });

  test("16. Legacy data importer normalizes records and sets dataOrigin: MIGRATED", async () => {
    let savedData = null;
    const mockDb = {
      collection: (colName) => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true }),
          }),
        }),
        doc: () => ({
          id: "app-migrated-101",
          set: async (d) => {
            savedData = d;
          },
        }),
      }),
    };

    const legacyRecords = [
      {
        legacyReferenceNo: "MPLBP/KM/2024/099",
        projectName: "Projek Pembinaan Chalet Pantai Chenang",
        applicantName: "Ahmad Bin Razak",
        applicantEmail: "ahmad@perunding.com",
        mukim: "Kedawang",
        lotNo: "Lot 888",
        submissionDate: "2024-05-12T00:00:00Z",
        legacyStatus: "LULUS_MESYUARAT",
      },
    ];

    const res = await importLegacyApplications(legacyRecords, false, mockDb);
    assert.equal(res.importedCount, 1);
    assert.equal(res.failedCount, 0);
    assert.equal(savedData?.dataOrigin, "MIGRATED");
    assert.equal(savedData?.legacyReference, "MPLBP/KM/2024/099");
    assert.equal(savedData?.title, "Projek Pembinaan Chalet Pantai Chenang");
  });
});

describe("Module 15 — Go-Live Readiness Engine & Category Scoring", () => {
  test("17. Go-live readiness engine evaluates all 11 statutory categories", async () => {
    const mockDb = {
      collection: () => ({
        get: async () => ({ empty: true, docs: [] }),
      }),
    };

    const report = await getGoLiveReadiness(mockDb);
    assert.ok(report.totalChecks >= 11);
    assert.ok(report.readinessPercentage >= 0 && report.readinessPercentage <= 100);
    assert.ok(report.categories["INFRASTRUCTURE"]);
    assert.ok(report.categories["SECURITY"]);
    assert.ok(report.categories["DATA_INTEGRITY"]);
    assert.ok(report.categories["RULE_SETS"]);
    assert.ok(report.categories["GIS_DATASETS"]);
    assert.ok(report.categories["AI_MODELS"]);
    assert.ok(report.categories["REPORTING"]);
    assert.ok(report.categories["NOTIFICATIONS"]);
    assert.ok(report.categories["BACKUP_DISASTER_RECOVERY"]);
    assert.ok(report.categories["UAT_ACCEPTANCE"]);
    assert.ok(report.categories["OPERATIONS_SUPPORT"]);
  });

  test("18. Blocks Go-Live if any category has critical FAIL status", async () => {
    const mockDbWithFailingItem = {
      collection: () => ({
        get: async () => ({
          empty: false,
          docs: [
            {
              data: () => ({
                id: "SEC-FAIL-01",
                category: "SECURITY",
                name: "Ujian Penembusan",
                description: "Vulnerabiliti kritikal belum ditampal",
                status: "FAIL",
                owner: "Security Officer",
              }),
            },
          ],
        }),
      }),
    };

    const report = await getGoLiveReadiness(mockDbWithFailingItem);
    assert.equal(report.readyForGoLive, false);
    assert.ok(report.blockingIssues.length > 0);
  });
});
