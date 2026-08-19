import type { GoLiveReadinessReport } from "./goLiveTypes";
import { DEFAULT_GO_LIVE_ITEMS } from "./goLiveTypes";

export const INITIAL_GO_LIVE_REPORT: GoLiveReadinessReport = {
  timestamp: "2026-08-19T10:00:00Z",
  appVersion: "1.0.0",
  environment: "PRODUCTION_READY",
  totalChecks: 12,
  passedChecks: 12,
  failedChecks: 0,
  waivedChecks: 0,
  readinessPercentage: 100,
  readyForGoLive: true,
  blockingIssues: [],
  warnings: [],
  categories: {
    INFRASTRUCTURE: { total: 1, passed: 1, status: "READY" },
    SECURITY: { total: 2, passed: 2, status: "READY" },
    DATA_INTEGRITY: { total: 1, passed: 1, status: "READY" },
    RULE_SETS: { total: 1, passed: 1, status: "READY" },
    GIS_DATASETS: { total: 1, passed: 1, status: "READY" },
    AI_MODELS: { total: 1, passed: 1, status: "READY" },
    REPORTING: { total: 1, passed: 1, status: "READY" },
    NOTIFICATIONS: { total: 1, passed: 1, status: "READY" },
    BACKUP_DISASTER_RECOVERY: { total: 1, passed: 1, status: "READY" },
    UAT_ACCEPTANCE: { total: 1, passed: 1, status: "READY" },
    OPERATIONS_SUPPORT: { total: 1, passed: 1, status: "READY" },
  },
  items: DEFAULT_GO_LIVE_ITEMS,
};
