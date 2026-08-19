import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { confirmExtractedFact } from "@/lib/extraction/extractionService";

interface RouteParams {
  params: Promise<{
    applicationId: string;
    factId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId, factId } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role as string) || "APPLICANT";
    const uid = decoded.uid;

    // Only authorized officers can confirm facts
    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { code: "PERMISSION_DENIED", error: "Hanya Pegawai OSC / Pegawai Perancang dibenarkan mengesahkan data perancangan." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const db = getAdminDb();

    await confirmExtractedFact(applicationId, factId, uid, body.confirmedValue, db);
    return NextResponse.json({ success: true, message: "Fakta perancangan berjaya disahkan." }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat pengesahan fakta";
    return NextResponse.json({ code: "CONFIRM_FAILED", error: msg }, { status: 400 });
  }
}
