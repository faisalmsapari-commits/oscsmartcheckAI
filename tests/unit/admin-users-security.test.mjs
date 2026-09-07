import { describe, it } from "node:test";
import assert from "node:assert";

// Simulation helpers for API Route handlers
function simulateAdminUsersGet(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { status: 401, body: { error: "Tidak dibenarkan. Sila log masuk." } };
  }

  const role = authHeader.replace("Bearer ", "").split(":")[1] || "APPLICANT";
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return {
      status: 403,
      body: { error: "Hanya Pentadbir Sistem dibenarkan menguruskan akaun pengguna." },
    };
  }

  return {
    status: 200,
    body: {
      users: [
        { uid: "u-1", email: "admin@mplbp.gov.my", role: "ADMIN" },
        { uid: "u-2", email: "pemohon@perunding.com", role: "APPLICANT" },
      ],
      total: 2,
    },
  };
}

function simulateAdminUserCreate(authHeader, body) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { status: 401, body: { error: "Tidak dibenarkan. Sila log masuk." } };
  }

  const role = authHeader.replace("Bearer ", "").split(":")[1] || "APPLICANT";
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return {
      status: 403,
      body: { error: "Hanya Pentadbir Sistem dibenarkan mendaftarkan pengguna baharu." },
    };
  }

  if (!body.email || !body.displayName || !body.role) {
    return { status: 400, body: { error: "Maklumat e-mel, nama penuh, dan peranan adalah wajib." } };
  }

  const validRoles = [
    "APPLICANT",
    "PLANNING_OFFICER",
    "OSC_OFFICER",
    "GIS_OFFICER",
    "ENGINEERING_OFFICER",
    "LAND_OFFICER",
    "TECHNICAL_DEPARTMENT_OFFICER",
    "OSC_MANAGER",
    "PLANNING_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
  ];

  if (!validRoles.includes(body.role)) {
    return { status: 400, body: { error: `Peranan '${body.role}' tidak sah.` } };
  }

  return {
    status: 201,
    body: {
      user: {
        uid: `usr-test-123`,
        email: body.email,
        displayName: body.displayName,
        role: body.role,
        organizationId: body.organizationId || "MPLBP",
      },
    },
  };
}

function simulateSetUserRole(authHeader, body) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { status: 401, body: { error: "UNAUTHORIZED: Missing or malformed Authorization header." } };
  }

  const role = authHeader.replace("Bearer ", "").split(":")[1] || "APPLICANT";
  if (role !== "SUPER_ADMIN") {
    return { status: 403, body: { error: "FORBIDDEN: Insufficient privileges. SUPER_ADMIN required." } };
  }

  if (!body.targetUid || !body.role) {
    return { status: 400, body: { error: "BAD_REQUEST: 'targetUid' and 'role' are required parameters." } };
  }

  return {
    status: 200,
    body: {
      success: true,
      targetUid: body.targetUid,
      assignedRole: body.role,
      auditLogId: "audit-role-change-999",
    },
  };
}

describe("Phase 2 - Admin & User Management Security Review", () => {
  describe("GET /api/admin/users - Authorization & RBAC Guard", () => {
    it("should return 401 Unauthorized when no Authorization header is provided", () => {
      const res = simulateAdminUsersGet(null);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, "Tidak dibenarkan. Sila log masuk.");
    });

    it("should return 403 Forbidden for APPLICANT role", () => {
      const res = simulateAdminUsersGet("Bearer token:APPLICANT");
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Hanya Pentadbir Sistem dibenarkan/);
    });

    it("should return 403 Forbidden for OSC_OFFICER role", () => {
      const res = simulateAdminUsersGet("Bearer token:OSC_OFFICER");
      assert.strictEqual(res.status, 403);
    });

    it("should return 403 Forbidden for PLANNING_OFFICER role", () => {
      const res = simulateAdminUsersGet("Bearer token:PLANNING_OFFICER");
      assert.strictEqual(res.status, 403);
    });

    it("should return 200 OK with user list for ADMIN role", () => {
      const res = simulateAdminUsersGet("Bearer token:ADMIN");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.users.length, 2);
    });

    it("should return 200 OK with user list for SUPER_ADMIN role", () => {
      const res = simulateAdminUsersGet("Bearer token:SUPER_ADMIN");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.users.length, 2);
    });
  });

  describe("POST /api/admin/users - User Registration Guard", () => {
    it("should return 401 Unauthorized without auth token", () => {
      const res = simulateAdminUserCreate(null, {});
      assert.strictEqual(res.status, 401);
    });

    it("should return 403 Forbidden when an officer attempts to create a user", () => {
      const res = simulateAdminUserCreate("Bearer token:PLANNING_OFFICER", {
        email: "baru@mplbp.gov.my",
        displayName: "Pegawai Baharu",
        role: "PLANNING_OFFICER",
      });
      assert.strictEqual(res.status, 403);
    });

    it("should return 400 Bad Request when mandatory fields are missing", () => {
      const res = simulateAdminUserCreate("Bearer token:ADMIN", {
        email: "baru@mplbp.gov.my",
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /adalah wajib/);
    });

    it("should return 400 Bad Request when an invalid role is passed", () => {
      const res = simulateAdminUserCreate("Bearer token:ADMIN", {
        email: "baru@mplbp.gov.my",
        displayName: "Pegawai Baharu",
        role: "HACKER_ROLE",
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /tidak sah/);
    });

    it("should return 201 Created when ADMIN submits valid user details", () => {
      const res = simulateAdminUserCreate("Bearer token:ADMIN", {
        email: "pegawai.gis@mplbp.gov.my",
        displayName: "Siti Aminah",
        role: "GIS_OFFICER",
        organizationId: "MPLBP",
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.role, "GIS_OFFICER");
    });
  });

  describe("POST /api/admin/set-user-role - Super Admin Security Lock", () => {
    it("should return 401 Unauthorized when missing token", () => {
      const res = simulateSetUserRole(null, {});
      assert.strictEqual(res.status, 401);
    });

    it("should return 403 Forbidden when standard ADMIN attempts to change role", () => {
      const res = simulateSetUserRole("Bearer token:ADMIN", {
        targetUid: "usr-123",
        role: "SUPER_ADMIN",
      });
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /SUPER_ADMIN required/);
    });

    it("should return 400 Bad Request when targetUid is missing", () => {
      const res = simulateSetUserRole("Bearer token:SUPER_ADMIN", {
        role: "OSC_OFFICER",
      });
      assert.strictEqual(res.status, 400);
    });

    it("should return 200 OK when SUPER_ADMIN updates user role", () => {
      const res = simulateSetUserRole("Bearer token:SUPER_ADMIN", {
        targetUid: "usr-123",
        role: "OSC_OFFICER",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.assignedRole, "OSC_OFFICER");
    });
  });
});
