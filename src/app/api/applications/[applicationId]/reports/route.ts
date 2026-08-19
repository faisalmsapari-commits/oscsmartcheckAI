import { NextRequest, NextResponse } from "next/server";
import { getReports, generateSmartCheckReport } from "@/lib/reports/reportService";
import { GenerateReportRequestSchema } from "@/lib/validation/reports.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { getDemoApplication } from "@/lib/seed/demoDataSeeder";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    const { applicationId } = await params;
    try {
      const reports = await getReports(applicationId, userRole);
      if (reports && reports.length > 0) {
        return NextResponse.json({ reports });
      }
    } catch {
      // Fallback
    }

    const app = getDemoApplication(applicationId);
    const demoReports = [
      {
        reportId: `rep-${app.id}-01`,
        applicationId: app.id,
        applicationNo: app.applicationNo,
        reportType: "OFFICIAL_COMPLIANCE",
        version: 1,
        title: `Laporan Penilaian Pematuhan SmartCheck — ${app.applicationNo}`,
        generatedBy: "demo-officer-uid",
        generatedByName: "Ar. Farhan (Pegawai OSC)",
        generatedAt: app.updatedAt,
        status: app.status === "COMPLETED" || app.status === "VERIFIED" ? "PUBLISHED" : "DRAFT",
        downloadUrl: `/api/applications/${app.id}/reports/rep-${app.id}-01/download`,
        fileSize: 2450100,
        pdfSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
    ];

    return NextResponse.json({ reports: demoReports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan menjana laporan rasmi." }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = GenerateReportRequestSchema.parse(body);

    const report = await generateSmartCheckReport(
      applicationId,
      validated.reportType,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ report, message: "Laporan rasmi SmartCheck berjaya dijana." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menjana laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
