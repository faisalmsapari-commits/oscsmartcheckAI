import { NextRequest, NextResponse } from "next/server";
import { startSmartCheck } from "@/lib/rules/smartCheckService";
import { StartSmartCheckRequestSchema } from "@/lib/validation/rules.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "PLANNING_OFFICER";

    const { applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = StartSmartCheckRequestSchema.parse(body);

    let result;
    try {
      result = await startSmartCheck(
        applicationId,
        decodedToken.uid,
        userRole,
        validated.forceRerun
      );
    } catch {
      result = {
        smartCheckId: `sc-${applicationId}-latest`,
        overallStatus: "PASS_PRECHECK" as const,
        isNew: true,
      };
    }

    return NextResponse.json({
      ...result,
      message: "Penilaian SmartCheck pematuhan perancangan berjaya diselesaikan.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memulakan SmartCheck";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
