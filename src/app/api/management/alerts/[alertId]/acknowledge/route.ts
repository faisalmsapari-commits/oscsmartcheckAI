import { NextRequest, NextResponse } from "next/server";
import { acknowledgeManagementAlert } from "@/lib/analytics/managementService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

const MANAGEMENT_ROLES = [
  "OSC_MANAGER",
  "PLANNING_MANAGER",
  "OSC_OFFICER",
  "PLANNING_OFFICER",
  "ADMIN",
  "SUPER_ADMIN",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
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
      return NextResponse.json({ error: "Hanya Pegawai/Pengurus dibenarkan mengakui amaran." }, { status: 403 });
    }

    const { alertId } = await params;
    await acknowledgeManagementAlert(alertId, decodedToken.uid);

    return NextResponse.json({ message: "Amaran pengurusan telah disahkan diambil maklum." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mengesahkan amaran";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
