/**
 * Firebase Web SDK Configuration Interface
 */
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase Client Runtime State
 */
export interface FirebaseRuntimeStatus {
  isConfigured: boolean;
  isEmulatorEnabled: boolean;
  missingKeys: string[];
}
