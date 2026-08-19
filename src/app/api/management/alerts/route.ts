import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";
import { ManagementAlert } from "@/types/analytics";

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
    const snap = await db.collection("managementAlerts").orderBy("createdAt", "desc").limit(50).get();
    const alerts = snap.docs.map((d) => d.data() as ManagementAlert);

    return NextResponse.json({ alerts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan amaran pengurusan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
