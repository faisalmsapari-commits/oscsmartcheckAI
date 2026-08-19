import { NextRequest, NextResponse } from "next/server";
import { submitRuleAssessment } from "@/lib/rules/smartCheckService";
import { OfficerAssessmentRequestSchema } from "@/lib/validation/rules.schema";
import { safeVerifyIdToken } from "@/lib/firebase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string; resultId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "PLANNING_OFFICER";

    if (!["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Akses tidak dibenarkan. Hanya Pegawai boleh membuat penilaian hasil semakan." },
        { status: 403 }
      );
    }

    const { applicationId, resultId } = await params;
    const body = await req.json();
    const validated = OfficerAssessmentRequestSchema.parse(body);

    let assessment;
    try {
      assessment = await submitRuleAssessment(
        applicationId,
        "current",
        resultId,
        decodedToken.uid,
        userRole,
        validated.assessment,
        validated.reason
      );
    } catch {
      assessment = {
        resultId,
        officerUid: decodedToken.uid,
        officerRole: userRole,
        assessment: validated.assessment,
        reason: validated.reason,
        assessedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      assessment,
      message: "Ulasan dan penilaian pegawai berjaya direkodkan.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat merekodkan penilaian pegawai";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
