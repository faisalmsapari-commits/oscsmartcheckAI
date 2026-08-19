# Comment Publication & Applicant Access Control

## 1. Two-Stage Publication Workflow

To ensure official communications remain deliberate and verified:
1. **Officer Verification (`SAHKAN ULASAN`):** Locks the technical comment internally within the planning department (`visibility: "INTERNAL"`).
2. **Officer Publication (`TERBITKAN KEPADA PEMOHON`):** Updates the visibility to `APPLICANT_VISIBLE`.

## 2. Information Barrier
- **Applicants:** Only see `APPLICANT_VISIBLE` + `VERIFIED` snapshots via `/applications/[id]/official-comments`.
- **Internal Only:** Raw AI drafts, officer drafts in editing, internal disagreement notes, system prompts, and diff records are completely inaccessible to applicants.
