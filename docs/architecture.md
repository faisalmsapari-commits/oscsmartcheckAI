# OSC SmartCheck AI — System Architecture Document

**Project:** OSC SmartCheck AI  
**Organization:** One Stop Centre (OSC), Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)  
**System Objective:** Intelligent Planning Compliance & Decision Support System for Langkawi Planning Permission Applications.

---

## 1. Core Architectural Vision

OSC SmartCheck AI is designed as a hybrid intelligent system providing pre-check validation, regulatory compliance checking, GIS spatial verification, and officer decision support for planning permission (Kebenaran Merancang) submissions under Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).

The system accelerates the planning review cycle, eliminates recurring submission defects, and standardizes regulatory assessments against the Rancangan Tempatan Daerah (RTD) Langkawi, Pelan Guna Tanah, and state/national planning guidelines.

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (Next.js)                             |
|  - Government Application Shell (MPLBP Visual Identity)                      |
|  - Submission Pre-Check Interface                                             |
|  - Officer Dashboard & Verification Workspace                                 |
|  - GIS Map Viewer & Layer Overlay                                             |
+---------------------------------------+---------------------------------------+
                                        | HTTPS / Secure Web SDK
                                        v
+-------------------------------------------------------------------------------+
|                       API & APPLICATION HOSTING TIER                          |
|  - Next.js Server Components & Route Handlers                                 |
|  - Firebase App Hosting / Cloud Functions                                     |
|  - Strict Role-Based Access Control (RBAC) Guardrails                         |
+-------------------+---------------------------------------+-------------------+
                    |                                       |
                    v                                       v
+---------------------------------------+   +-----------------------------------+
|      AI & OCR EXTRACTION TIER         |   |     DETERMINISTIC COMPLIANCE      |
|  - Document AI / Multimodal Parsing   |   |            RULE ENGINE            |
|  - Extracts text, schedules, values   |   |  - Server-side rule evaluator     |
|  - Output: Candidate parameters       |   |  - RTD Langkawi & By-law policies |
|  - Advisory only (Non-binding)        |   |  - Immutable parameter matrix     |
+-------------------+-------------------+   +-----------------+-----------------+
                    |                                         |
                    +--------------------+--------------------+
                                         |
                                         v
+-------------------------------------------------------------------------------+
|                     HUMAN-IN-THE-LOOP VERIFICATION TIER                       |
|  - Authorized OSC Technical Officer reviews rule findings & AI extractions    |
|  - Officer validates/overrides extracted figures with statutory remarks       |
|  - Official endorsement stamp applied to verified evaluation records          |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                          PERSISTENCE & AUDIT TIER                             |
|  - Cloud Firestore (Transactional state, applications, immutable audit logs)  |
|  - Cloud Storage (Encrypted architectural drawings, CAD, PDF submissions)     |
|  - Versioned Guideline Repository (Traceable RTD/By-law revisions)           |
+---------------------------------------+---------------------------------------+
```

---

## 2. Immutable Architecture Principles

The following principles are non-negotiable and govern all modules, functions, data access layers, and UI flows within the OSC SmartCheck AI platform:

### 2.1. Browser clients must not execute privileged business logic
- All compliance calculations, zoning lookups, density validations, setback evaluations, and decision matrix runs must execute strictly in trusted backend environments (Next.js Server Actions/Route Handlers or Firebase Cloud Functions).
- The web browser client is strictly a presentation and interaction layer. It must never determine statutory validity or perform authoritative calculations.

### 2.2. Compliance calculations must eventually execute server-side
- Regulatory engines are executed against verified server-side data models.
- Client inputs are treated as untrusted until validated against statutory schemas on the server.

### 2.3. AI cannot change compliance status
- Artificial Intelligence, Large Language Models (LLMs), and Document AI models function strictly as **Extraction and Advisory Assistants**.
- AI models parse submitted documents, detect drawing schedules, and summarize clauses. However, **AI cannot set, modify, or override a statutory compliance status** (`LULUS`, `GAGAL`, `BERSYARAT`).
- Compliance statuses are computed solely by deterministic rule engines and must be validated by human officers.

### 2.4. Official OSC comments require human verification
- Any advisory comment, notice of non-compliance, or recommendation generated by automated tools or AI must be reviewed, confirmed, or edited by an authorized OSC Technical Officer before becoming part of the official administrative record or being transmitted to the applicant/Principal Submitting Person (PSP).

### 2.5. Audit records must be preserved
- Every state change, evaluation run, officer override, document upload, and status transition is recorded in an append-only audit log collection.
- Audit logs contain cryptographic timestamping, officer user ID, IP/session metadata, prior values, and justification remarks. Audit records can never be updated or deleted.

### 2.6. Planning guideline versions must be traceable
- All planning rules (e.g., RTD Langkawi 2030, Garis Panduan Perancangan Negeri Kedah, UKBS 1984) are version-controlled in the database.
- Every compliance run permanently stores the exact `guideline_version_id` applied at the moment of calculation. If guidelines change in the future, historical evaluations remain reproducible and legally verifiable against the rules active on their submission date.

### 2.7. Final verified records must not be overwritten
- Once an evaluation is endorsed and finalized by an authorized OSC Officer, the record is locked in a read-only state.
- Any subsequent re-evaluation or amendment creates a new versioned evaluation iteration linked to the original submission, preserving the historical chain of custody.

---

## 3. Technology Stack & Component Specifications

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js (App Router, React, TypeScript) | Server-rendered & client shell application |
| **Styling** | Tailwind CSS | High-contrast, accessible government design system |
| **Authentication** | Firebase Authentication | Identity management with custom claims (RBAC) |
| **Database** | Cloud Firestore | NoSQL document database with strict security rules |
| **Storage** | Cloud Storage | Secure object storage for submission drawings & PDFs |
| **Hosting** | Firebase App Hosting | Enterprise Next.js deployment infrastructure |
| **Local Emulators** | Firebase Emulator Suite | Offline local development and CI testing |
| **Linting & Format** | ESLint + Prettier | Code quality and standard formatting enforcement |

---

## 4. Module Decomposition Roadmap

- **Module 01: Project Scaffold (Current)** — Directory architecture, Firebase SDK modular client, government shell layout, security rules baseline, local emulator environment, and documentation.
- **Module 02: Authentication & RBAC** — Custom claims, role gates (Applicant/PSP, OSC Officer, Technical Agency, Super Admin), session security.
- **Module 03: Submission & Document Management** — Upload pipelines, PDF/CAD drawing ingestion, secure Cloud Storage buckets.
- **Module 04: Deterministic Compliance Rule Engine** — Server-side zoning, density, plot ratio, setback, and parking calculation engine.
- **Module 05: Document AI & Extraction Pipeline** — Advisory extraction of building schedules, titles, and site areas.
- **Module 06: Spatial & GIS Overlay Engine** — Langkawi local plan zoning, environmentally sensitive areas (KSAS), coastal buffer overlays.
- **Module 07: Officer Decision Support & Verification Workspace** — Human-in-the-loop review, remark endorsement, and certificate generation.
- **Module 08: Audit Trail & Reporting** — Immutable compliance logging, executive reports, and audit query portal.
