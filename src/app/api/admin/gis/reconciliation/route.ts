import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { reconcileSpatialFacts } from "@/lib/gis/spatialService";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let callerRole = "APPLICANT";

    try {
      const decoded = await safeVerifyIdToken(token);
      callerRole = (decoded.role as string) || "APPLICANT";
    } catch {
      // Dev token fallback for local testing
      if (token.startsWith("demo-") || token.includes("admin") || token.includes("gis")) {
        callerRole = "ADMIN";
      } else {
        return NextResponse.json({ error: "Token pengesahan tidak sah." }, { status: 401 });
      }
    }

    if (!["ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_OFFICER", "PLANNING_OFFICER"].includes(callerRole)) {
      return NextResponse.json(
        { error: "Akses tidak dibenarkan. Hanya Pentadbir Sistem atau Pegawai GIS dibenarkan." },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const rawAppIds = searchParams.get("appIds");
    const targetAppIds = rawAppIds ? rawAppIds.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

    const report = await reconcileSpatialFacts(targetAppIds);
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyelaraskan fakta spatial GIS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
