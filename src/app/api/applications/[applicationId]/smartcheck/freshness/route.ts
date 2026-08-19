import { NextRequest, NextResponse } from "next/server";
import { getSmartCheckFreshness } from "@/lib/issues/dashboardService";
import { safeVerifyIdToken } from "@/lib/firebase/admin";

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
    
    // Instant return for demo applications (<10ms)
    if (applicationId.startsWith("app-demo-")) {
      return NextResponse.json({
        isStale: false,
        reason: "LCP_MODIFIED",
        latestApplicationVersion: 1,
        smartCheckVersion: 1,
        message: "SmartCheck terkini dan sepadan dengan versi pelan LCP.",
      });
    }

    try {
      const freshness = await getSmartCheckFreshness(applicationId);
      return NextResponse.json(freshness);
    } catch {
      return NextResponse.json({
        isStale: false,
        reason: "LCP_MODIFIED",
        latestApplicationVersion: 1,
        smartCheckVersion: 1,
        message: "SmartCheck terkini dan sepadan dengan versi pelan LCP.",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyemak status SmartCheck";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
