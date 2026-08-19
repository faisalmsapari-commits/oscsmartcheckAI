# Audit Package & Digital Traceability

## 1. Audit Package Contents

The `SMARTCHECK_AUDIT_PACKAGE` report type provides total traceability for statutory investigations, appeals, or ministerial audits.

It captures:
- Complete snapshot of application metadata and submission history
- Document version history (LCP, Site Plan)
- GIS spatial dataset identifiers and versions (`RTD-2030-v1`)
- Planning Rule Set versions (`RS-MPLBP-2026-V1`) and Engine version (`1.0.0`)
- Complete machine evaluation traces and calculation steps
- Officer assessments and disagreement rationales
- Full issue lifecycle history
- Verified comment snapshot and verification checksum
- Audit event chronological timeline (filtered for high-relevance governance actions)
- Audit Manifest JSON

## 2. Audit Manifest Model

```json
{
  "manifestVersion": "1.0.0",
  "applicationId": "app-101",
  "reportId": "rep-123456",
  "generatedAt": "2026-08-19T04:20:00.000Z",
  "sourceVersions": {
    "lcpVersion": 2,
    "siteVersion": 1,
    "smartCheckId": "sc-101",
    "ruleEngineVersion": "1.0.0",
    "ruleSetVersions": ["RS-MPLBP-2026-V1"],
    "gisDatasetVersions": ["RTD-2030-v1", "LOT-KADASTER-2026"],
    "templateVersion": "1.0.0"
  },
  "files": [
    {
      "fileName": "OSC-SmartCheck-KM_2026_000101-SMARTCHECK_AUDIT_PACKAGE-v1.pdf",
      "storagePath": "applications/app-101/reports/SMARTCHECK_AUDIT_PACKAGE/v1/...",
      "fileSize": 18450,
      "mimeType": "application/pdf",
      "sha256": "4b6f1...9a"
    }
  ]
}
```
