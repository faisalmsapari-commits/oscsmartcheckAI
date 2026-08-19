# Comment Verification & Immutable Snapshots

## 1. Verification Requirements

Before a comment can be verified into an official snapshot:
1. **Role Authorization:** Actor must be authenticated as `OSC_OFFICER` or `PLANNING_OFFICER`.
2. **Freshness Check:** Draft must not be stale (`isStale === false`).
3. **Deterministic Content Validation:** No prohibited statutory phrases (e.g. `permohonan diluluskan`, `KM diluluskan`, `permohonan ditolak`).
4. **Officer Declaration:** Explicit confirmation checkbox asserting review and concurrence.

## 2. Immutable Snapshot Model

When verified:
- Written to `applications/{applicationId}/verifiedComments/{commentId}`
- Document cannot be updated or deleted in Firestore (`allow update, delete: if false;`)
- Checksum computed via SHA-256 over `finalText`
- Version incremented (`v1`, `v2`, `v3`)
- Previous active verified comment marked `SUPERSEDED`
