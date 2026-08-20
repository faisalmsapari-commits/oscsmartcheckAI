import { NextRequest, NextResponse } from "next/server";
import { getCommentDraftReadiness } from "@/lib/comments/draftService";
import { safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentReadiness } from "@/lib/seed/demoData";

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
    await safeVerifyIdToken(token);

    const { applicationId } = await params;

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      return NextResponse.json(getDemoCommentReadiness());
    }

    const readiness = await getCommentDraftReadiness(applicationId);
    return NextResponse.json(readiness);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyemak kesediaan draf";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
