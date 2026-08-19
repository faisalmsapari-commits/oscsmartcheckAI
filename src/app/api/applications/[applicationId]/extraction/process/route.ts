import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { startLcpProcessing } from "@/lib/extraction/extractionService";

interface RouteParams {
  params: Promise<{
    applicationId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = (decoded.role as string) || "APPLICANT";
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({}));
    const forceReprocess = !!body.forceReprocess;

    const result = await startLcpProcessing(applicationId, uid, role, forceReprocess);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat memulakan pemprosesan LCP";
    return NextResponse.json({ code: "PROCESSING_TRIGGER_FAILED", error: msg }, { status: 400 });
  }
}
