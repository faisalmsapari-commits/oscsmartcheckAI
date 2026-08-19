import { NextRequest, NextResponse } from "next/server";
import { getApplicationSite, setApplicationLocation, compareLcpAndGisSite } from "@/lib/gis/spatialService";
import { SetApplicationLocationRequestSchema } from "@/lib/validation/gis.schema";
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
      const { site, comparison } = getDemoGisForApp(applicationId);
      return NextResponse.json({ site, comparison });
    }

    try {
      const site = await getApplicationSite(applicationId);
      const comparison = await compareLcpAndGisSite(applicationId);
      if (site) {
        return NextResponse.json({ site, comparison });
      }
    } catch {
      // Fallback
    }

    const { site, comparison } = getDemoGisForApp(applicationId);
    return NextResponse.json({ site, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan maklumat tapak";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);

    const { applicationId } = await params;
    const body = await req.json();
    const validated = SetApplicationLocationRequestSchema.parse(body);

    const site = await setApplicationLocation(
      applicationId,
      decodedToken.uid,
      (decodedToken.role as string) || "APPLICANT",
      validated
    );

    return NextResponse.json({ site, message: "Lokasi permohonan berjaya disimpan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menetapkan lokasi tapak";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
