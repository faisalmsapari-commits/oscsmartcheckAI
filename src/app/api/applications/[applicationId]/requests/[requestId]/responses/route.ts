/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { submitApplicantResponse } from "@/lib/workflow/responseService";
import { SubmitApplicantResponseSchema } from "@/lib/validation/workflow.schema";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string; requestId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);

    const { applicationId, requestId } = await context.params;
    const body = await req.json();
    const parsed = SubmitApplicantResponseSchema.parse(body);

    const response = await submitApplicantResponse({
      applicationId,
      requestId,
      responseText: parsed.responseText,
      relatedDocumentIds: parsed.relatedDocumentIds,
      applicantUid: decoded.uid,
    });

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit response" }, { status: 400 });
  }
}
