import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./client";
import { getFirebaseRuntimeStatus } from "./config";

let cachedDb: Firestore | null = null;
let isEmulatorConnected = false;

/**
 * Returns the modular Cloud Firestore database instance.
 * Automatically connects to local Firestore emulator if NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
 */
export function getFirestoreDb(): Firestore {
  if (cachedDb) {
    return cachedDb;
  }

  const app = getFirebaseApp();
  cachedDb = getFirestore(app);

  const status = getFirebaseRuntimeStatus();
  if (status.isEmulatorEnabled && !isEmulatorConnected && typeof window !== "undefined") {
    try {
      connectFirestoreEmulator(cachedDb, "127.0.0.1", 8080);
      isEmulatorConnected = true;
      console.info("[Cloud Firestore] Connected to local Firestore emulator on port 8080");
    } catch {
      // Ignore if already connected in hot-reload
    }
  }

  return cachedDb;
}
