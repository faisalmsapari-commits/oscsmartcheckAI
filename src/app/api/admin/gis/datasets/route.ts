import { NextRequest, NextResponse } from "next/server";
import { getDatasets, createDataset } from "@/lib/gis/adminService";
import { GisDatasetImportSchema } from "@/lib/validation/gis.schema";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

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

    if (!["GIS_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Akses pentadbiran GIS tidak dibenarkan." }, { status: 403 });
    }

    const datasets = await getDatasets();
    return NextResponse.json({ datasets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan set data GIS";
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

    if (!["GIS_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pegawai GIS/Admin dibenarkan mengimport set data." }, { status: 403 });
    }

    const body = await req.json();
    const validated = GisDatasetImportSchema.parse(body);

    const dataset = await createDataset({
      ...validated,
      importedBy: decodedToken.uid,
    });

    return NextResponse.json({ dataset, message: "Set data GIS berjaya didaftarkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pendaftaran set data GIS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
