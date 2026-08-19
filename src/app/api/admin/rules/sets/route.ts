import { NextRequest, NextResponse } from "next/server";
import { getRuleSets, createRuleSet } from "@/lib/rules/adminRuleService";
import { PlanningRuleSetSchema } from "@/lib/validation/rules.schema";
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

    if (!["PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Akses pentadbiran peraturan tidak dibenarkan." }, { status: 403 });
    }

    const ruleSets = await getRuleSets();
    return NextResponse.json({ ruleSets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan set peraturan";
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

    if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Hanya Pentadbir dibenarkan mendaftar set peraturan." }, { status: 403 });
    }

    const body = await req.json();
    const validated = PlanningRuleSetSchema.parse(body);

    const ruleSet = await createRuleSet({
      ...validated,
      createdBy: decodedToken.uid,
    });

    return NextResponse.json({ ruleSet, message: "Set peraturan perancangan berjaya didaftarkan." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat pendaftaran set peraturan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
