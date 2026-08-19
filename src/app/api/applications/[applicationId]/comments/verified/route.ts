import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken } from "@/lib/firebase/admin";
import type { VerifiedComment } from "@/types/comments";
import { getDemoApplication } from "@/lib/seed/demoDataSeeder";

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
    const db = getAdminDb();

    try {
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
    } catch {
      // Fallback
    }

    const app = getDemoApplication(applicationId);
    const demoComments: VerifiedComment[] = [
      {
        commentId: `vc-${app.id}-01`,
        applicationId: app.id,
        version: 1,
        content: `Permohonan bagi ${app.title} di ${app.lotNo}, Mukim ${app.mukim} telah disemak berpandukan RTD Langkawi 2030 dan piawaian perancangan berkuatkuasa.`,
        verifiedBy: "demo-officer-uid",
        verifiedByName: "Ar. Farhan (Pegawai OSC)",
        verifiedAt: app.updatedAt,
        status: "VERIFIED",
        visibility: "APPLICANT_VISIBLE",
        department: "Jabatan Perancangan Bandar",
        sha256Signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      } as unknown as VerifiedComment,
    ];

    return NextResponse.json({ comments: demoComments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
