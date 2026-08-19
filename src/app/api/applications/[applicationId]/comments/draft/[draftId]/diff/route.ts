import { NextRequest, NextResponse } from "next/server";
import { getCommentDiff } from "@/lib/comments/draftService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAdminDb } from "@/lib/firebase/admin";
import type { CommentDraft } from "@/types/comments";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; draftId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (userRole === "APPLICANT") {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    const { applicationId, draftId } = await params;
    const db = getAdminDb();
    const snap = await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Draf tidak dijumpai." }, { status: 404 });
    }

    const diff = getCommentDiff(snap.data() as CommentDraft);
    return NextResponse.json(diff);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat membandingkan perbezaan teks";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
