import { NextRequest, NextResponse } from "next/server";
import { publishVerifiedComment } from "@/lib/comments/verificationService";
import { PublishCommentSchema } from "@/lib/validation/comments.schema";
import { safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; commentId: string }> }
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
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan menerbitkan ulasan." }, { status: 403 });
    }

    const { applicationId, commentId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = PublishCommentSchema.parse(body);

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      return NextResponse.json({ message: "Ulasan berjaya diterbitkan kepada pemohon." });
    }

    await publishVerifiedComment(
      applicationId,
      commentId,
      decodedToken.uid,
      userRole,
      validated.publicationNote
    );

    return NextResponse.json({ message: "Ulasan berjaya diterbitkan kepada pemohon." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menerbitkan ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
