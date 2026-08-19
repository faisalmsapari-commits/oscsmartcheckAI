import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./client";
import { getFirebaseRuntimeStatus } from "./config";

let cachedAuth: Auth | null = null;
let isEmulatorConnected = false;

/**
 * Returns the modular Firebase Authentication instance.
 * Automatically hooks up to the local Auth emulator if NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();
  cachedAuth = getAuth(app);

  const status = getFirebaseRuntimeStatus();
  if (status.isEmulatorEnabled && !isEmulatorConnected && typeof window !== "undefined") {
    try {
      connectAuthEmulator(cachedAuth, "http://127.0.0.1:9099", { disableWarnings: true });
      isEmulatorConnected = true;
      console.info("[Firebase Auth] Connected to local Auth emulator on port 9099");
    } catch {
      // Ignore if already connected in hot-reload
    }
  }

  return cachedAuth;
}
