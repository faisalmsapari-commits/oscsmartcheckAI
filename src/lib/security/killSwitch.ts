export type FeatureFlagKey =
  | "AI_COMMENT_ENABLED"
  | "DOCUMENT_AI_ENABLED"
  | "NOTIFICATIONS_ENABLED"
  | "GIS_ADVANCED_ENABLED"
  | "MANAGEMENT_ANALYTICS_ENABLED";

export interface KillSwitchState {
  key: FeatureFlagKey;
  enabled: boolean;
  reason?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const defaultKillSwitches: Record<FeatureFlagKey, boolean> = {
  AI_COMMENT_ENABLED: true,
  DOCUMENT_AI_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  GIS_ADVANCED_ENABLED: true,
  MANAGEMENT_ANALYTICS_ENABLED: true,
};

const killSwitchStore = new Map<FeatureFlagKey, boolean>(
  Object.entries(defaultKillSwitches) as [FeatureFlagKey, boolean][]
);

/**
 * Checks if a feature flag is enabled
 */
export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  // Environment variable override
  const envVal = process.env[`FEATURE_${key}`];
  if (envVal !== undefined) {
    return envVal === "true" || envVal === "1";
  }

  return killSwitchStore.get(key) ?? true;
}

/**
 * Updates operational kill switch state
 */
export function setFeatureFlag(key: FeatureFlagKey, enabled: boolean): void {
  killSwitchStore.set(key, enabled);
}

/**
 * Resets all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  killSwitchStore.clear();
  Object.entries(defaultKillSwitches).forEach(([k, v]) => {
    killSwitchStore.set(k as FeatureFlagKey, v);
  });
}
