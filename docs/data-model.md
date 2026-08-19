# OSC SmartCheck AI — Firestore Base Data Model

**Project:** OSC SmartCheck AI  
**Organization:** One Stop Centre (OSC), Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)  
**Database:** Cloud Firestore (NoSQL Document Store)

---

## 1. Architectural Principles

1. **Workflow & State Database:** Cloud Firestore serves as the transactional, business workflow, and compliance state database.
2. **Zero Large Binary Storage:** Large CAD drawings and PDF documents must **never** be stored directly in Firestore documents. All drawing files are stored securely in Cloud Storage, with only metadata and storage paths retained in Firestore.
3. **Spatial Data Decoupling:** Future GIS polygons and multi-polygon zoning layers are streamed and referenced from spatial engines rather than loaded into monolithic document fields.
4. **Server Authoritative Timestamps:** All state transitions and sensitive actions use server-side timestamps (`FieldValue.serverTimestamp()`).
5. **Final Verified Immutability:** Once an officer review or evaluation outcome is finalized and marked `VERIFIED`, the document is locked from any client-side update or deletion.

---

## 2. Core Collections & Subcollections

```
Firestore Root
├── users/{uid}
├── organizations/{organizationId}
├── applications/{applicationId}
│   ├── versions/{versionId}
│   ├── documents/{documentId}
│   ├── extractedFacts/{factId}
│   ├── smartChecks/{smartCheckId}
│   ├── officerReviews/{reviewId}
│   └── statusHistory/{historyId}
├── guidelines/{guidelineId}
├── ruleSets/{ruleSetId}
├── aiRuns/{aiRunId}
├── auditLogs/{auditLogId}
└── systemConfig/{configId}
```

---

## 3. Detailed Collection Schemas

### 3.1. `applications/{applicationId}`
Primary planning permission application document.

| Field | Type | Description |
|---|---|---|
| `applicationNo` | `string` | Official submission reference (e.g., `MPLBP/OSC/KM/2026/001`) |
| `applicantUid` | `string` | Foreign key referencing `users.uid` (Principal Submitting Person) |
| `organizationId` | `string?` | Firm or organization identifier |
| `developmentType` | `string` | Enum: `'HOUSING'`, `'HOTEL'`, `'COMMERCIAL'`, `'INDUSTRIAL'`, `'MIXED_DEVELOPMENT'`, `'OTHER'` |
| `title` | `string` | Proposal title and project scope |
| `lotNo` | `string?` | Cadastral lot number |
| `mukim` | `string?` | Mukim name (e.g. `'Padang Matsirat'`, `'Kuah'`, `'Kedawang'`) |
| `district` | `string` | Default: `'Langkawi'` |
| `state` | `string` | Default: `'Kedah'` |
| `siteAreaSqm` | `number?` | Total site area in square meters |
| `location` | `map` | Geo-coordinates: `{ latitude: number \| null, longitude: number \| null }` |
| `status` | `string` | Enum: `'DRAFT'`, `'SUBMITTED'`, `'DOCUMENT_CHECK'`, `'AI_PROCESSING'`, `'SMARTCHECK_COMPLETED'`, `'OFFICER_REVIEW'`, `'REQUEST_INFORMATION'`, `'RESUBMITTED'`, `'VERIFIED'`, `'COMPLETED'` |
| `currentVersion` | `number` | Active submission version index (starts at 1) |
| `assignedOfficerUid`| `string?`| Assigned OSC technical reviewer |
| `createdAt` | `timestamp` | Server-assigned creation timestamp |
| `createdBy` | `string` | User UID of creator |
| `updatedAt` | `timestamp` | Server-assigned modification timestamp |
| `updatedBy` | `string` | User UID of last editor |
| `submittedAt` | `timestamp?`| Formal lodgement timestamp |
| `verifiedAt` | `timestamp?`| Final officer endorsement timestamp |
| `schemaVersion` | `number` | Data schema format version (e.g. `1`) |

---

### 3.2. Subcollections of `applications/{applicationId}`

#### `versions/{versionId}`
Snapshot checkpoint of submission iterations.
- `versionNumber`: `number`
- `createdAt`: `timestamp`
- `createdBy`: `string`
- `reason`: `string?`
- `statusAtCreation`: `string`
- `locked`: `boolean`

#### `documents/{documentId}`
Metadata for attached architectural drawings and statutory documents.
- `documentType`: Enum: `'LCP'`, `'SITE_PLAN'`, `'LOCATION_PLAN'`, `'LAYOUT_PLAN'`, `'BUILDING_PLAN'`, `'SUPPORTING_DOCUMENT'`, `'OTHER'`
- `fileName`: `string`
- `storagePath`: `string` (Path in Cloud Storage)
- `mimeType`: `string`
- `sizeBytes`: `number` (Max 100MB)
- `versionNumber`: `number`
- `sha256`: `string?` (File integrity checksum)
- `processingStatus`: Enum: `'UPLOADED'`, `'QUEUED'`, `'PROCESSING'`, `'PROCESSED'`, `'FAILED'`
- `uploadedBy`: `string`
- `uploadedAt`: `timestamp`

#### `extractedFacts/{factId}`
Discrete parameters parsed by AI / OCR from submitted drawings and schedules.
- `parameterCode`: `string` (e.g. `'PLOT_RATIO'`, `'SETBACK_FRONT'`)
- `parameterName`: `string`
- `detectedValue`: `unknown`
- `confirmedValue`: `unknown?` (Officer-confirmed value)
- `unit`: `string?`
- `confidence`: `number?` (0.0 to 1.0)
- `source`: `{ documentId: string, page: number | null, textReference: string | null }`
- `status`: Enum: `'AI_DETECTED'`, `'CONFIRMED'`, `'CORRECTED'`, `'REJECTED'`
- `createdAt`: `timestamp`
- `confirmedBy`: `string?`
- `confirmedAt`: `timestamp?`

#### `smartChecks/{smartCheckId}`
Deterministic rule engine calculation outputs.
- `ruleSetVersion`: `string` (e.g. `'RTD-LANGKAWI-2030-V2'`)
- `status`: Enum: `'RUNNING'`, `'COMPLETED'`, `'FAILED'`
- `overallResult`: Enum: `'PATUH'`, `'TIDAK_PATUH'`, `'PERLU_PENGESAHAN'`, `'TIDAK_BERKENAAN'`
- `score`: `number?`
- `createdAt`: `timestamp`
- `completedAt`: `timestamp?`

#### `officerReviews/{reviewId}`
Human-in-the-loop statutory verification and remarks.
- `smartCheckId`: `string`
- `reviewStatus`: Enum: `'DRAFT'`, `'UNDER_REVIEW'`, `'VERIFIED'` (Once `VERIFIED`, document is immutable)
- `aiDraftComment`: `string?`
- `officerComment`: `string?`
- `finalComment`: `string?`
- `reviewedBy`: `string?`
- `verifiedBy`: `string?`
- `createdAt`: `timestamp`
- `updatedAt`: `timestamp`
- `verifiedAt`: `timestamp?`

#### `statusHistory/{historyId}`
Append-only state transition journal.
- `fromStatus`: `string?`
- `toStatus`: `string`
- `action`: `string`
- `actorUid`: `string`
- `actorRole`: `string`
- `timestamp`: `timestamp`
- `remarks`: `string?`

---

### 3.3. Supporting Collections

#### `guidelines/{guidelineId}`
- `title`: `string`
- `code`: `string`
- `version`: `string`
- `effectiveFrom`: `timestamp`
- `effectiveTo`: `timestamp?`
- `active`: `boolean`
- `sourceDocumentPath`: `string?`
- `createdAt`: `timestamp`
- `createdBy`: `string`

#### `ruleSets/{ruleSetId}`
- `code`: `string`
- `name`: `string`
- `version`: `string`
- `status`: Enum: `'DRAFT'`, `'ACTIVE'`, `'RETIRED'`
- `effectiveFrom`: `timestamp`
- `effectiveTo`: `timestamp?`
- `createdAt`: `timestamp`
- `createdBy`: `string`

#### `auditLogs/{auditLogId}`
Append-only system-wide security and compliance event journal.
- `eventType`: `string`
- `resourceType`: `string`
- `resourceId`: `string`
- `applicationId`: `string?`
- `actorUid`: `string`
- `actorRole`: `string`
- `timestamp`: `timestamp`
- `metadata`: `map`

---

## 4. Compound Index Requirements

Defined in `firestore.indexes.json`:
1. `applications`: `applicantUid` (ASC) + `status` (ASC) + `createdAt` (DESC)
2. `applications`: `assignedOfficerUid` (ASC) + `status` (ASC) + `updatedAt` (DESC)
3. `applications`: `status` (ASC) + `submittedAt` (DESC)
4. `documents`: `versionNumber` (ASC) + `uploadedAt` (DESC)
5. `auditLogs`: `applicationId` (ASC) + `timestamp` (DESC)
