import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { setUserRole } from "@/lib/admin/role-manager";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Missing or malformed Authorization header." },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN: Insufficient privileges. SUPER_ADMIN required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUid, role, organizationId } = body;

    if (!targetUid || !role) {
      return NextResponse.json(
        { error: "BAD_REQUEST: 'targetUid' and 'role' are required parameters." },
        { status: 400 }
      );
    }

    const result = await setUserRole({
      callerUid: decodedToken.uid,
      targetUid,
      role,
      organizationId: organizationId || "MPLBP",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message.startsWith("UNAUTHORIZED")
      ? 403
      : message.startsWith("INVALID_ROLE")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
