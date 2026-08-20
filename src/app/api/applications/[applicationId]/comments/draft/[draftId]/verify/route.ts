import { NextRequest, NextResponse } from "next/server";
import { verifyOscComment } from "@/lib/comments/verificationService";
import { VerifyCommentSchema } from "@/lib/validation/comments.schema";
import { safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoVerifiedCommentsForApp } from "@/lib/seed/demoData";

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
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mengesahkan ulasan OSC." }, { status: 403 });
    }

    const { applicationId, draftId } = await params;
    const body = await req.json();
    const validated = VerifyCommentSchema.parse(body);

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const demoComments = getDemoVerifiedCommentsForApp(applicationId);
      const verified = {
        ...demoComments[0],
        draftId,
        finalText: validated.finalText,
        verifiedBy: decodedToken.uid,
        verifiedAt: new Date().toISOString(),
      };
      return NextResponse.json({ verified, message: "Ulasan OSC berjaya disahkan." });
    }

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
