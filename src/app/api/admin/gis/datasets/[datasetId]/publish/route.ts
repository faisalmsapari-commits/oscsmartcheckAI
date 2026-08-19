import { NextRequest, NextResponse } from "next/server";
import { publishDataset } from "@/lib/gis/adminService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
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

    if (!["GIS_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai GIS/Admin dibenarkan menerbitkan set data." }, { status: 403 });
    }

    const { datasetId } = await params;
    const dataset = await publishDataset(datasetId, decodedToken.uid);

    return NextResponse.json({ dataset, message: "Set data GIS telah diterbitkan (Status: ACTIVE)." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat penerbitan set data GIS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
