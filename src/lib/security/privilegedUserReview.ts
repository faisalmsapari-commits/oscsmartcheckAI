/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { UserRole } from "../../types/common.ts";

export interface PrivilegedUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

/**
 * Reviews all privileged administrative and officer accounts
 */
export async function reviewPrivilegedUsers(
  customDb?: Firestore
): Promise<{
  totalPrivilegedUsers: number;
  usersByRole: Record<string, number>;
  users: PrivilegedUserRecord[];
}> {
  const db = customDb || getAdminDb();
  const privilegedRoles: UserRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "OSC_MANAGER",
    "PLANNING_MANAGER",
    "OSC_OFFICER",
    "PLANNING_OFFICER",
    "GIS_OFFICER",
  ];

  const snap = await db
    .collection("users")
    .where("role", "in", privilegedRoles)
    .get();

  const users: PrivilegedUserRecord[] = [];
  const usersByRole: Record<string, number> = {};

  privilegedRoles.forEach((r) => {
    usersByRole[r] = 0;
  });

  snap.docs.forEach((doc) => {
    const data = doc.data() as any;
    const role = data.role as UserRole;
    usersByRole[role] = (usersByRole[role] || 0) + 1;

    users.push({
      uid: doc.id,
      email: data.email || "",
      displayName: data.displayName || "",
      role,
      organizationId: data.organizationId || "MPLBP",
      active: data.active !== false,
      lastLoginAt: data.lastLoginAt || null,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  });

  return {
    totalPrivilegedUsers: users.length,
    usersByRole,
    users,
  };
}
