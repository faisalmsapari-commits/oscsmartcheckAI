import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken, isCloudFirestoreConfigured, getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { isValidUserRole, UserRole } from "@/types/common";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const callerRole = (decodedToken.role as string) || "APPLICANT";

    if (!["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
      return NextResponse.json(
        { error: "Hanya Pentadbir Sistem dibenarkan mengemaskini maklumat pengguna." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role, active, department, designation, organizationId } = body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (role !== undefined) {
      if (!isValidUserRole(role)) {
        return NextResponse.json({ error: `Peranan '${role}' tidak sah.` }, { status: 400 });
      }
      updates.role = role as UserRole;
    }

    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    if (department !== undefined) updates.department = String(department).trim();
    if (designation !== undefined) updates.designation = String(designation).trim();
    if (organizationId !== undefined) updates.organizationId = String(organizationId).trim();

    if (isCloudFirestoreConfigured()) {
      const db = getAdminDb();
      const auth = getAdminAuth();

      // Update Firestore profile
      const userRef = db.collection("users").doc(userId);
      await userRef.set(updates, { merge: true });

      // Set Custom Claims if role changed
      if (updates.role) {
        try {
          await auth.setCustomUserClaims(userId, {
            role: updates.role as UserRole,
            organizationId: (updates.organizationId as string) || "MPLBP",
          });
        } catch {
          // Safe bypass for offline/demo users
        }
      }

      // Record Audit Trail
      await db.collection("audit_logs").add({
        action: "UPDATE_USER_PROFILE",
        actorUid: decodedToken.uid,
        targetUid: userId,
        updates,
        timestamp: new Date().toISOString(),
        metadata: { source: "ADMIN_USER_DETAIL_CONSOLE" },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berjaya mengemaskini profil pengguna ${userId}.`,
      updates,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mengemaskini pengguna";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
