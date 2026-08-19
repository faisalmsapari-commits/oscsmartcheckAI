# Report Versioning & Supersession

## 1. Version Increment Logic

- Every newly generated report for a given `reportType` increments the version number (`v1`, `v2`, `v3`).
- Previous reports are never overwritten or deleted. Their status is transitioned to `SUPERSEDED`, pointing to `supersededByReportId`.
- Stored PDF files remain immutably preserved in the storage hierarchy:
  `applications/{applicationId}/reports/{reportType}/v{version}/{fileName}`

## 2. Freshness Detection (`getReportFreshness`)

Reports are marked stale if any underlying data changes:
- `STALE_SMARTCHECK_CHANGED`: A newer SmartCheck pre-check has run.
- `STALE_COMMENT_CHANGED`: The verified OSC comment has been amended or revoked.
- `STALE_SOURCE_CHANGED`: LCP or GIS site data has changed.
- `STALE_TEMPLATE_CHANGED`: System report template version has changed.

> [!WARNING]
> Stale reports cannot be published to the applicant until regenerated from current data.
