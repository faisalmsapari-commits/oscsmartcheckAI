import { FirebaseClientConfig, FirebaseRuntimeStatus } from "@/types/firebase";

/**
 * Returns the Firebase Client configuration extracted strictly from environment variables.
 * Never hard-codes Firebase secrets or configuration parameters.
 */
export function getFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

/**
 * Validates whether all required Firebase environment variables are populated.
 */
export function getFirebaseRuntimeStatus(): FirebaseRuntimeStatus {
  const config = getFirebaseConfig();
  const requiredKeys: Array<keyof FirebaseClientConfig> = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingKeys = requiredKeys.filter((key) => !config[key]);

  return {
    isConfigured: missingKeys.length === 0,
    isEmulatorEnabled: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true",
    missingKeys,
  };
}
