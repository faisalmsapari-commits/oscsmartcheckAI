import { NextRequest, NextResponse } from "next/server";
import { createManualDraft } from "@/lib/comments/draftService";
import { safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { getDemoCommentDraftForApp } from "@/lib/seed/demoData";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
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
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mencipta draf ulasan manual." }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const initialText = body.initialText || "## ULASAN PEGAWAI PENILAI OSC\n\nSila masukkan ulasan teknikal di sini.";

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      const baseDraft = getDemoCommentDraftForApp(applicationId);
      const draft = {
        ...baseDraft,
        id: `draft-manual-${Date.now()}`,
        draftId: `draft-manual-${Date.now()}`,
        status: "OFFICER_EDITING" as const,
        officerEditedText: initialText,
        aiGeneratedText: initialText,
      };
      return NextResponse.json({ draft, message: "Draf ulasan manual berjaya didaftarkan." });
    }

    const draft = await createManualDraft(
      applicationId,
      initialText,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ draft, message: "Draf ulasan manual berjaya didaftarkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mencipta draf manual";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
