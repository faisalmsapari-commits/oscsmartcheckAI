import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/reports/reportService";
import { getReportFreshness } from "@/lib/reports/reportDataBuilder";
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

    const freshness = await getReportFreshness(applicationId, reportId);

    return NextResponse.json({ report, freshness });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
