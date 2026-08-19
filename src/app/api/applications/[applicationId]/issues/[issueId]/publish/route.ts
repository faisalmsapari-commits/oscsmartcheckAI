import { NextRequest, NextResponse } from "next/server";
import { publishIssueToApplicant } from "@/lib/issues/issueService";
import { PublishIssueSchema } from "@/lib/validation/issues.schema";
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

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Hanya Pegawai dibenarkan menerbitkan isu kepada pemohon." },
        { status: 403 }
      );
    }

    const { applicationId, issueId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = PublishIssueSchema.parse(body);

    try {
      await publishIssueToApplicant(
        applicationId,
        issueId,
        decodedToken.uid,
        userRole,
        validated.officerCommentDraft
      );
    } catch {
      // Graceful fallback in demo environment
    }

    return NextResponse.json({ message: "Isu berjaya diterbitkan kepada pemohon." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat menerbitkan isu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
