# AI Governance & Mandatory Human Verification

## 1. Statutory Governance Directive

- **100% Human Verification Requirement:** AI assistants may only propose draft comments. An official planning comment or final report cannot be published without explicit sign-off by a verified OSC/Planning officer (`verifiedBy != SYSTEM`).
- **Governance Breach Alert:** The aggregation engine monitors published records. If `verifiedWithoutHumanCount > 0`, a `CRITICAL` operational alert (`COMMENT_VERIFICATION_GOVERNANCE`) is triggered immediately.
- **Rule Evidence Provenance:** Every SmartCheck decision must be deterministically linked to a statutory guideline clause, threshold formula, and factual input citation.
