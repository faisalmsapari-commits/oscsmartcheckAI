import { NextRequest, NextResponse } from "next/server";
import { getReportReadiness } from "@/lib/reports/reportDataBuilder";
import { ReportType } from "@/types/reports";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    await getAuth().verifyIdToken(token);

    const { applicationId } = await params;
    const url = new URL(req.url);
    const reportType = (url.searchParams.get("type") as ReportType) || "SMARTCHECK_INTERNAL";

    const readiness = await getReportReadiness(applicationId, reportType);
    return NextResponse.json(readiness);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyemak kesediaan laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
