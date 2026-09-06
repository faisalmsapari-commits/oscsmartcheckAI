import { NextRequest, NextResponse } from "next/server";
import { safeVerifyIdToken, isCloudFirestoreConfigured, getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { getDemoSystemUsers, DemoSystemUser } from "@/lib/seed/demoData";
import { isValidUserRole, UserRole } from "@/types/common";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const callerRole = (decodedToken.role as string) || "APPLICANT";

    if (!["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
      return NextResponse.json(
        { error: "Hanya Pentadbir Sistem dibenarkan menguruskan akaun pengguna." },
        { status: 403 }
      );
    }

    // Dev / Presentation fallback
    if (!isCloudFirestoreConfigured()) {
      const users = getDemoSystemUsers();
      return NextResponse.json({ users, total: users.length });
    }

    // Live Firestore query
    const db = getAdminDb();
    const snapshot = await db.collection("users").get();

    if (snapshot.empty) {
      const users = getDemoSystemUsers();
      return NextResponse.json({ users, total: users.length });
    }

    const users: DemoSystemUser[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || data.name || "Pengguna Sistem",
        role: (data.role as UserRole) || "APPLICANT",
        organizationId: data.organizationId || "MPLBP",
        department: data.department || "Jabatan MPLBP",
        designation: data.designation || "Pegawai",
        active: data.active !== false,
        lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({ users, total: users.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan senarai pengguna";
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
    const decodedToken = await safeVerifyIdToken(token);
    const callerRole = (decodedToken.role as string) || "APPLICANT";

    if (!["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
      return NextResponse.json(
        { error: "Hanya Pentadbir Sistem dibenarkan mendaftarkan pengguna baharu." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, displayName, role, department, designation, organizationId } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json(
        { error: "Maklumat e-mel, nama penuh, dan peranan adalah wajib." },
        { status: 400 }
      );
    }

    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: `Peranan '${role}' tidak sah.` },
        { status: 400 }
      );
    }

    const targetRole: UserRole = role;
    const orgId = organizationId ? organizationId.trim() : "MPLBP";
    const newUid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newUserRecord: DemoSystemUser = {
      uid: newUid,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      role: targetRole,
      organizationId: orgId,
      department: department?.trim() || "Jabatan MPLBP",
      designation: designation?.trim() || "Pegawai",
      active: true,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (isCloudFirestoreConfigured()) {
      const db = getAdminDb();
      const auth = getAdminAuth();

      // Create in Firestore
      await db.collection("users").doc(newUid).set({
        ...newUserRecord,
        updatedAt: new Date().toISOString(),
      });

      // Try setting custom claims if auth user exists
      try {
        const userByEmail = await auth.getUserByEmail(newUserRecord.email);
        if (userByEmail) {
          await auth.setCustomUserClaims(userByEmail.uid, {
            role: targetRole,
            organizationId: orgId,
          });
        }
      } catch {
        // Safe bypass if auth record doesn't exist yet
      }

      // Record Audit Trail
      await db.collection("audit_logs").add({
        action: "CREATE_USER",
        actorUid: decodedToken.uid,
        targetUid: newUid,
        targetEmail: newUserRecord.email,
        targetRole: targetRole,
        timestamp: new Date().toISOString(),
        metadata: { source: "ADMIN_USERS_CONSOLE" },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berjaya mendaftarkan pengguna baharu '${displayName}' dengan peranan '${targetRole}'.`,
      user: newUserRecord,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat mendaftarkan pengguna baharu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
