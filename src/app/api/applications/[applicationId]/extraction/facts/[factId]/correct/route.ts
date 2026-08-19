import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { correctExtractedFact } from "@/lib/extraction/extractionService";

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

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { code: "PERMISSION_DENIED", error: "Hanya Pegawai dibenarkan membetulkan data perancangan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { correctedValue, reason } = body;

    if (correctedValue === undefined || correctedValue === null || String(correctedValue).trim() === "") {
      return NextResponse.json({ code: "VALIDATION_FAILED", error: "Nilai pembetulan diperlukan." }, { status: 400 });
    }

    const db = getAdminDb();
    await correctExtractedFact(applicationId, factId, correctedValue, uid, reason, db);

    return NextResponse.json({ success: true, message: "Pembetulan fakta berjaya disimpan." }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat pembetulan fakta";
    return NextResponse.json({ code: "CORRECT_FAILED", error: msg }, { status: 400 });
  }
}
