import { NextRequest, NextResponse } from "next/server";
import { compareSmartCheckRuns } from "@/lib/issues/dashboardService";
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
    const { searchParams } = new URL(req.url);
    const runA = searchParams.get("runA");
    const runB = searchParams.get("runB");

    if (!runA || !runB) {
      return NextResponse.json({ error: "Sila nyatakan runA dan runB untuk perbandingan." }, { status: 400 });
    }

    const comparison = await compareSmartCheckRuns(applicationId, runA, runB);
    return NextResponse.json(comparison);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat membandingkan larian SmartCheck";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
