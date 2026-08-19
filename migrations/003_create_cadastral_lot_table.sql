-- Migration 003: Create Cadastral Lot Table
-- Stores authoritative cadastral geometry and metadata

CREATE TABLE IF NOT EXISTS cadastral_lot (
    id VARCHAR(64) PRIMARY KEY,
    dataset_id VARCHAR(64) NOT NULL REFERENCES gis_dataset(id) ON DELETE CASCADE,
    external_lot_id VARCHAR(64),
    lot_number VARCHAR(64) NOT NULL,
    mukim_code VARCHAR(32) NOT NULL,
    mukim_name VARCHAR(64) NOT NULL,
    district_code VARCHAR(32) NOT NULL DEFAULT '01',
    district_name VARCHAR(64) NOT NULL DEFAULT 'Langkawi',
    state_code VARCHAR(32) NOT NULL DEFAULT '02',
    state_name VARCHAR(64) NOT NULL DEFAULT 'Kedah',
    title_number VARCHAR(64),
    land_area_sqm NUMERIC(14, 2),
    source_geometry_area_sqm NUMERIC(14, 2),
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326),
    source_properties JSONB DEFAULT '{}'::jsonb,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cadastral_lot_composite ON cadastral_lot(lot_number, mukim_name, district_name);
CREATE INDEX IF NOT EXISTS idx_cadastral_lot_geom_gist ON cadastral_lot USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_cadastral_lot_centroid_gist ON cadastral_lot USING GIST(centroid);
