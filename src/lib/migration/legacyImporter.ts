/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";

export interface LegacyApplicationRecord {
  legacyReferenceNo: string;
  projectName: string;
  applicantName: string;
  applicantEmail: string;
  mukim: string;
  lotNo?: string;
  submissionDate: string;
  legacyStatus: string;
  remarks?: string;
}

export interface LegacyImportResult {
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ reference: string; error: string }>;
  reconciliationSummary: string;
}

/**
 * Imports and normalizes legacy planning application records
 */
export async function importLegacyApplications(
  records: LegacyApplicationRecord[],
  dryRun = false,
  customDb?: Firestore
): Promise<LegacyImportResult> {
  const db = customDb || getAdminDb();
  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: Array<{ reference: string; error: string }> = [];

  for (const rec of records) {
    try {
      if (!rec.legacyReferenceNo || !rec.projectName) {
        failedCount++;
        errors.push({
          reference: rec.legacyReferenceNo || "UNKNOWN",
          error: "Missing required reference or project name.",
        });
        continue;
      }

      // Check if already imported
      const existing = await db
        .collection("applications")
        .where("legacyReference", "==", rec.legacyReferenceNo)
        .limit(1)
        .get();

      if (!existing.empty) {
        skippedCount++;
        continue;
      }

      if (!dryRun) {
        const appRef = db.collection("applications").doc();
        const now = new Date().toISOString();

        await appRef.set({
          id: appRef.id,
          applicationNo: `LEGACY-${rec.legacyReferenceNo}`,
          legacyReference: rec.legacyReferenceNo,
          title: rec.projectName,
          developmentType: "LAIN_LAIN",
          district: "Langkawi",
          state: "Kedah",
          mukim: rec.mukim || "Kuah",
          applicantUid: "legacy-migrated-user",
          status: "COMPLETED",
          currentVersion: 1,
          dataOrigin: "MIGRATED",
          submittedAt: rec.submissionDate || now,
          createdAt: now,
          updatedAt: now,
          landDetails: {
            lotNo: rec.lotNo || "TIADA",
            mukim: rec.mukim || "Kuah",
            district: "Langkawi",
            state: "Kedah",
          },
        });
      }

      importedCount++;
    } catch (err: any) {
      failedCount++;
      errors.push({
        reference: rec.legacyReferenceNo,
        error: err.message,
      });
    }
  }

  return {
    totalProcessed: records.length,
    importedCount,
    skippedCount,
    failedCount,
    errors,
    reconciliationSummary: `Proses migrasi data legasi selesai: ${importedCount} diimport, ${skippedCount} dilangkau (duplikasi), ${failedCount} gagal.`,
  };
}
