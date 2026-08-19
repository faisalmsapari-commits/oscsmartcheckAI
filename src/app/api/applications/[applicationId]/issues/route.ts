import { NextRequest, NextResponse } from "next/server";
import { getApplicationIssues, createOfficerIssue } from "@/lib/issues/issueService";
import { CreateIssueSchema } from "@/lib/validation/issues.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import { getDemoIssuesForApp } from "@/lib/seed/demoDataSeeder";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    const { applicationId } = await params;
    
    // Instant return for demo applications (<10ms)
    if (applicationId.startsWith("app-demo-")) {
      const demoIssues = getDemoIssuesForApp(applicationId);
      return NextResponse.json({ issues: demoIssues });
    }

    try {
      const issues = await getApplicationIssues(applicationId, userRole);
      if (issues && issues.length > 0) {
        return NextResponse.json({ issues });
      }
    } catch {
      // Fallback
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan isu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai dibenarkan mencipta isu manual." }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await req.json();
    const validated = CreateIssueSchema.parse(body);

    const issue = await createOfficerIssue(
      applicationId,
      {
        ...validated,
        smartCheckId: "manual",
        status: "OPEN",
        source: "OFFICER_CREATED",
        assignedTo: validated.assignedTo || null,
        assignedRole: validated.assignedRole || null,
      },
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ issue, message: "Isu berjaya didaftarkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mencipta isu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
