/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import {
  issueInformationRequest,
  extendRfiDeadline,
  markRfiViewedByApplicant,
} from "@/lib/workflow/rfiService";
import { ExtendRfiDeadlineSchema } from "@/lib/validation/workflow.schema";
import type { UserRole } from "@/types/common";

export async function GET(
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
    const role = (decoded.role || "APPLICANT") as UserRole;

    const { applicationId, requestId } = await context.params;
    const db = getAdminDb();
    const doc = await db.collection(`applications/${applicationId}/requests`).doc(requestId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = doc.data();

    // If applicant opens it, mark viewed
    if (role === "APPLICANT") {
      if (data?.visibility !== "APPLICANT_VISIBLE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await markRfiViewedByApplicant(applicationId, requestId, decoded.uid);
    }

    // Fetch responses for this request
    const respSnap = await db
      .collection(`applications/${applicationId}/requests/${requestId}/responses`)
      .orderBy("createdAt", "desc")
      .get();
    const responses = respSnap.docs.map((d) => d.data());

    return NextResponse.json({ success: true, request: data, responses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch request" }, { status: 500 });
  }
}

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
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId, requestId } = await context.params;
    const body = await req.json();
    const action = body.action;

    if (action === "ISSUE") {
      const rfi = await issueInformationRequest(applicationId, requestId, decoded.uid, role);
      return NextResponse.json({ success: true, request: rfi });
    } else if (action === "EXTEND_DEADLINE") {
      const parsed = ExtendRfiDeadlineSchema.parse(body);
      await extendRfiDeadline(applicationId, requestId, parsed.newDeadline, parsed.reason, decoded.uid, role);
      return NextResponse.json({ success: true, message: "Deadline extended" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 400 });
  }
}
