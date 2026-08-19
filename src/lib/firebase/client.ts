import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig, getFirebaseRuntimeStatus } from "./config";

let cachedApp: FirebaseApp | null = null;

/**
 * Initializes and returns the singleton Firebase App instance.
 * Reuses existing initialized instance if already available.
 */
export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    cachedApp = existingApps[0];
    return cachedApp;
  }

  const config = getFirebaseConfig();
  const status = getFirebaseRuntimeStatus();

  // If running in development without config, initialize with placeholder to prevent build-time crash
  if (!status.isConfigured && typeof window === "undefined") {
    cachedApp = initializeApp(
      {
        apiKey: "mock-api-key-build-only",
        authDomain: "localhost",
        projectId: "osc-smartcheck-mplbp",
        storageBucket: "localhost",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:mock",
      },
      "build-placeholder"
    );
    return cachedApp;
  }

  cachedApp = initializeApp(config);
  return cachedApp;
}
