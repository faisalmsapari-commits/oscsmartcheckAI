import { NextRequest, NextResponse } from "next/server";
import { unpublishReport } from "@/lib/reports/reportService";
import { UnpublishReportRequestSchema } from "@/lib/validation/reports.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function POST(
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

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan menarik balik penerbitan laporan." }, { status: 403 });
    }

    const { applicationId, reportId } = await params;
    const body = await req.json();
    const validated = UnpublishReportRequestSchema.parse(body);

    await unpublishReport(
      applicationId,
      reportId,
      validated.reason,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ message: "Laporan berjaya ditarik balik daripada paparan pemohon." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menarik balik laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
