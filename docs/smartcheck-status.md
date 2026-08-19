# SmartCheck Status Taxonomy & Mapping

## 1. Individual Rule Compliance Statuses

| Status Code | Bahasa Melayu | Icon | Description |
|---|---|---|---|
| `COMPLIANT` | **PATUH** | ✓ | Project fact satisfies the rule threshold or condition. |
| `NON_COMPLIANT` | **TIDAK PATUH** | ✕ | Project fact violates the rule requirements. |
| `REQUIRES_REVIEW` | **PERLU PENGESAHAN** | ! | Conditional land use or fact conflict requiring human officer review. |
| `NOT_APPLICABLE` | **TIDAK BERKENAAN** | — | Rule does not apply to this proposal type. |
| `INSUFFICIENT_DATA` | **MAKLUMAT TIDAK MENCUKUPI** | ? | Required fact is missing from LCP or spatial records. |
| `ERROR` | **RALAT SEMAKAN** | ⚠ | Technical execution error during rule evaluation. |

## 2. Overall Pre-check Statuses (Non-Statutory)

| Status Code | User-Facing Text | Description |
|---|---|---|
| `PASS_PRECHECK` | **PRA-SEMAKAN MEMATUHI KRITERIA AUTOMATIK** | All applicable automated rules are compliant. |
| `REVISION_REQUIRED` | **PERLU PINDAAN** | One or more rules are non-compliant. |
| `OFFICER_REVIEW_REQUIRED` | **SEMAKAN PEGAWAI DIPERLUKAN** | One or more rules require officer verification. |
| `INSUFFICIENT_DATA` | **MAKLUMAT TIDAK MENCUKUPI** | Missing critical planning facts. |
| `PROCESSING_ERROR` | **RALAT PEMPROSESAN** | Technical error encountered. |

> [!WARNING]
> **Statutory Notice:** Overall pre-check statuses never constitute official approval (`LULUS KM`) or final statutory rejection (`TOLAK MUKTAMAD`). Official decisions remain strictly with the OSC Committee and authorized officers.
