import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
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
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (userRole === "APPLICANT") {
      return NextResponse.json({ error: "Pemohon tidak dibenarkan melihat draf dalaman." }, { status: 403 });
    }

    const { applicationId } = await params;
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
