import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentDraftForApp } from "@/lib/seed/demoData";

export async function GET(
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

    if (userRole === "APPLICANT") {
      return NextResponse.json({ error: "Pemohon tidak dibenarkan melihat draf dalaman." }, { status: 403 });
    }

    const { applicationId } = await params;

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const draft = getDemoCommentDraftForApp(applicationId);
      return NextResponse.json({ draft });
    }

    const db = getAdminDb();
    const draftsSnap = await db
      .collection(`applications/${applicationId}/commentDrafts`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (draftsSnap.empty) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({ draft: draftsSnap.docs[0].data() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan draf";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
