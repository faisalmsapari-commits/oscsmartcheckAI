import { NextRequest, NextResponse } from "next/server";
import { buildAuditManifest } from "@/lib/reports/auditPackageService";
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

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dan Pentadbir dibenarkan melihat manifest audit." }, { status: 403 });
    }

    const { applicationId, reportId } = await params;
    const manifest = await buildAuditManifest(applicationId, reportId);

    return NextResponse.json(manifest);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan manifest audit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
