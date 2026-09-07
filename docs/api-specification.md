# OSC SmartCheck AI — API Specification (v1.0.0)

This document provides the technical specification for all REST API endpoints exposed by the **OSC SmartCheck AI** portal, categorized by endpoint groups: **Applications**, **GIS & Geospatial**, **Management Analytics**, and **System Administration**.

---

## 1. Authentication & Common Headers

Unless explicitly marked as `Public`, all API endpoints require a valid Firebase Auth ID Token in the HTTP Authorization header:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

### 1.1 Error Response Format
All error responses adhere to standard HTTP status codes and return a JSON error object:

```json
{
  "error": "Penerangan ralat dalam Bahasa Melayu atau Bahasa Inggeris"
}
```

---

## 2. Applications API Group (`/api/applications`)

### 2.1 Submissions & Workflow

#### `POST /api/applications`
- **Auth Required**: `APPLICANT`, `SUPER_ADMIN`
- **Description**: Creates a new Planning Permission (Kebenaran Merancang - KM) draft application.
- **Request Body**:
  ```json
  {
    "title": "Permohonan Kebenaran Merancang Cadangan Pembangunan Komersial 3 Tingkat",
    "projectType": "KM_SUITE",
    "applicantName": "Ir. Ahmad Zulkifli",
    "cadastralLot": "Lot 1042, Mukim Kuah",
    "district": "Langkawi"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "applicationId": "APP-2026-004",
    "status": "DRAFT",
    "createdAt": "2026-09-07T08:52:00.000Z"
  }
  ```

#### `POST /api/applications/transition`
- **Auth Required**: `OSC_OFFICER`, `PLANNING_OFFICER`, `ADMIN`, `SUPER_ADMIN`
- **Description**: Transitions an application along the statutory workflow state machine.
- **Request Body**:
  ```json
  {
    "applicationId": "APP-2026-001",
    "targetState": "TECHNICAL_REVIEW",
    "reason": "Semua dokumen LCP dan analisis GIS telah disahkan lengkap."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "applicationId": "APP-2026-001",
    "previousState": "SUBMITTED",
    "currentState": "TECHNICAL_REVIEW",
    "updatedAt": "2026-09-07T08:52:00.000Z"
  }
  ```

### 2.2 LCP AI Fact Extraction

#### `POST /api/applications/[applicationId]/extraction/process`
- **Auth Required**: `APPLICANT`, `OSC_OFFICER`, `PLANNING_OFFICER`, `ADMIN`
- **Description**: Triggers Google Document AI / Gemini extraction on uploaded LCP documents.
- **Request Body**:
  ```json
  {
    "documentId": "doc-lcp-001",
    "storagePath": "applications/APP-2026-001/documents/lcp.pdf"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "COMPLETED",
    "extractedFactsCount": 14,
    "conflictsCount": 0
  }
  ```

#### `POST /api/applications/[applicationId]/extraction/facts/[factId]/confirm`
- **Auth Required**: `PLANNING_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Description**: Confirms an extracted planning fact value by an authorized officer.
- **Response (200 OK)**:
  ```json
  {
    "factId": "site.areaSqm_v1",
    "status": "CONFIRMED",
    "confirmedBy": "usr-officer-01"
  }
  ```

### 2.3 Technical Comments & Verification

#### `POST /api/applications/[applicationId]/comments/draft/generate`
- **Auth Required**: `PLANNING_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Description**: Generates an AI-assisted technical ulasan draft using Gemini 1.5 Pro with Malaysia Planning Rules.
- **Request Body**:
  ```json
  {
    "department": "JABATAN_PERANCANG_BANDAR",
    "language": "MS"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "draftId": "draft-gemini-771",
    "content": "Penggunaan tanah cadangan selari dengan Rancangan Tempatan Daerah Langkawi 2030...",
    "aiModel": "gemini-1.5-pro",
    "status": "AI_GENERATED"
  }
  ```

#### `POST /api/applications/[applicationId]/comments/draft/[draftId]/verify`
- **Auth Required**: `PLANNING_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Description**: Verifies and locks a technical comment draft into an immutable verified comment with SHA-256 fingerprinting.
- **Request Body**:
  ```json
  {
    "verifiedContent": "Penggunaan tanah cadangan selari dengan RTD Langkawi 2030. Syarat binaan hendaklah mematuhi anjakan 40 kaki.",
    "verificationComment": "Disahkan setelah semakan pelan tapak."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "commentId": "com-ver-102",
    "status": "OFFICER_VERIFIED",
    "sha256Fingerprint": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "verifiedAt": "2026-09-07T08:52:00.000Z"
  }
  ```

### 2.4 SmartCheck Reports & Audit Manifest

#### `POST /api/applications/[applicationId]/reports`
- **Auth Required**: `PLANNING_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Description**: Compiles and generates a SmartCheck Compliance Report.
- **Response (201 Created)**:
  ```json
  {
    "reportId": "rpt-2026-001",
    "reportNumber": "MPLBP/KM/2026/001-RPT",
    "overallStatus": "PASSED_WITH_CONDITIONS",
    "sha256Hash": "a8f5f167f44f4964e6c998dee827110c"
  }
  ```

---

## 3. GIS & Geospatial API Group (`/api/gis`)

### 3.1 Cadastral Lots & Spatial Search

#### `GET /api/gis/lots/search`
- **Auth Required**: `Public` / All Authenticated Users
- **Query Params**: `lotNumber`, `mukim`, `district`, `limit`
- **Response (200 OK)**:
  ```json
  {
    "lots": [
      {
        "lotId": "LOT-1042-KUAH",
        "lotNumber": "Lot 1042",
        "mukimName": "Kuah",
        "districtName": "Langkawi",
        "areaSqm": 12730.0
      }
    ]
  }
  ```

#### `GET /api/gis/lots/by-point`
- **Auth Required**: `Public` / All Authenticated Users
- **Query Params**: `lat`, `lng`
- **Response (200 OK)**:
  ```json
  {
    "matchedLot": {
      "lotId": "LOT-1042-KUAH",
      "lotNumber": "Lot 1042",
      "mukimName": "Kuah",
      "distanceMeters": 0
    }
  }
  ```

### 3.2 RTD Statutory Zoning & Buffer Analysis

#### `POST /api/gis/applications/[applicationId]/rtd-intersection`
- **Auth Required**: `PLANNING_OFFICER`, `GIS_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Description**: Performs PostGIS geometric intersection analysis against statutory RTD zoning layers.
- **Response (200 OK)**:
  ```json
  {
    "primaryZone": {
      "zoneCode": "PERUDAHAN_SEDERHANA",
      "zoneName": "Zon Perumahan Kepadatan Sederhana",
      "intersectionAreaSqm": 12730.0,
      "intersectionPercent": 100.0
    },
    "zones": [...]
  }
  ```

#### `GET /api/gis/applications/[applicationId]/buffer-analysis`
- **Auth Required**: `PLANNING_OFFICER`, `GIS_OFFICER`, `OSC_OFFICER`, `ADMIN`
- **Query Params**: `radiusMeters` (Default: `500`)
- **Response (200 OK)**:
  ```json
  {
    "bufferDistanceMeters": 500,
    "featuresCountByType": {
      "RIVER": 1,
      "ROAD_PRIMARY": 2
    },
    "features": [...]
  }
  ```

---

## 4. Management Analytics API Group (`/api/management`)

### 4.1 KPIs & Executive Summary

#### `GET /api/management/dashboard`
- **Auth Required**: `OSC_MANAGER`, `PLANNING_MANAGER`, `ADMIN`, `SUPER_ADMIN`
- **Description**: Aggregates real-time processing KPIs, SLA compliance percentages, and application distribution.
- **Response (200 OK)**:
  ```json
  {
    "totalApplications": 128,
    "averageProcessingDays": 11.4,
    "slaCompliancePercent": 94.2,
    "statusBreakdown": {
      "SUBMITTED": 12,
      "TECHNICAL_REVIEW": 45,
      "APPROVED": 71
    }
  }
  ```

#### `GET /api/management/planning-intelligence`
- **Auth Required**: `OSC_MANAGER`, `PLANNING_MANAGER`, `ADMIN`, `SUPER_ADMIN`
- **Description**: Returns spatial planning density analysis, lot conflict hotspots, and zoning trend insights.

---

## 5. System Administration API Group (`/api/admin`)

### 5.1 User & Role Management

#### `GET /api/admin/users`
- **Auth Required**: `ADMIN`, `SUPER_ADMIN`
- **Description**: Retrieves system users with role assignment and organizational metadata.

#### `POST /api/admin/users`
- **Auth Required**: `ADMIN`, `SUPER_ADMIN`
- **Description**: Registers a new system user with assigned role and agency department.

#### `POST /api/admin/set-user-role`
- **Auth Required**: `SUPER_ADMIN` (Strict)
- **Description**: Assigns or updates a user's RBAC role with immutable audit logging.

### 5.2 GIS Reconciliation & Operations

#### `GET /api/admin/gis/reconciliation`
- **Auth Required**: `ADMIN`, `SUPER_ADMIN`, `GIS_OFFICER`, `OSC_OFFICER`
- **Query Params**: `appIds` (optional comma-separated list)
- **Description**: Audits PostGIS spatial facts against Cloud Firestore application records, flagging stale or mismatched geometries.
- **Response (200 OK)**:
  ```json
  {
    "timestamp": "2026-09-07T08:52:00.000Z",
    "totalChecked": 3,
    "syncedCount": 3,
    "discrepancyCount": 0,
    "results": [
      {
        "applicationId": "APP-2026-001",
        "status": "SYNCED",
        "firestoreAreaSqm": 12730.0,
        "postgisAreaSqm": 12730.0,
        "lotNumbers": ["Lot 1042", "Lot 1043"],
        "issues": []
      }
    ]
  }
  ```

#### `GET /api/admin/health`
- **Auth Required**: `ADMIN`, `SUPER_ADMIN`, `OSC_MANAGER`
- **Description**: Diagnostic endpoint checking Cloud Firestore latency, PostGIS database connectivity, Document AI status, and Gemini Vertex AI readiness.
