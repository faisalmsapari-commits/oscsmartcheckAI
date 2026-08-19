# SmartCheck Versioning & Freshness

## 1. Freshness Detection (`getSmartCheckFreshness()`)

When an applicant uploads a new LCP version (e.g. `v3`) or modifies cadastral lot selections:
- The system flags the existing SmartCheck as `STALE_INPUT_CHANGED`.
- A warning banner prompts the officer to trigger a new run.
- Existing SmartCheck snapshots remain untouched.

## 2. Historical Comparison (`compareSmartCheckRuns()`)

Officers can compare two runs (e.g. Run 1 vs Run 2):
- Categorizes changes into `RESOLVED`, `DEGRADED`, and `UNCHANGED`.
- Displays side-by-side values and differences.
