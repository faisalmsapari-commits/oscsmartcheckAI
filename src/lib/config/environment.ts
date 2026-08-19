export type AppEnvironment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  env: AppEnvironment;
  appVersion: string;
  appUrl: string;
  firebaseProjectId: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  allowAllNotificationRecipients: boolean;
  notificationAllowlist: string[];
}

export const APP_VERSION = "1.0.0";

/**
 * Resolves current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const envName = (process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_APP_ENV || "production"
    : "development") as AppEnvironment;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "osc-smartcheck-dev";

  const allowlist = (process.env.STAGING_NOTIFICATION_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    env: envName,
    appVersion: APP_VERSION,
    appUrl,
    firebaseProjectId,
    isProduction: envName === "production",
    isStaging: envName === "staging",
    isDevelopment: envName === "development",
    allowAllNotificationRecipients: envName === "production",
    notificationAllowlist: allowlist,
  };
}

export interface ProductionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates production environment configuration before deployment
 */
export function validateProductionConfiguration(
  config: Partial<EnvironmentConfig> & {
    activeRuleSetCodes?: string[];
    activeGisDatasets?: string[];
    emailSender?: string;
  }
): ProductionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Reject localhost URLs in production
  if (config.isProduction && config.appUrl && (config.appUrl.includes("localhost") || config.appUrl.includes("127.0.0.1"))) {
    errors.push("URL aplikasi pengeluaran (production) tidak boleh mengandungi 'localhost' atau '127.0.0.1'.");
  }

  // Check 2: Reject TEST_ONLY rule sets in production
  if (config.isProduction && config.activeRuleSetCodes) {
    const hasTestRules = config.activeRuleSetCodes.some(
      (code) => code.toUpperCase().includes("TEST") || code.toUpperCase().includes("MOCK")
    );
    if (hasTestRules) {
      errors.push("Set peraturan pengeluaran tidak boleh mengandungi set peraturan TEST/MOCK.");
    }
  }

  // Check 3: Reject test GIS datasets in production
  if (config.isProduction && config.activeGisDatasets) {
    const hasTestGis = config.activeGisDatasets.some(
      (ds) => ds.toUpperCase().includes("TEST") || ds.toUpperCase().includes("SAMPLE")
    );
    if (hasTestGis) {
      errors.push("Dataset GIS pengeluaran tidak boleh mengandungi dataset TEST atau SAMPLE.");
    }
  }

  // Check 4: Email sender validation
  if (config.isProduction && config.emailSender && !config.emailSender.endsWith("@mplbp.gov.my")) {
    warnings.push("Domain penghantar emel rasmi disyorkan menggunakan '@mplbp.gov.my'.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifies if a notification recipient is allowed in non-production environments
 */
export function isNotificationRecipientAllowed(
  recipientEmail: string,
  config: EnvironmentConfig = getEnvironmentConfig()
): boolean {
  if (config.isProduction) return true;
  if (config.notificationAllowlist.length === 0) return true; // development mock mode

  const emailLower = recipientEmail.toLowerCase().trim();
  return config.notificationAllowlist.some((allowed) => emailLower === allowed || emailLower.endsWith(`@${allowed}`));
}
