/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken } from "@/lib/firebase/admin";
import {
  getManagementEscalations,
  acknowledgeEscalation,
  resolveEscalation,
} from "@/lib/workflow/escalationService";
import type { UserRole } from "@/types/common";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Management access only" }, { status: 403 });
    }

    const escalations = await getManagementEscalations();
    return NextResponse.json({ success: true, escalations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch escalations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);
    const role = (decoded.role || "APPLICANT") as UserRole;

    if (!["OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { escalationId, action } = body;

    if (action === "ACKNOWLEDGE") {
      await acknowledgeEscalation(escalationId, decoded.uid);
      return NextResponse.json({ success: true, message: "Escalation acknowledged" });
    } else if (action === "RESOLVE") {
      await resolveEscalation(escalationId, decoded.uid);
      return NextResponse.json({ success: true, message: "Escalation resolved" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update escalation" }, { status: 400 });
  }
}
