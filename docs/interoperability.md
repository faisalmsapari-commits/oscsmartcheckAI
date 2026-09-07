# Architectural Design Note: National Systems Interoperability Framework

**Document Version:** 1.0.0  
**Status:** DRAFT / PLANNING ONLY (No live integration code executed)  
**Target Architecture:** KPKT OSC 3.0 Plus, e-Tanah (NRE/PTG), JUPEM NDCDB (Cadastral Feeds)  
**System:** OSC SmartCheck AI (Majlis Perbandaran Langkawi Bandar Pelancongan - MPLBP)  

---

## 1. Executive Summary

This design note outlines the strategic architecture for integrating **OSC SmartCheck AI** with Malaysia's core national land and municipal administration platforms:
1. **KPKT OSC 3.0 Plus System** (Kementerian Perumahan dan Kerajaan Tempatan)
2. **e-Tanah System** (Kementerian Sumber Asli dan Kelestarian Alam / NRE & Pejabat Tanah dan Galian - PTG)
3. **JUPEM eKadaster / NDCDB** (Jabatan Ukur dan Pemetaan Malaysia)

The objective is to enable seamless, bidirectional, zero-friction data exchange for Planning Permission applications (*Kebenaran Merancang - KM*), title verifications, spatial cadastral boundaries, and statutory agency review results while preserving deterministic rule enforcement and immutable auditability.

---

## 2. System Interoperability Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      OSC SmartCheck AI Platform                         │
│  (Next.js Core / Firebase Firestore / PostGIS / Gemini 1.5 Pro AI)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    Enterprise Integration Gateway
          (OAuth2 / SAML 2.0 / mTLS / JSON REST / WFS / WMS)
                                     │
   ┌─────────────────────────────────┼─────────────────────────────────┐
   │                                 │                                 │
┌──▼──────────────────────┐ ┌────────▼─────────────────┐ ┌─────────────▼───────────┐
│  KPKT OSC 3.0 Plus      │ │  e-Tanah (NRE / PTG)    │ │  JUPEM eKadaster / NDCDB  │
│  - KM Submissions Sync  │ │  - Lot Ownership Check  │ │  - WFS Cadastral Polygons │
│  - Status Webhooks      │ │  - Hakmilik Verification│ │  - Cassini-Soldner (3168) │
│  - Technical Reviews    │ │  - Syarat Nyata Status  │ │  - Spatial Delta Sync     │
└─────────────────────────┘ └─────────────────────────┘ └───────────────────────────┘
```

---

## 3. Integration Modules & Data Exchange Specifications

### 3.1 KPKT OSC 3.0 Plus Integration

#### 3.1.1 Purpose & Scope
Synchronize statutory Planning Permission (*Kebenaran Merancang - KM*) submission packages, technical agency comments, review deadlines, and formal approval decisions between the local authority portal (MPLBP) and the national KPKT OSC 3.0 Plus repository.

#### 3.1.2 Data Exchange Patterns
- **Protocol**: RESTful HTTPS API over JSON with HMAC-SHA256 signature headers.
- **Async Events / Webhooks**:
  - `evt.osc.application.submitted`: Ingests new KM submission from national portal.
  - `evt.osc.technical_comment.published`: Emits verified technical agency ulasan from SmartCheck AI back to OSC 3.0 Plus.
  - `evt.osc.decision.finalized`: Pushes statutory PBT Board decision and SmartCheck PDF compliance report.

#### 3.1.3 Data Mapping Schema (JSON Payload)
```json
{
  "transactionId": "TXN-OSC3-2026-08819",
  "nationalApplicationId": "KPKT/OSC/KM/2026/0491",
  "localApplicationId": "APP-2026-001",
  "localAuthorityCode": "MPLBP",
  "applicant": {
    "nricOrCompanyNo": "199401029384",
    "name": "Perunding Perancang Zul Sdn Bhd",
    "pspRegistrationNo": "LAM/P/04921"
  },
  "site": {
    "lotNumbers": ["Lot 1042", "Lot 1043"],
    "mukimCode": "KUAH",
    "districtCode": "LANGKAWI",
    "stateCode": "KEDAH"
  },
  "smartCheckResult": {
    "overallStatus": "PASSED_WITH_CONDITIONS",
    "reportHash": "a8f5f167f44f4964e6c998dee827110c",
    "reportUrl": "https://osc.mplbp.gov.my/api/applications/APP-2026-001/reports/rpt-2026-001/download"
  }
}
```

---

### 3.2 e-Tanah System Integration (NRE / PTG Kedah)

#### 3.2.1 Purpose & Scope
Verify land ownership, title status (*No. Hakmilik*), registered land use category (*Kategori Penggunaan Tanah*), express conditions (*Syarat Nyata*), and restriction in interest (*Sekatan Kepentingan*) directly against the authoritative State Land Registry (Pejabat Tanah dan Galian Kedah).

#### 3.2.2 Data Exchange Patterns
- **Protocol**: SOAP / Enterprise REST API via Government Private Network (MyGovNet) / Secure Gateway.
- **Authentication**: Mutual TLS (mTLS) with X.509 client certificates and OAuth2 Client Credentials.

#### 3.2.3 Automated Compliance Verifications
| SmartCheck Fact | e-Tanah Source Field | Automated Compliance Logic |
| :--- | :--- | :--- |
| `site.lotNumber` | `LOT_NO` | Match lot number and mukim against active Title record. |
| `site.landCategory` | `KATEGORI_TANAH` | Verify if application category matches registered land category (e.g. *Bangunan* vs *Pertanian*). |
| `site.ownershipStatus` | `SENARAI_PEMILIK` | Confirm applicant authorization or Power of Attorney (POA) registration. |
| `site.quitRentStatus` | `STATUS_CUKAI_TANAH` | Ensure quit rent (*Cukai Tanah*) is fully paid for current financial year before submission approval. |

---

### 3.3 JUPEM eKadaster / NDCDB Spatial Feeds

#### 3.3.1 Purpose & Scope
Ingest certified cadastral lot boundaries (*National Cadastral Database - NDCDB*) directly into PostGIS for spatial intersection analysis against Local Structure Plans (*Rancangan Tempatan Daerah - RTD Langkawi 2030*).

#### 3.3.2 Data Exchange Patterns
- **Protocol**: OGC Web Feature Service (WFS 2.0.0) / OGC Web Map Service (WMS 1.3.0) with GeoJSON / GML payload formats.
- **Coordinate Reference System (CRS) Conversion**:
  - **Source CRS**: `EPSG:3168` (Cassini-Soldner Kedah Grid).
  - **Internal PostGIS Storage**: `EPSG:3857` (Web Mercator) & `EPSG:4326` (WGS84) for web mapping rendering.

#### 3.3.3 Automated Delta Sync Workflow
1. Scheduled cron task triggers nightly `GET /wfs?request=GetFeature&typename=jupem:ndcdb_kedah&cql_filter=BBOX(...)`.
2. Compares feature modification timestamps (`LAST_UPDATED_DATE`).
3. Updates `spatial_cadastral_lots` table in PostGIS.
4. Triggers `reconcileSpatialFacts()` in OSC SmartCheck AI to flag any application sites with altered lot boundaries.

---

## 4. Security, Governance & Compliance Standards

1. **MyGovEA Compliance**: Aligned with Malaysian Public Sector Enterprise Architecture framework.
2. **Data Privacy & PDPA Safeguards**: Sensitive personal identity fields (NRIC, personal phone numbers, bank accounts) are masked via `maskSensitiveFields()` in observability logs prior to external transmission.
3. **Immutability & Non-Repudiation**: All outgoing data packages and reports include SHA-256 digital signatures signed by the issuing officer's credential.
4. **Audit Logging**: Every external API transaction emits an immutable record to the `auditLogs` collection in Cloud Firestore.

---

## 5. Implementation Roadmap (Phased Approach)

```text
Phase 3 (Current)    ──► Phase 4 (Sandbox Testing) ──► Phase 5 (Production Go-Live)
- Design Note           - API Gateway Staging           - Production mTLS Certs
- Schema Definition     - Mock Interop Feeds            - Live KPKT/e-Tanah Sync
- No Code Executed      - Security Audit                - 24/7 Monitoring
```
