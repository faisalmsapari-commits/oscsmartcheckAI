import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { AuditManifest, ReportRecord } from "../../types/reports.ts";
import { buildReportData } from "./reportDataBuilder.ts";

/**
 * Builds the official audit manifest for an application report
 */
export async function buildAuditManifest(
  applicationId: string,
  reportId: string,
  customDb?: Firestore
): Promise<AuditManifest> {
  const db = customDb || getAdminDb();

  const repSnap = await db.collection(`applications/${applicationId}/reports`).doc(reportId).get();
  if (!repSnap.exists) {
    throw new Error("Laporan tidak dijumpai.");
  }
  const report = repSnap.data() as ReportRecord;
  const reportData = await buildReportData(applicationId, "SMARTCHECK_AUDIT_PACKAGE", db);

  return {
    manifestVersion: "1.0.0",
    applicationId,
    reportId,
    generatedAt: new Date().toISOString(),
    sourceVersions: reportData.sourceVersions,
    files: [
      {
        fileName: report.fileName,
        storagePath: report.storagePath,
        fileSize: report.fileSize,
        mimeType: report.mimeType,
        sha256: report.checksum,
      },
    ],
  };
}
