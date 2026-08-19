/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getApplicantRequests, createInformationRequest } from "@/lib/workflow/rfiService";
import { CreateRfiSchema } from "@/lib/validation/workflow.schema";
import { getAdminAuth } from "@/lib/firebase/admin";
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
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    const { applicationId } = await context.params;
    const requests = await getApplicantRequests(applicationId, role);
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch requests" }, { status: 500 });
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
      return NextResponse.json({ error: "Forbidden: Only officers can create RFI" }, { status: 403 });
    }

    const { applicationId } = await context.params;
    const body = await req.json();
    const parsed = CreateRfiSchema.parse(body);

    const rfi = await createInformationRequest({
      applicationId,
      requestType: parsed.requestType,
      title: parsed.title,
      description: parsed.description,
      relatedIssueIds: parsed.relatedIssueIds,
      relatedResultIds: parsed.relatedResultIds,
      requiredDocumentTypes: parsed.requiredDocumentTypes,
      requestedFields: parsed.requestedFields,
      responseDeadline: parsed.responseDeadline,
      visibility: parsed.visibility,
      actorUid: decoded.uid,
      actorRole: role,
    });

    return NextResponse.json({ success: true, request: rfi });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create RFI" }, { status: 400 });
  }
}
