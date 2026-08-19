# Planning Rule Governance & Lifecycle Management

## 1. Rule Set Versioning & Immutability

1. **DRAFT Rules:** Can be modified, tested, and validated by authorized planning officers or administrators.
2. **ACTIVE Rules:** Once marked `ACTIVE`, rule sets are permanently immutable. No inline updates are permitted.
3. **Supersession:** When a new guideline revision is approved, a new version (e.g. `v2.0.0`) is published, and `v1.0.0` is transitioned to `SUPERSEDED`.
4. **Historical Preservation:** Past SmartCheck runs retain immutable pointers to the exact `ruleSetId`, `version`, and `checksum` active at their evaluation time.

## 2. Officer Review & Assessment Workflow

When an officer reviews SmartCheck results:
- **No Direct Modification:** Officers cannot change or delete the machine-computed result (`PATUH` / `TIDAK PATUH`).
- **Separate Assessment:** Officers submit `AGREE`, `DISAGREE`, or `REQUIRES_FURTHER_REVIEW` with mandatory written justification.
- **Audit Logging:** Every assessment is logged with `OFFICER_RULE_ASSESSMENT_SUBMITTED`, capturing `officerUid`, `officerRole`, and timestamp.
