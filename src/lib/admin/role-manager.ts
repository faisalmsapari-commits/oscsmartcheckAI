import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { UserRole, isValidUserRole } from "@/types/common";
import { FieldValue } from "firebase-admin/firestore";

export interface SetUserRoleParams {
  callerUid: string;
  targetUid: string;
  role: UserRole | string;
  organizationId: string;
}

export interface SetUserRoleResult {
  success: boolean;
  message: string;
  targetUid: string;
  updatedRole?: UserRole;
  organizationId?: string;
}

/**
 * Server-Side Administrative Function: setUserRole
 *
 * Requirements:
 * 1. Validates that caller has SUPER_ADMIN role claim.
 * 2. Validates new role against the UserRole enum.
 * 3. Sets custom claims on Firebase Auth using Firebase Admin SDK.
 * 4. Updates the target user's Firestore profile in users/{uid}.
 * 5. Writes an immutable record to audit_logs collection.
 */
export async function setUserRole({
  callerUid,
  targetUid,
  role,
  organizationId,
}: SetUserRoleParams): Promise<SetUserRoleResult> {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  // 1. Verify caller has SUPER_ADMIN custom claims
  const callerRecord = await adminAuth.getUser(callerUid);
  const callerClaims = callerRecord.customClaims || {};

  if (callerClaims.role !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED: Only SUPER_ADMIN accounts are authorized to manage user roles.");
  }

  // 2. Validate target role
  if (!isValidUserRole(role)) {
    throw new Error(`INVALID_ROLE: Role '${role}' is not a permitted UserRole enum value.`);
  }

  const validRole: UserRole = role;
  const validOrgId = organizationId ? organizationId.trim() : "MPLBP";

  // 3. Set Firebase Auth Custom Claims
  await adminAuth.setCustomUserClaims(targetUid, {
    role: validRole,
    organizationId: validOrgId,
  });

  // 4. Update Firestore Profile in users/{targetUid}
  const userRef = adminDb.collection("users").doc(targetUid);
  const userSnapshot = await userRef.get();
  const previousData = userSnapshot.exists ? userSnapshot.data() : null;

  await userRef.set(
    {
      uid: targetUid,
      role: validRole,
      organizationId: validOrgId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 5. Write Immutable Audit Log
  await adminDb.collection("audit_logs").add({
    action: "SET_USER_ROLE",
    actorUid: callerUid,
    actorEmail: callerRecord.email || "unknown",
    actorRole: "SUPER_ADMIN",
    targetUid,
    targetRole: validRole,
    organizationId: validOrgId,
    previousRole: previousData?.role || null,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      source: "ADMIN_CONSOLE",
      method: "setUserRole()",
    },
  });

  return {
    success: true,
    message: `Successfully assigned role ${validRole} and organization ${validOrgId} to user ${targetUid}.`,
    targetUid,
    updatedRole: validRole,
    organizationId: validOrgId,
  };
}
