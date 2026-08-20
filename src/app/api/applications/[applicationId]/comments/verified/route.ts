import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import type { VerifiedComment } from "@/types/comments";
import { getDemoVerifiedCommentsForApp } from "@/lib/seed/demoData";

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
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    const { applicationId } = await params;

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const demoComments = getDemoVerifiedCommentsForApp(applicationId);
      return NextResponse.json({ comments: demoComments });
    }

    const db = getAdminDb();
    const snap = await db
      .collection(`applications/${applicationId}/verifiedComments`)
      .orderBy("version", "desc")
      .get();

    let comments = snap.docs.map((d) => d.data() as VerifiedComment);

    if (userRole === "APPLICANT") {
      comments = comments.filter((c) => c.visibility === "APPLICANT_VISIBLE" && c.status === "VERIFIED");
    }

    if (comments.length > 0) {
      return NextResponse.json({ comments });
    }

    return NextResponse.json({ comments: getDemoVerifiedCommentsForApp(applicationId) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
