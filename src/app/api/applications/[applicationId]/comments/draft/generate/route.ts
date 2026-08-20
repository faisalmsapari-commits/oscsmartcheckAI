import { NextRequest, NextResponse } from "next/server";
import { createAiDraft } from "@/lib/comments/draftService";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentDraftForApp } from "@/lib/seed/demoData";
import type { SmartCheckRecord } from "@/types/rules";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan menjana draf ulasan AI." }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const style = body.style || "STANDARD";

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const draft = getDemoCommentDraftForApp(applicationId);
      return NextResponse.json({ draft, message: "Draf ulasan AI berjaya dijana." });
    }

    const db = getAdminDb();
    const scSnap = await db
      .collection(`applications/${applicationId}/smartChecks`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (scSnap.empty) {
      return NextResponse.json({ error: "Sila jalankan pra-semakan SmartCheck terlebih dahulu." }, { status: 400 });
    }

    const smartCheck = scSnap.docs[0].data() as SmartCheckRecord;

    const draft = await createAiDraft(
      applicationId,
      smartCheck.smartCheckId,
      style,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ draft, message: "Draf ulasan AI berjaya dijana." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menjana draf ulasan AI";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
