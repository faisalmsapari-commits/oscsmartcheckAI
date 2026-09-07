# GIS Architecture: Authoritative Spatial Foundation

## 1. Overview
OSC SmartCheck AI incorporates a robust, decoupled geospatial architecture that distinguishes between visual representation (Google Maps Basemap) and authoritative planning geometry (PostgreSQL + PostGIS).

## 2. Decoupled Pipeline

```text
Next.js Map UI (/applications/[id]/map)  <-- Google Maps Basemap (Visual Navigation)
        ↓
Authorized GIS API (/api/gis/...)
        ↓
Provider Abstraction Layer (CadastralProvider, RtdSpatialProvider)
        ↓
PostgreSQL + PostGIS (Authoritative Spatial Layers, Spatial Indexing, Intersections)
        ↓
Spatial Facts & Verification Metadata --> Cloud Firestore (applications/{id}/site/current)
        ↓
Officer Verification Workflow (OFFICER_VERIFIED)
```

## 3. Database Separation
- **Cloud Firestore**: Application workflow, selected lot identifiers, officer verification status, summary spatial facts, and audit logs. Large high-resolution polygon datasets are strictly prohibited in Firestore.
- **PostGIS**: Authoritative cadastral polygons, statutory RTD zoning polygons, planning control boundaries, road alignments, infrastructure points, and exact geometric intersection calculations.

## 4. Coordinate Reference System (CRS)
All spatial layers record `source_crs` upon import (e.g. `EPSG:3168` Cassini-Soldner Kedah, `EPSG:3857` Web Mercator, `EPSG:4326` WGS84). Web mapping APIs expose geometries normalized to WGS84 (`EPSG:4326`).

## 5. Write Path Hardening & Partial Failure Recovery

### 5.1 Idempotent Write Strategy
To prevent inconsistencies where PostGIS spatial computations succeed but Cloud Firestore document persistence fails or times out:
- Spatial facts calculated from PostGIS are wrapped in `saveSpatialFactsIdempotent()` in `src/lib/gis/spatialService.ts`.
- Exponential backoff retry logic is applied (up to 3 attempts with initial 150ms delay).
- Document keys use deterministic paths (`applications/{id}/site/current` and `applications/{id}/spatialAnalyses/analysis-rtd-{id}`) to prevent duplicate records upon retries.

### 5.2 Failure Scenarios & Mitigations
| Scenario | Risk | Mitigation |
| :--- | :--- | :--- |
| Network disconnect during Firestore write | Missing spatial facts in application record | `saveSpatialFactsIdempotent` retries write automatically up to 3 times with exponential backoff. |
| PostGIS query timeout | Unverified lot area in Firestore | Fallback to cached lot geometry or flag application site as `UNVERIFIED` for officer review. |
| Stale PostGIS layer updated after application submission | Outdated spatial facts in Firestore | Automated Reconciliation Check flags mismatched records for recalculation. |

## 6. Spatial Fact Reconciliation Endpoint

Administrative users and GIS Officers can execute automated reconciliation audits via `GET /api/admin/gis/reconciliation`.

### 6.1 Audit Process
1. Fetches application site state from Cloud Firestore (`applications/{id}/site/current`).
2. Re-computes combined cadastral geometry and total area directly from PostGIS via `CadastralProvider`.
3. Compares Firestore spatial facts (`cadastralAreaSqm`, `lotNumbers`) against authoritative PostGIS calculation.
4. Categorizes status:
   - **`SYNCED`**: Firestore area matches PostGIS calculation within $\le 0.1\text{ sqm}$.
   - **`STALE`**: Selected lot IDs missing or un-indexed in PostGIS layer.
   - **`MISMATCH`**: Discrepancy $> 0.1\text{ sqm}$ between Firestore and PostGIS facts.
   - **`MISSING`**: No site record configured in Cloud Firestore.

### 6.2 Example Response Shape
```json
{
  "timestamp": "2026-09-07T08:50:00.000Z",
  "totalChecked": 3,
  "syncedCount": 3,
  "discrepancyCount": 0,
  "results": [
    {
      "applicationId": "APP-2026-001",
      "status": "SYNCED",
      "firestoreAreaSqm": 12730.0,
      "postgisAreaSqm": 12730.0,
      "lotNumbers": ["Lot 1042", "Lot 1043"],
      "issues": [],
      "reconciledAt": "2026-09-07T08:50:00.000Z"
    }
  ]
}
```

