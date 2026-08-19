# Planning Rule Testing & Simulation

## 1. Test Fixture Sets (`OSC_SMARTCHECK_TEST_RULESET_V1`)

To prevent accidental production contamination, test rules are marked with `isTestOnly: true` and guarded:
- Evaluated in automated test suites (`tests/unit/planning-rule-engine.test.mjs`).
- Production evaluators filter out test fixtures unless explicitly requested in simulation environments.

## 2. Admin Simulation Engine (`simulateRule()`)

Authorized planning officers can test draft rules against simulated `PlanningDataContext` objects before approving:
- Tests min/max boundary conditions.
- Validates formula calculations.
- Verifies step-by-step arithmetic traces.
- Clearly marked with `SIMULATION ONLY`.
