import { NextRequest, NextResponse } from "next/server";
import { revokeVerifiedComment } from "@/lib/comments/verificationService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

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
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan membatalkan ulasan." }, { status: 403 });
    }

    const { applicationId, commentId } = await params;
    const body = await req.json();
    const reason = body.reason || "Dibatalkan atas arahan mesyuarat teknikal.";

    await revokeVerifiedComment(
      applicationId,
      commentId,
      reason,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ message: "Ulasan berjaya dibatalkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat membatalkan ulasan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
