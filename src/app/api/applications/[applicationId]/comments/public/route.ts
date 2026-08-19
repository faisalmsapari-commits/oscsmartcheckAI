import { NextRequest, NextResponse } from "next/server";
import { getPublishedComments } from "@/lib/comments/verificationService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

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
    getAdminApp();
    await getAuth().verifyIdToken(token);

    const { applicationId } = await params;
    const comments = await getPublishedComments(applicationId);

    return NextResponse.json({ comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan ulasan awam";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
