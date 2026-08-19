# Document Resubmission & Recheck Orchestration
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Document Versioning & Staleness
When an applicant uploads an amended plan or LCP document:
- Original document version remains active historically and is marked `SUPERSEDED`.
- New document version is created with status `ACTIVE` and incremented version index ($v2, v3, \dots$).
- Previous extracted facts, SmartCheck evaluations, AI comment drafts, and final reports are marked `STALE`.

## 2. Recheck Workflow Pipeline
Triggering `PROSES SEMAKAN SEMULA` executes the end-to-end evaluation:
1. Extraction of new parametric facts from amended PDF drawings.
2. Officer verification of extracted parameters.
3. Deterministic SmartCheck rule execution against RTD 2030 standards.
4. Delta evaluation against previous run:
   - If previous `NON_COMPLIANT` issue is now `COMPLIANT`, it transitions to `SUPERSEDED_BY_NEW_SMARTCHECK`.
5. Generation of deterministic `ChangeSummary` (`Ringkasan Perubahan`).
6. Update of verified comment draft and official report package.
