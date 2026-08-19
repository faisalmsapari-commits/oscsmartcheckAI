-- Migration 004: Create RTD Zoning Table
-- Stores statutory local plan zoning polygons and categories

CREATE TABLE IF NOT EXISTS rtd_zone (
    id VARCHAR(64) PRIMARY KEY,
    dataset_id VARCHAR(64) NOT NULL REFERENCES gis_dataset(id) ON DELETE CASCADE,
    zone_code VARCHAR(32) NOT NULL, -- e.g. PERDAGANGAN, PERUMAHAN, INDUSTRI, PENGANGKUTAN, KAWASAN_LAPANG
    zone_name VARCHAR(128) NOT NULL,
    zone_category VARCHAR(64) NOT NULL,
    planning_block_code VARCHAR(32),
    planning_block_name VARCHAR(128),
    subzone_code VARCHAR(32),
    land_use_class VARCHAR(64),
    description TEXT,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    source_properties JSONB DEFAULT '{}'::jsonb,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rtd_zone_code ON rtd_zone(zone_code);
CREATE INDEX IF NOT EXISTS idx_rtd_zone_geom_gist ON rtd_zone USING GIST(geometry);
