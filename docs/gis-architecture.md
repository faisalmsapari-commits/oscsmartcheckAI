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
