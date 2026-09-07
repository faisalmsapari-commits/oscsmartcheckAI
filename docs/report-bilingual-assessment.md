# Architectural Assessment & Proposal: Bilingual (BM/EN) PDF Report Generation

**Document Version:** 1.0.0  
**Status:** PROPOSAL / AWAITING APPROVAL  
**Feature Target:** Bahasa Malaysia / English Language Toggle for Officially Generated SmartCheck PDF Reports  
**System:** OSC SmartCheck AI (MPLBP)  

---

## 1. Executive Summary

This document presents a technical effort assessment and architectural proposal for enabling a language toggle (**Bahasa Malaysia / English**) on officially generated SmartCheck compliance PDF reports.

---

## 2. Effort Assessment Summary

| Dimension | Assessment Detail |
| :--- | :--- |
| **Total Estimated Effort** | **1.5 – 2.0 Developer Days** (approx. 10 – 14 engineering hours) |
| **Code Base Impact** | **Low Risk** — Purely presentation-layer translation; core rule engine, PostGIS geometric calculations, and SHA-256 digital fingerprinting logic remain completely untouched. |
| **Performance Overhead** | **0%** — In-memory dictionary lookup adds zero network latency or database overhead. |
| **Maintainability** | **High** — Single unified HTML template structure ensures no design drift between BM and EN versions. |

---

## 3. Comparison of Architectural Approaches

### Approach A: Report Template Duplication (`smartCheckReportHtml_en.ts`)
- **Mechanism**: Duplicate `smartCheckReportHtml.ts` into a second 575-line file (`smartCheckReportHtml_en.ts`) with hardcoded English text.
- **Pros**: Quick to draft initial file.
- **Cons**:
  - **High Technical Debt**: Any future layout change, CSS tweak, brand update, or header revision must be manually duplicated across both files.
  - **Drift Risk**: High risk of BM and EN reports diverging visually over time.

### Approach B: Dictionary-Based Lightweight i18n (`reportDictionary.ts`) — **(RECOMMENDED)**
- **Mechanism**: Create a typed translation dictionary `src/lib/reports/i18n/reportDictionary.ts` containing key-value pairs for `ms` and `en` locales. The HTML generator `generateSmartCheckReportHtml(data, lang)` looks up localized text based on the selected language.
- **Pros**:
  - **Single Source of Truth**: Unified CSS styling, layout structure, and DOM tree.
  - **Zero Heavy Dependencies**: Avoids bulky external i18n libraries (e.g. `react-i18next` or `next-intl`) for server-side PDF HTML rendering.
  - **SHA-256 Fingerprint Determinism**: Language selection is recorded in `reportMetadata.language` ('MS' | 'EN') and included in the source hash.
- **Cons**: Requires initial setup of translation dictionary keys (~100 text labels).

---

## 4. Impacted Codebase Components

If approved, the implementation will touch the following files:

1. `[NEW]` [reportDictionary.ts](file:///c:/antigravity/oscsmartchecker/src/lib/reports/i18n/reportDictionary.ts): Language lookup dictionary (`ms` and `en`).
2. `[MODIFY]` [reports.ts](file:///c:/antigravity/oscsmartchecker/src/types/reports.ts): Add `language?: 'MS' | 'EN'` field to `ReportMetadata`.
3. `[MODIFY]` [smartCheckReportHtml.ts](file:///c:/antigravity/oscsmartchecker/src/lib/reports/templates/smartCheckReportHtml.ts): Accept `lang` parameter and reference dictionary labels.
4. `[MODIFY]` [reportService.ts](file:///c:/antigravity/oscsmartchecker/src/lib/reports/reportService.ts): Pass `language` parameter from generation request to HTML builder.
5. `[MODIFY]` [reports/page.tsx](file:///c:/antigravity/oscsmartchecker/src/app/applications/[applicationId]/reports/page.tsx): Add language selection toggle (BM / EN button) on report generation UI modal.

---

## 5. Sample Dictionary Implementation Snippet

```typescript
export type ReportLocale = "ms" | "en";

export const REPORT_DICTIONARY: Record<ReportLocale, Record<string, string>> = {
  ms: {
    reportTitle: "LAPORAN SEMAKAN PEMATUHAN SMARTCHECK",
    authorityHeader: "MAJLIS PERBANDARAN LANGKAWI BANDAR PELANCONGAN",
    classificationInternal: "UNTUK KEGUNAAN DALAMAN",
    classificationApplicant: "SALINAN PEMOHON",
    classificationAudit: "REKOD AUDIT & PEMATUHAN",
    sectionApplicationDetails: "1. Maklumat Permohonan & Pemohon",
    sectionSiteLocation: "2. Lokasi Tapak & Lot Kadaster",
    sectionSpatialAnalysis: "3. Ringkasan Analisis Spatial & Zon RTD",
    sectionComplianceSummary: "4. Ringkasan Pematuhan Perancangan",
    sectionVerifiedComment: "5. Ulasan Teknikal Pegawai Disahkan",
    overallStatusPassed: "PATUH",
    overallStatusPassedConditions: "PATUH BERSYARAT",
    overallStatusFailed: "TIDAK PATUH",
    digitalFingerprintNotice: "Imbasan Hash SHA-256 Integriti Digital Statutori",
  },
  en: {
    reportTitle: "SMARTCHECK COMPLIANCE ASSESSMENT REPORT",
    authorityHeader: "LANGKAWI TOURIST CITY MUNICIPAL COUNCIL",
    classificationInternal: "FOR INTERNAL USE ONLY",
    classificationApplicant: "APPLICANT COPY",
    classificationAudit: "AUDIT & COMPLIANCE RECORD",
    sectionApplicationDetails: "1. Application & Applicant Details",
    sectionSiteLocation: "2. Site Location & Cadastral Lots",
    sectionSpatialAnalysis: "3. Spatial Analysis & Statutory RTD Zoning",
    sectionComplianceSummary: "4. Planning Compliance Summary",
    sectionVerifiedComment: "5. Verified Officer Technical Comment",
    overallStatusPassed: "COMPLIANT",
    overallStatusPassedConditions: "COMPLIANT WITH CONDITIONS",
    overallStatusFailed: "NON-COMPLIANT",
    digitalFingerprintNotice: "Statutory Digital Integrity SHA-256 Hash Digest",
  },
};
```

---

## 6. Status & Next Steps

This proposal is **AWAITING USER APPROVAL**. No implementation code has been written yet. Upon receiving your go-ahead, implementation can be completed and verified with automated tests within **1.5 developer days**.
