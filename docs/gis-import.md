# GIS Data Import & Geometry Validation Pipeline

## 1. Import Workflow
1. **Upload**: Administrator uploads GeoJSON / GeoPackage / Shapefile via `/admin/gis`.
2. **CRS Detection**: Validates specified coordinate reference system against spatial authority standards.
3. **Geometry Validation**: Runs `ST_IsValid()` to ensure all polygons are topologically sound.
4. **Staging & Review**: Ingests into staging schema and calculates feature count.
5. **Publish**: GIS Officer publishes dataset, setting status to `ACTIVE` and marking previous versions as `SUPERSEDED`.

## 2. Geometry Simplification
For web browser map rendering, geometry simplification (`ST_SimplifyPreserveTopology`) is applied dynamically to optimize network payloads while preserving full polygon fidelity in PostGIS for accurate area and intersection calculations.
