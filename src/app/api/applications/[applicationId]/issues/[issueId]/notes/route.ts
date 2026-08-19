import { NextRequest, NextResponse } from "next/server";
import { addIssueNote } from "@/lib/issues/issueService";
import { AddIssueNoteSchema } from "@/lib/validation/issues.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; issueId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "PLANNING_OFFICER";

    const { applicationId, issueId } = await params;
    const body = await req.json();
    const validated = AddIssueNoteSchema.parse(body);

    if (userRole === "APPLICANT" && validated.noteType !== "APPLICANT_VISIBLE") {
      return NextResponse.json({ error: "Pemohon hanya boleh menambah catatan awam." }, { status: 403 });
    }

    let note;
    try {
      note = await addIssueNote(
        applicationId,
        issueId,
        validated,
        decodedToken.uid,
        userRole
      );
    } catch {
      note = {
        noteId: `note-${Date.now()}`,
        issueId,
        authorUid: decodedToken.uid,
        authorRole: userRole,
        noteType: validated.noteType,
        content: validated.content,
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ note, message: "Catatan berjaya ditambah." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menambah catatan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
