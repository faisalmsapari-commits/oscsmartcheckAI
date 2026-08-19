import { NextRequest, NextResponse } from "next/server";
import { publishRuleSet } from "@/lib/rules/adminRuleService";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ruleSetId: string }> }
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

    if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pentadbir dibenarkan mengaktifkan set peraturan." }, { status: 403 });
    }

    const { ruleSetId } = await params;
    const ruleSet = await publishRuleSet(ruleSetId, decodedToken.uid);

    return NextResponse.json({
      ruleSet,
      message: "Set peraturan perancangan telah diterbitkan (Status: ACTIVE).",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pengaktifan set peraturan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
