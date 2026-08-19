import { NextRequest, NextResponse } from "next/server";
import { verifyOscComment } from "@/lib/comments/verificationService";
import { VerifyCommentSchema } from "@/lib/validation/comments.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function POST(
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

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mengesahkan ulasan OSC." }, { status: 403 });
    }

    const { applicationId, draftId } = await params;
    const body = await req.json();
    const validated = VerifyCommentSchema.parse(body);

    const verified = await verifyOscComment(
      applicationId,
      draftId,
      validated.finalText,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ verified, message: "Ulasan OSC berjaya disahkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pengesahan ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
