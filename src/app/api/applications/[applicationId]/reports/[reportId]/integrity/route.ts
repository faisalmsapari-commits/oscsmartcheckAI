import { NextRequest, NextResponse } from "next/server";
import { verifyReportIntegrity } from "@/lib/reports/reportService";
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
    await getAuth().verifyIdToken(token);

    const { applicationId, reportId } = await params;
    const integrity = await verifyReportIntegrity(applicationId, reportId);

    return NextResponse.json(integrity);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyemak integriti laporan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
