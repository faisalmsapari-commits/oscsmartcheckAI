/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken } from "@/lib/firebase/admin";
import { getGoLiveReadiness } from "@/lib/golive/goLiveService";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await safeVerifyIdToken(token);
    const db = getAdminDb();
    const role = (decoded.role as string) || "OSC_MANAGER";

    if (!["ADMIN", "SUPER_ADMIN", "OSC_MANAGER", "PLANNING_MANAGER", "PLANNING_OFFICER", "OSC_OFFICER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Go-live checklist access is restricted" }, { status: 403 });
    }

    const readiness = await getGoLiveReadiness(db);
    return NextResponse.json(readiness);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load go-live readiness" }, { status: 500 });
  }
}
