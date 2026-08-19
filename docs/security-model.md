# OSC SmartCheck AI — Security & Access Control Model

**Project:** OSC SmartCheck AI  
**Organization:** One Stop Centre (OSC), Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)

---

## 1. Security Architecture Principles

OSC SmartCheck AI handles sensitive architectural drawings, property titles, zoning classifications, and official regulatory assessments. The security model is architected upon the following core tenets:

1. **Zero Client-Side Trust:** Browser clients cannot perform privileged writes or compute authoritative compliance states.
2. **Cryptographic Token Claims for Authorization:** Authorization decisions are derived strictly from cryptographically signed Firebase Custom Claims (`token.role` and `token.organizationId`).
3. **No Email String Matching:** No authorization decision shall ever rely on user email patterns (e.g. `email == "admin@..."` or `email.endsWith("@mplbp.gov.my")`).
4. **Server-Side Role Elevation:** Only `SUPER_ADMIN` accounts executing within trusted server runtimes (using the Firebase Admin SDK) can assign or modify user roles and custom claims.
5. **Anti-Privilege Escalation:** Database security rules prevent normal users from modifying their own `role`, `organizationId`, or `active` status, or setting their applications to `VERIFIED` / `COMPLETED`.
6. **Immutable Final Records:** Verified officer reviews, version checkpoints, status histories, and audit logs are append-only / locked from modification or deletion.

---

## 2. Authentication Model

The MVP implements **Firebase Authentication (Email + Password)**. The architecture abstracts authentication into `AuthContext` and standard token verification layers, enabling future integration of:
- Google Workspace Single Sign-On (SSO) for MPLBP official personnel.
- MyDigital ID / Government Federation identities.

---

## 3. Authorization Model & User Roles

### Canonical User Roles
```typescript
export type UserRole =
  | "APPLICANT"
  | "OSC_OFFICER"
  | "PLANNING_OFFICER"
  | "GIS_OFFICER"
  | "ADMIN"
  | "SUPER_ADMIN";
```

### Roles and Route Access Matrix

| Role | Role Description | Route Access | Permissions |
|---|---|---|---|
| `APPLICANT` | Principal Submitting Person (PSP) / Architect | `/dashboard`, `/applications`, `/applications/new` | Create draft submissions, upload drawings, view own application status. Cannot access officer or admin routes. |
| `OSC_OFFICER` | Technical Officer at One Stop Centre MPLBP | `/dashboard`, `/officer` | View lodged applications, execute compliance checks, review AI extractions, write official comments. |
| `PLANNING_OFFICER`| Town Planning Officer | `/dashboard`, `/officer` | Review land use, zoning, density, and setback compliance findings. |
| `GIS_OFFICER` | Geospatial / GIS Specialist | `/dashboard`, `/officer` | Inspect spatial overlays, KSAS boundaries, and cadastral lot alignments. |
| `ADMIN` | MPLBP System Administrator | `/dashboard`, `/admin` | Configure planning parameters, guidelines, and monitor system health. Cannot elevate roles. |
| `SUPER_ADMIN` | Chief Security & System Administrator | All routes (`/dashboard`, `/applications`, `/officer`, `/admin`) | Full administrative capability, execute `setUserRole()`, manage security policies. |

---

## 4. Collection Security Policy Matrix (Firestore Rules)

| Collection / Path | Allowed Read | Allowed Create | Allowed Update | Allowed Delete |
|---|---|---|---|---|
| `users/{uid}` | Owner, Officer, Admin | Owner (`APPLICANT` default) | Owner (safe profile fields only) or `SUPER_ADMIN` | Denied |
| `organizations/{orgId}` | Authenticated | Admin | Admin | Denied |
| `applications/{appId}` | Owner, Officer, Admin | Owner (`DRAFT` defaults, no officer assigned) | Owner (if `DRAFT`/`REQUEST_INFO`, no status jump) or Officer/Admin | Denied |
| `applications/{appId}/versions/{id}` | Owner, Officer, Admin | Owner, Officer, Admin | Denied (Immutable) | Denied |
| `applications/{appId}/documents/{id}` | Owner, Officer, Admin | Owner, Officer, Admin | Officer, Admin (status only) | Denied |
| `applications/{appId}/extractedFacts/{id}` | Owner, Officer, Admin | Officer, Admin | Officer, Admin | Denied |
| `applications/{appId}/smartChecks/{id}` | Owner, Officer, Admin | Officer, Admin | Officer, Admin | Denied |
| `applications/{appId}/officerReviews/{id}` | Owner, Officer, Admin | Officer, Admin | Officer, Admin (until `VERIFIED`) | Denied |
| `applications/{appId}/statusHistory/{id}` | Owner, Officer, Admin | Authenticated | Denied (Append-Only) | Denied |
| `guidelines/{id}` | Authenticated | Admin | Admin | Denied |
| `ruleSets/{id}` | Authenticated | Admin | Admin | Denied |
| `systemConfig/{id}` | Authenticated | `SUPER_ADMIN` | `SUPER_ADMIN` | Denied |
| `aiRuns/{id}` | Officer, Admin | Denied (Server only) | Denied (Server only) | Denied |
| `auditLogs/{id}` | Admin, `OSC_OFFICER` | Denied (Server only) | Denied (Server only) | Denied |

---

## 5. Server-Side Role Management (`setUserRole`)

Role changes must be processed through the trusted server function:

```typescript
setUserRole({
  callerUid: string,
  targetUid: string,
  role: UserRole,
  organizationId: string
})
```

Execution Protocol:
1. Validates that the caller's verified token contains `role === 'SUPER_ADMIN'`.
2. Validates that the requested role is a member of `ALLOWED_USER_ROLES`.
3. Injects custom claims onto the target user in Firebase Auth.
4. Updates the target user's document in Firestore (`users/{targetUid}`).
5. Writes an immutable audit record to `auditLogs` containing `actorUid`, `targetUid`, `previousRole`, `targetRole`, and timestamp.
