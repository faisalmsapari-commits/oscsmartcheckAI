import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import { getFirebaseApp } from "./client";
import { getFirebaseRuntimeStatus } from "./config";

let cachedStorage: FirebaseStorage | null = null;
let isEmulatorConnected = false;

/**
 * Returns the modular Cloud Storage instance.
 * Automatically connects to local Storage emulator if NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (cachedStorage) {
    return cachedStorage;
  }

  const app = getFirebaseApp();
  cachedStorage = getStorage(app);

  const status = getFirebaseRuntimeStatus();
  if (status.isEmulatorEnabled && !isEmulatorConnected && typeof window !== "undefined") {
    try {
      connectStorageEmulator(cachedStorage, "127.0.0.1", 9199);
      isEmulatorConnected = true;
      console.info("[Cloud Storage] Connected to local Storage emulator on port 9199");
    } catch {
      // Ignore if already connected in hot-reload
    }
  }

  return cachedStorage;
}
