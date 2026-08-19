import { NextRequest, NextResponse } from "next/server";
import { publishReport } from "@/lib/reports/reportService";
import { PublishReportRequestSchema } from "@/lib/validation/reports.schema";
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
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan menerbitkan laporan kepada pemohon." }, { status: 403 });
    }

    const { applicationId, reportId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = PublishReportRequestSchema.parse(body);

    await publishReport(
      applicationId,
      reportId,
      decodedToken.uid,
      userRole,
      validated.publicationNote
    );

    return NextResponse.json({ message: "Laporan rasmi berjaya diterbitkan kepada pemohon." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menerbitkan laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
