import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/reports/reportService";
import { buildReportData } from "@/lib/reports/reportDataBuilder";
import { defaultPdfRenderer } from "@/lib/reports/pdfRenderer";
import { getAdminStorage } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; reportId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    const { applicationId, reportId } = await params;
    const report = await getReport(applicationId, reportId);

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak dijumpai." }, { status: 404 });
    }

    if (userRole === "APPLICANT" && report.visibility !== "APPLICANT_VISIBLE") {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    // Try downloading from Cloud Storage
    let pdfBuffer: Buffer;
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(report.storagePath);
      const [exists] = await file.exists();
      if (exists) {
        const [buf] = await file.download();
        pdfBuffer = buf;
      } else {
        // Fallback: render from snapshot
        const reportData = await buildReportData(applicationId, report.reportType);
        reportData.reportMetadata.reportVersion = report.version;
        pdfBuffer = await defaultPdfRenderer.renderReport(reportData);
      }
    } catch {
      const reportData = await buildReportData(applicationId, report.reportType);
      reportData.reportMetadata.reportVersion = report.version;
      pdfBuffer = await defaultPdfRenderer.renderReport(reportData);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuat turun laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
