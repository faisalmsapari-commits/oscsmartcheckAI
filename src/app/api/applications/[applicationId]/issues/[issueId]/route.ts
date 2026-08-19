import { NextRequest, NextResponse } from "next/server";
import { updateIssueStatus, assignIssue } from "@/lib/issues/issueService";
import { UpdateIssueStatusSchema, AssignIssueSchema } from "@/lib/validation/issues.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; issueId: string }> }
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

    const { applicationId, issueId } = await params;
    const db = getAdminDb();
    const snap = await db.collection(`applications/${applicationId}/issues`).doc(issueId).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Isu tidak dijumpai." }, { status: 404 });
    }

    const issue = snap.data();
    if (userRole === "APPLICANT" && issue?.visibility !== "APPLICANT_VISIBLE") {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    const notesSnap = await db.collection(`applications/${applicationId}/issues/${issueId}/notes`).get();
    let notes = notesSnap.docs.map((d) => d.data());
    if (userRole === "APPLICANT") {
      notes = notes.filter((n) => n.noteType === "APPLICANT_VISIBLE");
    }

    return NextResponse.json({ issue, notes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan isu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; issueId: string }> }
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
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mengemas kini isu." }, { status: 403 });
    }

    const { applicationId, issueId } = await params;
    const body = await req.json();

    if (body.status) {
      const validated = UpdateIssueStatusSchema.parse(body);
      await updateIssueStatus(
        applicationId,
        issueId,
        validated.status,
        decodedToken.uid,
        userRole,
        validated.reason
      );
    }

    if (body.assignedTo && body.assignedRole) {
      const validated = AssignIssueSchema.parse(body);
      await assignIssue(
        applicationId,
        issueId,
        validated.assignedTo,
        validated.assignedRole,
        decodedToken.uid
      );
    }

    return NextResponse.json({ message: "Isu berjaya dikemas kini." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mengemas kini isu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
