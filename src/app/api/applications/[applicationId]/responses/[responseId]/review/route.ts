/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { reviewApplicantResponse } from "@/lib/workflow/responseService";
import { ReviewApplicantResponseSchema } from "@/lib/validation/workflow.schema";
import type { UserRole } from "@/types/common";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string; responseId: string }> }
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId, responseId } = await context.params;
    const body = await req.json();
    const requestId = body.requestId;
    const parsed = ReviewApplicantResponseSchema.parse(body);

    const result = await reviewApplicantResponse(
      applicationId,
      requestId,
      responseId,
      parsed.action,
      parsed.reviewComment,
      decoded.uid,
      role
    );

    return NextResponse.json({ success: true, response: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Review failed" }, { status: 400 });
  }
}
