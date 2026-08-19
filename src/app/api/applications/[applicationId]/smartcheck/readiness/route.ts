import { NextRequest, NextResponse } from "next/server";
import { getSmartCheckReadiness } from "@/lib/rules/smartCheckService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    getAdminApp();
    await getAuth().verifyIdToken(token);

    const { applicationId } = await params;
    const readiness = await getSmartCheckReadiness(applicationId);

    return NextResponse.json(readiness);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat semakan kelayakan SmartCheck";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
