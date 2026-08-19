# KPI Definitions & Formula Registry

## 1. Centralized KPI Definitions (Version 1.0.0)

| KPI Code | Name | Formula | Unit | Aggregation |
| :--- | :--- | :--- | :---: | :---: |
| `TOTAL_APPLICATIONS` | Jumlah Permohonan | `COUNT(applications)` | KM | `COUNT` |
| `ACTIVE_APPLICATIONS` | Permohonan Aktif | `COUNT(applications WHERE status NOT IN ('DRAFT', 'COMPLETED', 'REJECTED'))` | KM | `COUNT` |
| `SMARTCHECK_COMPLETED` | SmartCheck Selesai | `COUNT(smartChecks WHERE status == 'COMPLETED')` | Semakan | `COUNT` |
| `REVISION_REQUIRED` | Perlu Pindaan | `COUNT(smartChecks WHERE overallStatus == 'FAIL_PRECHECK' OR nonCompliantCount > 0)` | KM | `COUNT` |
| `OFFICER_REVIEW_REQUIRED` | Perlu Semakan Pegawai | `COUNT(smartChecks WHERE requiresReviewCount > 0)` | KM | `COUNT` |
| `OPEN_ISSUES` | Isu Terbuka | `COUNT(issues WHERE status IN ('OPEN', 'IN_REVIEW', 'WAITING_APPLICANT'))` | Isu | `COUNT` |
| `AVG_SMARTCHECK_DURATION` | Purata Masa SmartCheck | `AVG(completedAt - startedAt)` | Saat | `AVG` |
| `AVG_OFFICER_REVIEW_DURATION` | Purata Masa Semakan Pegawai | `AVG(verifiedAt - smartCheckCompletedAt)` | Jam | `AVG` |
| `HUMAN_VERIFICATION_RATE` | Kadar Pengesahan Manusia | `(COUNT(verifiedByHuman) / COUNT(published)) * 100` | % | `PERCENTAGE` |
| `RULE_TRACEABILITY_RATE` | Ketelusan Punca Kuasa | `(COUNT(resultsWithEvidence) / COUNT(results)) * 100` | % | `PERCENTAGE` |
| `MANUAL_CORRECTION_RATE` | Kadar Pembetulan Manual | `(COUNT(factsCorrected) / COUNT(factsExtracted)) * 100` | % | `PERCENTAGE` |
| `REPORT_INTEGRITY_RATE` | Kadar Integriti Laporan | `(COUNT(validChecksumReports) / COUNT(totalReports)) * 100` | % | `PERCENTAGE` |
