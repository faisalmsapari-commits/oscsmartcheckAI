import { NextRequest, NextResponse } from "next/server";
import { aggregateDailyAnalytics } from "@/lib/analytics/aggregationService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!["ADMIN", "SUPER_ADMIN", "OSC_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await aggregateDailyAnalytics(body.targetDate);

    return NextResponse.json({
      message: "Pengagregatan analitik harian berjaya dilaksanakan.",
      snapshotId: result.snapshot.snapshotId,
      triggeredAlertsCount: result.triggeredAlerts.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pengagregatan analitik";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
