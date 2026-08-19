# SmartCheck Reporting Architecture

## 1. Objective & Governance Principles

The **SmartCheck Reporting Layer** creates authoritative, traceable, and immutable official records of planning pre-check assessments for Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).

### Statutory Integrity Principles:
- **Record of System State Only:** Generating a PDF report is strictly an archival and reporting function. It **MUST NOT** create, modify, or reinterpret any planning decision.
- **Zero Generative AI Invocations:** The report is generated deterministically from validated structured data snapshots (`SmartCheckReportData`). Gemini is not called during report rendering.
- **Strict Privacy Filtering:** Internal officer notes, disagreement deliberations, system logs, and sensitive personal details (NRIC, personal telephone, bank details) are completely removed from applicant-facing reports before rendering.
- **Cryptographic Tamper-Evidence:** Every report is hashed with SHA-256 upon creation and stored alongside the PDF file in Cloud Storage.

```text
Verified Application State (Module 05/06)
          +
Deterministic SmartCheck Run (Module 09)
          +
Verified Spatial Facts (Module 08) & LCP Facts (Module 07)
          +
Verified Officer OSC Comment (Module 11)
          ↓
buildReportData() [Structured Snapshot]
          ↓
filterReportDataByType() [Privacy Enforcement]
          ↓
SmartCheckReportDataSchema.parse() [Zod Validation]
          ↓
generateSmartCheckReportHtml() [Deterministic Semantic HTML]
          ↓
defaultPdfRenderer.renderReport() [PDF 1.7 Standards-Compliant]
          ↓
calculateReportChecksum() [SHA-256 Hash]
          ↓
Cloud Storage + Firestore Report Record (Status: GENERATED)
          ↓
Officer Verification & Publication (TERBITKAN KEPADA PEMOHON)
```
