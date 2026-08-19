import { NextRequest, NextResponse } from "next/server";
import { verifyApplicationSite } from "@/lib/gis/spatialService";
import { VerifyLocationRequestSchema } from "@/lib/validation/gis.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { getDemoGisForApp } from "@/lib/seed/demoDataSeeder";

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
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    const { applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = VerifyLocationRequestSchema.parse(body);

    if (applicationId.startsWith("app-demo-")) {
      const { site } = getDemoGisForApp(applicationId);
      return NextResponse.json({
        site: {
          ...site,
          verificationStatus: "OFFICER_VERIFIED",
          verifiedBy: decodedToken.uid,
          verifiedAt: new Date().toISOString(),
          verificationComment: validated.verificationComment || "Lokasi telah disahkan oleh Pegawai.",
        },
        message: "Lokasi tapak berjaya disahkan oleh Pegawai.",
      });
    }

    const site = await verifyApplicationSite(
      applicationId,
      decodedToken.uid,
      userRole,
      validated.verificationComment
    );

    return NextResponse.json({
      site,
      message: "Lokasi tapak berjaya disahkan oleh Pegawai.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pengesahan lokasi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
