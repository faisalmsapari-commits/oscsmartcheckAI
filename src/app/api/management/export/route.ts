/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { exportManagementData } from "@/lib/analytics/managementService";
import { ExportManagementDataRequestSchema } from "@/lib/validation/analytics.schema";
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

    if (!MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pengurus dan Pegawai dibenarkan mengeksport data pengurusan." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const validated = ExportManagementDataRequestSchema.parse(body);

    const result = await exportManagementData(
      validated.datasetType,
      validated.format,
      (validated.filter || {}) as any,
      decodedToken.uid,
      userRole
    );

    return new NextResponse(result.content, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mengeksport data pengurusan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
