/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { startRecheckWorkflow } from "@/lib/workflow/recheckService";
import type { UserRole } from "@/types/common";

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await context.params;
    const result = await startRecheckWorkflow(applicationId, decoded.uid, role);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Recheck failed" }, { status: 400 });
  }
}
