/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { createOrUpdateManagementTarget } from "@/lib/analytics/managementService";
import { ManagementTargetSchema } from "@/lib/validation/analytics.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";
import { ManagementTarget } from "@/types/analytics";

const MANAGEMENT_ROLES = [
  "OSC_MANAGER",
  "PLANNING_MANAGER",
  "OSC_OFFICER",
  "PLANNING_OFFICER",
  "ADMIN",
  "SUPER_ADMIN",
];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Akses tidak dibenarkan." }, { status: 403 });
    }

    const db = getAdminDb();
    const snap = await db.collection("managementTargets").get();
    const targets = snap.docs.map((d) => d.data() as ManagementTarget);

    return NextResponse.json({ targets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan sasaran prestasi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRole = (decodedToken.role as string) || "APPLICANT";

    if (!["OSC_MANAGER", "PLANNING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pengurus atau Pentadbir dibenarkan mengkonfigurasi sasaran prestasi." }, { status: 403 });
    }

    const body = await req.json();
    const validated = ManagementTargetSchema.parse(body);

    await createOrUpdateManagementTarget(
      validated as any,
      decodedToken.uid,
      userRole
    );

    return NextResponse.json({ message: "Sasaran KPI pengurusan berjaya dikemaskini." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mengemaskini sasaran prestasi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
