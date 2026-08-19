# Comment Versioning & Freshness

## 1. Source Fingerprinting

A deterministic SHA-256 fingerprint is calculated across:
- `applicationId`
- `smartCheckId`
- `lcpVersion`
- `siteVersion`
- `ruleEngineVersion`
- `promptVersion`
- Rule evaluation status and actual values
- Issue statuses and visibility
- Officer assessment outcomes

When a re-run of SmartCheck completes or issues change, `getDraftFreshness()` detects the fingerprint divergence and flags the draft as `STALE_SMARTCHECK_CHANGED`.

## 2. Supersession Model
- Previous verified comment snapshots are never overwritten; they are transitioned to `SUPERSEDED` and linked to `supersededByCommentId`.
- Preserves a complete, unalterable historical audit trail for statutory inquiries.
