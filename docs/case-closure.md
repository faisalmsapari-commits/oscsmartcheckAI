# Case Closure Lifecycle & Immutable Closure Snapshots
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Case Closure Readiness Gates
Before a case can be transitioned to `COMPLETED`, `getCaseClosureReadiness()` validates:
1. **SmartCheck Execution:** An active SmartCheck evaluation exists.
2. **Human Verification:** Verified official OSC comment exists and was signed off by an officer.
3. **Official Report:** PDF final report is generated and published.
4. **Zero Open RFIs:** No active or pending requests for information remain unanswered.
5. **No Blocking System Errors:** All data models are synchronized and valid.

## 2. Immutable Closure Snapshot
Collection: `applications/{applicationId}/closureSnapshots/{snapshotId}`
- Stores exact source versions: application version, document versions, SmartCheck ID, verified comment ID, report ID, and report SHA-256 checksum.
- Generates a cryptographic SHA-256 hash across the entire completion metadata.
- Appends statutory notice:
  > *"Penyelesaian proses SmartCheck ini BUKAN merupakan kelulusan rasmi Kebenaran Merancang (KM) di bawah Akta 172."*

## 3. Post-Decision Reopening & Workflow Cycles
- Applications requiring post-approval amendments can be reopened by authorized officers (`reopenApplicationCase`).
- Reopening preserves the previous cycle historically and initializes **Cycle 2** in `applications/{applicationId}/cycles/{cycleId}`.
