import { NextRequest, NextResponse } from "next/server";
import { analyzeSiteBuffer } from "@/lib/gis/spatialService";
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
    const { searchParams } = new URL(req.url);
    const radiusMeters = searchParams.get("radius") ? Number(searchParams.get("radius")) : 500;

    // Instant return for demo applications
    if (applicationId.startsWith("app-demo-")) {
      const { bufferData } = getDemoGisForApp(applicationId);
      return NextResponse.json(bufferData);
    }

    try {
      const result = await analyzeSiteBuffer(applicationId, radiusMeters);
      if (result) return NextResponse.json(result);
    } catch {
      // Fallback
    }

    const { bufferData } = getDemoGisForApp(applicationId);
    return NextResponse.json(bufferData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat analisis penimbal tapak";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
