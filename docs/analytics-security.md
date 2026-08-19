# Analytics Security & Role-Based Access Control

## 1. Access Control Policy

| Role | Access to `/management/*` | Access to `/admin/operations` | Data Export | Target Config |
| :--- | :---: | :---: | :---: | :---: |
| `APPLICANT` | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked | ❌ Blocked |
| `OSC_OFFICER` | ✅ Read-only | ❌ Blocked (403) | ✅ Privacy-filtered | ❌ Read-only |
| `PLANNING_OFFICER`| ✅ Read-only | ❌ Blocked (403) | ✅ Privacy-filtered | ❌ Read-only |
| `OSC_MANAGER` | ✅ Full Management | ❌ Blocked (403) | ✅ Privacy-filtered | ✅ Full Config |
| `PLANNING_MANAGER`| ✅ Full Management | ❌ Blocked (403) | ✅ Privacy-filtered | ✅ Full Config |
| `ADMIN` | ✅ Full Management | ✅ System Operations | ✅ Privacy-filtered | ✅ Full Config |
| `SUPER_ADMIN` | ✅ Full Management | ✅ System Operations | ✅ Full / Privacy | ✅ Full Config |

## 2. Privacy Projections & Data Export Safeguards

All exported CSV and JSON files are filtered server-side:
- Personal applicant identity (NRIC, personal phone number, bank accounts) is stripped.
- Spatial data is generalized to Mukim and RTD zoning classifications.
- Every export triggers an immutable `MANAGEMENT_DATA_EXPORTED` audit log.
