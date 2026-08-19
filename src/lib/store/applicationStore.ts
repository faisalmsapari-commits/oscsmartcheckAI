import { DEMO_10_APPLICATIONS } from "@/lib/seed/demoDataSeeder";

export type StoredApplication = Record<string, unknown>;

// Global in-memory application store for seamless local & serverless persistence
const globalStore = global as unknown as {
  __osc_applications_store__?: Map<string, StoredApplication>;
};

if (!globalStore.__osc_applications_store__) {
  globalStore.__osc_applications_store__ = new Map();
  // Prepopulate with demo applications
  DEMO_10_APPLICATIONS.forEach((app) => {
    globalStore.__osc_applications_store__!.set(app.id, app as unknown as StoredApplication);
  });
}

const applicationStore = globalStore.__osc_applications_store__!;

export function saveApplicationToStore(id: string, data: StoredApplication): StoredApplication {
  const existing = applicationStore.get(id) || {};
  const merged: StoredApplication = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  applicationStore.set(id, merged);
  return merged;
}

export function getApplicationFromStore(id: string): StoredApplication | null {
  if (applicationStore.has(id)) {
    return applicationStore.get(id)!;
  }
  // Check if it's one of the demo applications
  const demo = DEMO_10_APPLICATIONS.find((a) => a.id === id);
  if (demo) {
    const demoTyped = demo as unknown as StoredApplication;
    applicationStore.set(id, demoTyped);
    return demoTyped;
  }
  return null;
}

export function getAllApplicationsFromStore(): StoredApplication[] {
  return Array.from(applicationStore.values());
}
