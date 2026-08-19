import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { markDocumentRejected } from "@/lib/documents/documentService";

interface RouteParams {
  params: Promise<{
    applicationId: string;
    documentId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId, documentId } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const role = (decodedToken.role as string) || "APPLICANT";
    const uid = decodedToken.uid;

    // Only Officers / Admins can reject documents
    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { code: "PERMISSION_DENIED", error: "Hanya Pegawai OSC atau Pentadbir dibenarkan menolak dokumen." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { code: "VALIDATION_FAILED", error: "Sila nyatakan ulasan / sebab penolakan dokumen." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    await markDocumentRejected(applicationId, documentId, uid, reason.trim(), db);

    return NextResponse.json({ success: true, message: "Dokumen telah ditandakan sebagai DITOLAK." }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ralat memproses penolakan dokumen";
    return NextResponse.json({ code: "SERVER_ERROR", error: message }, { status: 500 });
  }
}
