import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { ProcessingJob } from "@/types/extraction";

interface RouteParams {
  params: Promise<{
    applicationId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await getAdminAuth().verifyIdToken(token);

    if (applicationId.startsWith("app-demo-") || !isCloudFirestoreConfigured()) {
      return NextResponse.json({ job: null }, { status: 200 });
    }

    const db = getAdminDb();
    const jobSnap = await db
      .collection(`applications/${applicationId}/processingJobs`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (jobSnap.empty) {
      return NextResponse.json({ job: null }, { status: 200 });
    }

    const job = { id: jobSnap.docs[0].id, ...jobSnap.docs[0].data() } as ProcessingJob;
    return NextResponse.json({ job }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat menyemak status pemprosesan";
    return NextResponse.json({ code: "STATUS_CHECK_FAILED", error: msg }, { status: 500 });
  }
}
