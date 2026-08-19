# Report Security & Access Control

## 1. Role-Based Access Control (RBAC)

- **APPLICANT:**
  - Can view and download published reports for their own application where `visibility == 'APPLICANT_VISIBLE'`.
  - Cannot generate reports, view internal reports, access audit manifests, or publish reports.
- **OSC_OFFICER / PLANNING_OFFICER:**
  - Can generate internal, applicant, and audit reports.
  - Can preview HTML/PDF reports.
  - Can publish and unpublish reports.
  - Can verify digital integrity.
- **ADMIN / SUPER_ADMIN:**
  - System administration and audit log oversight.

## 2. Privacy Filter Matrix

| Data Item | Internal Report | Applicant Report | Audit Package |
| :--- | :---: | :---: | :---: |
| Project Title & Site Lot | ✅ | ✅ | ✅ |
| Compliance Results | ✅ | ✅ | ✅ |
| Machine vs Officer Disagreement | ✅ | ❌ | ✅ |
| Internal Officer Notes | ✅ | ❌ | ✅ |
| Internal Hidden Issues | ✅ | ❌ | ✅ |
| Published Verified Comment | ✅ | ✅ | ✅ |
| Full Audit Event Timeline | ❌ | ❌ | ✅ |
| Personal Phone / NRIC | ❌ | ❌ | ❌ |
