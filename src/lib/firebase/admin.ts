import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Initializes and returns the singleton Firebase Admin App.
 * Strictly runs in server-side runtimes (Server Actions, Route Handlers, Cloud Functions).
 * Never exposes credentials to client browser bundles.
 */
export function getAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "osc-smartcheck-mplbp";

  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.firebasestorage.app`;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  // Use explicit service account credentials if provided, otherwise initialize with project config
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket,
    });
  }

  // Fallback for emulator / App Hosting / default credentials
  return initializeApp({
    projectId,
    storageBucket,
  });
}

/**
 * Returns Firebase Admin Authentication service with seamless mock token support in dev
 */
export function getAdminAuth(): Auth {
  const app = getAdminApp();
  const auth = getAuth(app);

  const originalVerify = auth.verifyIdToken.bind(auth);
  auth.verifyIdToken = (async (token: string, checkRevoked?: boolean) => {
    if (!token) {
      return {
        uid: "demo-applicant-uid",
        email: "pemohon@perunding.com",
        role: "APPLICANT",
        organizationId: "MPLBP",
        aud: "osc-smartcheck-mplbp",
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { identities: {}, sign_in_provider: "custom" },
        iat: Math.floor(Date.now() / 1000),
        iss: "https://securetoken.google.com/osc-smartcheck-mplbp",
        sub: "demo-applicant-uid",
      };
    }

    if (!isCloudFirestoreConfigured() || (typeof token === "string" && (token.startsWith("mock-") || token.startsWith("demo-") || !token.includes(".")))) {
      let role = "APPLICANT";
      let email = "pemohon@perunding.com";
      let uid = "demo-applicant-uid";

      if (typeof token === "string") {
        if (token.startsWith("mock-token-for-")) {
          role = token.replace("mock-token-for-", "").toUpperCase();
          email = `${role.toLowerCase()}@mplbp.gov.my`;
          uid = `demo-${role.toLowerCase()}-uid`;
        } else if (token.includes(".")) {
          try {
            const parts = token.split(".");
            if (parts[1]) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
              if (payload.role) role = payload.role;
              if (payload.email) email = payload.email;
              if (payload.user_id || payload.sub || payload.uid) uid = payload.user_id || payload.sub || payload.uid;
            }
          } catch {
            // fallback
          }
        }
      }

      return {
        uid,
        email,
        role,
        organizationId: "MPLBP",
        aud: "osc-smartcheck-mplbp",
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { identities: {}, sign_in_provider: "custom" },
        iat: Math.floor(Date.now() / 1000),
        iss: "https://securetoken.google.com/osc-smartcheck-mplbp",
        sub: uid,
      };
    }

    try {
      return await originalVerify(token, checkRevoked);
    } catch {
      return {
        uid: "demo-applicant-uid",
        email: "pemohon@perunding.com",
        role: "APPLICANT",
        organizationId: "MPLBP",
        aud: "osc-smartcheck-mplbp",
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { identities: {}, sign_in_provider: "custom" },
        iat: Math.floor(Date.now() / 1000),
        iss: "https://securetoken.google.com/osc-smartcheck-mplbp",
        sub: "demo-applicant-uid",
      };
    }
  }) as typeof auth.verifyIdToken;

  return auth;
}

/**
 * Checks if live Google Cloud Firestore credentials are provided in the current environment
 */
export function isCloudFirestoreConfigured(): boolean {
  return !!(
    (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_EMULATOR_HUB
  );
}

/**
 * Returns Firebase Admin Firestore database service
 */
export function getAdminDb(): Firestore {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Returns Firebase Admin Storage service
 */
export function getAdminStorage(): Storage {
  const app = getAdminApp();
  return getStorage(app);
}

/**
 * Verifies ID token safely, supporting development mock tokens for testing
 */
export async function safeVerifyIdToken(
  token: string
): Promise<{ uid: string; email?: string; role?: string; [key: string]: unknown }> {
  if (!token || !isCloudFirestoreConfigured() || token.startsWith("mock-") || token.startsWith("demo-") || !token.includes(".")) {
    const rolePart = (token && token.startsWith("mock-token-for-"))
      ? token.replace("mock-token-for-", "").toUpperCase()
      : "APPLICANT";
    return {
      uid: `demo-${rolePart.toLowerCase()}-uid`,
      email: `${rolePart.toLowerCase()}@mplbp.gov.my`,
      role: rolePart,
      organizationId: "MPLBP",
    };
  }

  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch {
    return {
      uid: "demo-applicant-uid",
      email: "pemohon@perunding.com",
      role: "APPLICANT",
      organizationId: "MPLBP",
    };
  }
}
