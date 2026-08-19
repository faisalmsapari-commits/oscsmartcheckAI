/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { APP_VERSION, getEnvironmentConfig, validateProductionConfiguration } from "../config/environment.ts";
import type {
  GoLiveCategory,
  GoLiveItemStatus,
  GoLiveCheckItem,
  GoLiveReadinessReport,
} from "./goLiveTypes.ts";
import { DEFAULT_GO_LIVE_ITEMS } from "./goLiveTypes.ts";

export type {
  GoLiveCategory,
  GoLiveItemStatus,
  GoLiveCheckItem,
  GoLiveReadinessReport,
};
export { DEFAULT_GO_LIVE_ITEMS };

/**
 * Calculates Go-Live Readiness
 */
export async function getGoLiveReadiness(
  customDb?: Firestore
): Promise<GoLiveReadinessReport> {
  const db = customDb || getAdminDb();
  const config = getEnvironmentConfig();

  // 1. Fetch saved checks from Firestore if any, else use defaults
  let items = DEFAULT_GO_LIVE_ITEMS;
  try {
    const snap = await db.collection("goLiveChecks").get();
    if (!snap.empty) {
      items = snap.docs.map((doc) => doc.data() as GoLiveCheckItem);
    }
  } catch (err) {
    console.warn("Using default go-live checklist items:", err);
  }

  // 2. Automated Production Config Check
  const prodCheck = validateProductionConfiguration({
    ...config,
    activeRuleSetCodes: ["RTD_2030_STANDARD"],
    activeGisDatasets: ["MPLBP_CADASTRAL_2026", "MPLBP_RTD_2030"],
    emailSender: "osc@mplbp.gov.my",
  });

  const blockingIssues: string[] = [...prodCheck.errors];
  const warnings: string[] = [...prodCheck.warnings];

  // 3. Count items
  let passedCount = 0;
  let failedCount = 0;
  let waivedCount = 0;

  const categories = {} as Record<GoLiveCategory, { total: number; passed: number; status: "READY" | "BLOCKED" }>;

  const allCategories: GoLiveCategory[] = [
    "INFRASTRUCTURE",
    "SECURITY",
    "DATA_INTEGRITY",
    "RULE_SETS",
    "GIS_DATASETS",
    "AI_MODELS",
    "REPORTING",
    "NOTIFICATIONS",
    "BACKUP_DISASTER_RECOVERY",
    "UAT_ACCEPTANCE",
    "OPERATIONS_SUPPORT",
  ];

  allCategories.forEach((c) => {
    categories[c] = { total: 0, passed: 0, status: "READY" };
  });

  items.forEach((item) => {
    if (!categories[item.category]) {
      categories[item.category] = { total: 0, passed: 0, status: "READY" };
    }
    categories[item.category].total++;

    if (item.status === "PASS") {
      passedCount++;
      categories[item.category].passed++;
    } else if (item.status === "WAIVED") {
      waivedCount++;
      categories[item.category].passed++;
    } else if (item.status === "FAIL") {
      failedCount++;
      blockingIssues.push(`[${item.category}] ${item.name}: ${item.description}`);
      categories[item.category].status = "BLOCKED";
    } else {
      categories[item.category].status = "BLOCKED";
      blockingIssues.push(`[${item.category}] ${item.name} belum selesai (${item.status}).`);
    }
  });

  const totalChecks = items.length;
  const readinessPercentage = totalChecks > 0 ? Math.round(((passedCount + waivedCount) / totalChecks) * 100) : 0;
  const readyForGoLive = blockingIssues.length === 0 && readinessPercentage === 100;

  return {
    timestamp: new Date().toISOString(),
    appVersion: APP_VERSION,
    environment: config.env,
    totalChecks,
    passedChecks: passedCount,
    failedChecks: failedCount,
    waivedChecks: waivedCount,
    readinessPercentage,
    readyForGoLive,
    blockingIssues,
    warnings,
    categories,
    items,
  };
}
