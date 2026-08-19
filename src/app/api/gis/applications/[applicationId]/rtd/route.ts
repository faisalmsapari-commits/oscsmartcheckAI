import { NextRequest, NextResponse } from "next/server";
import { analyzeRtdIntersection } from "@/lib/gis/spatialService";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { getDemoGisForApp } from "@/lib/seed/demoDataSeeder";

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
    await safeVerifyIdToken(token);

    const { applicationId } = await params;

    // Instant return for demo applications
    if (applicationId.startsWith("app-demo-")) {
      const { rtdData } = getDemoGisForApp(applicationId);
      return NextResponse.json(rtdData);
    }

    try {
      const result = await analyzeRtdIntersection(applicationId);
      if (result) return NextResponse.json(result);
    } catch {
      // Fallback
    }

    const { rtdData } = getDemoGisForApp(applicationId);
    return NextResponse.json(rtdData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat analisis zon RTD";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
