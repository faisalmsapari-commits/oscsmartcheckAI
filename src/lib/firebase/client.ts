import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig, getFirebaseRuntimeStatus } from "./config";

let cachedApp: FirebaseApp | null = null;

const FALLBACK_DEMO_CONFIG = {
  apiKey: "AIzaSyMockDemoKeyForOSCSmartCheck2026",
  authDomain: "osc-smartcheck-mplbp.firebaseapp.com",
  projectId: "osc-smartcheck-mplbp",
  storageBucket: "osc-smartcheck-mplbp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo-oscsmartcheck",
};

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

  try {
    if (!status.isConfigured) {
      cachedApp = initializeApp(FALLBACK_DEMO_CONFIG);
      return cachedApp;
    }

    cachedApp = initializeApp(config);
    return cachedApp;
  } catch (err) {
    console.warn("[Firebase] Standard init fallback triggered:", err);
    if (existingApps.length > 0) {
      cachedApp = existingApps[0];
      return cachedApp;
    }
    cachedApp = initializeApp(FALLBACK_DEMO_CONFIG, "fallback-app");
    return cachedApp;
  }
}

