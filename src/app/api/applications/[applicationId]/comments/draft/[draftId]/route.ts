import { NextRequest, NextResponse } from "next/server";
import { saveOfficerDraftEdit } from "@/lib/comments/draftService";
import { SaveOfficerDraftEditSchema } from "@/lib/validation/comments.schema";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentDraftForApp } from "@/lib/seed/demoData";

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
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    if (userRole === "APPLICANT") {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    const { applicationId, draftId } = await params;

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const draft = getDemoCommentDraftForApp(applicationId);
      return NextResponse.json({ draft });
    }

    const db = getAdminDb();
    const snap = await db.collection(`applications/${applicationId}/commentDrafts`).doc(draftId).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Draf tidak dijumpai." }, { status: 404 });
    }

    return NextResponse.json({ draft: snap.data() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan draf";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mengemas kini draf ulasan." }, { status: 403 });
    }

    const { applicationId, draftId } = await params;
    const body = await req.json();
    const validated = SaveOfficerDraftEditSchema.parse(body);

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      return NextResponse.json({
        message: "Draf ulasan berjaya disimpan.",
        revisionNumber: (validated.expectedRevisionNumber || 0) + 1,
      });
    }

    const result = await saveOfficerDraftEdit(
      applicationId,
      draftId,
      validated.officerEditedText,
      decodedToken.uid,
      userRole,
      validated.expectedRevisionNumber
    );

    return NextResponse.json({ message: "Draf ulasan berjaya disimpan.", ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menyimpan draf";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
