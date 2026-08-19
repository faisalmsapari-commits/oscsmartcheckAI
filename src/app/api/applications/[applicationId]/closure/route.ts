/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  getCaseClosureReadiness,
  completeApplicationCase,
  reopenApplicationCase,
} from "@/lib/workflow/closureService";
import { CaseCompletionRequestSchema, ReopenCaseRequestSchema } from "@/lib/validation/workflow.schema";
import type { UserRole } from "@/types/common";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    await getAdminAuth().verifyIdToken(token);

    const { applicationId } = await context.params;
    const readiness = await getCaseClosureReadiness(applicationId);

    return NextResponse.json({ success: true, readiness });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check closure readiness" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Only authorized officers can complete cases" }, { status: 403 });
    }

    const { applicationId } = await context.params;
    const body = await req.json();

    if (body.action === "REOPEN") {
      const parsed = ReopenCaseRequestSchema.parse(body);
      const cycle = await reopenApplicationCase(applicationId, parsed.reason, decoded.uid, role);
      return NextResponse.json({ success: true, cycle });
    } else {
      const parsed = CaseCompletionRequestSchema.parse(body);
      const result = await completeApplicationCase(
        applicationId,
        decoded.uid,
        role,
        parsed.remarks
      );
      return NextResponse.json({ success: true, ...result });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Case completion failed" }, { status: 400 });
  }
}
