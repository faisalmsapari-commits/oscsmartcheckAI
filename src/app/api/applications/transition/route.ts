import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { transitionApplicationStatus } from "@/lib/workflow/transitionService";
import { WorkflowError, WorkflowActorContext } from "@/lib/workflow/types";
import { UserRole, isValidUserRole } from "@/types/common";
import { ApplicationStatus, ALLOWED_APPLICATION_STATUSES } from "@/types/application";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          code: "UNAUTHENTICATED",
          error: "Missing or invalid Authorization header.",
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const tokenRole = decodedToken.role as string | undefined;
    const verifiedRole: UserRole =
      tokenRole && isValidUserRole(tokenRole) ? tokenRole : "APPLICANT";

    const actor: WorkflowActorContext = {
      uid: decodedToken.uid,
      role: verifiedRole,
      email: decodedToken.email || "unknown",
      organizationId: (decodedToken.organizationId as string) || "PUBLIC",
    };

    const body = await req.json();
    const { applicationId, targetStatus, remarks } = body;

    if (!applicationId || !targetStatus) {
      return NextResponse.json(
        {
          code: "VALIDATION_FAILED",
          error: "Missing required parameters: 'applicationId' and 'targetStatus'.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_APPLICATION_STATUSES.includes(targetStatus as ApplicationStatus)) {
      return NextResponse.json(
        {
          code: "INVALID_TRANSITION",
          error: `Target status '${targetStatus}' is not a valid ApplicationStatus enum.`,
        },
        { status: 400 }
      );
    }

    const result = await transitionApplicationStatus({
      applicationId,
      targetStatus: targetStatus as ApplicationStatus,
      remarks,
      actor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof WorkflowError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        code: "SERVER_ERROR",
        error: message,
      },
      { status: 500 }
    );
  }
}
