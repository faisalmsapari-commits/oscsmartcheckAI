/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";

export interface OrphanDiagnosisResult {
  totalIssuesChecked: number;
  totalReportsChecked: number;
  orphanedIssues: string[];
  orphanedReports: string[];
  inconsistenciesCount: number;
  summary: string;
}

/**
 * Diagnostic tool to detect disconnected or orphaned subcollection records
 */
export async function findOrphanedRecords(
  customDb?: Firestore
): Promise<OrphanDiagnosisResult> {
  const db = customDb || getAdminDb();
  const orphanedIssues: string[] = [];
  const orphanedReports: string[] = [];

  // 1. Get all application IDs
  const appsSnap = await db.collection("applications").get();
  const validAppIds = new Set(appsSnap.docs.map((d) => d.id));

  // 2. Scan issues
  const issuesSnap = await db.collectionGroup("issues").get();
  issuesSnap.docs.forEach((doc) => {
    const parentAppId = doc.ref.parent.parent?.id;
    if (parentAppId && !validAppIds.has(parentAppId)) {
      orphanedIssues.push(doc.id);
    }
  });

  // 3. Scan reports
  const reportsSnap = await db.collectionGroup("reports").get();
  reportsSnap.docs.forEach((doc) => {
    const parentAppId = doc.ref.parent.parent?.id;
    if (parentAppId && !validAppIds.has(parentAppId)) {
      orphanedReports.push(doc.id);
    }
  });

  const inconsistenciesCount = orphanedIssues.length + orphanedReports.length;

  return {
    totalIssuesChecked: issuesSnap.size,
    totalReportsChecked: reportsSnap.size,
    orphanedIssues,
    orphanedReports,
    inconsistenciesCount,
    summary:
      inconsistenciesCount === 0
        ? "Integriti pangkalan data sempurna: Tiada rekod terasing (orphan records) dikesan."
        : `Dikesan ${inconsistenciesCount} rekod tidak konsisten (${orphanedIssues.length} isu, ${orphanedReports.length} laporan).`,
  };
}
