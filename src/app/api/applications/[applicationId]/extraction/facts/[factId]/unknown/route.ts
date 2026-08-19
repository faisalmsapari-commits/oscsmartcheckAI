import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { markFactUnknown } from "@/lib/extraction/extractionService";

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
        { code: "PERMISSION_DENIED", error: "Hanya Pegawai dibenarkan mengemas kini data perancangan." },
        { status: 403 }
      );
    }

    const db = isCloudFirestoreConfigured() ? getAdminDb() : undefined;
    await markFactUnknown(applicationId, factId, uid, db);

    return NextResponse.json({ success: true, message: "Fakta telah ditandakan sebagai Tidak Ditemui." }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat mengemas kini fakta";
    return NextResponse.json({ code: "UPDATE_FAILED", error: msg }, { status: 400 });
  }
}
