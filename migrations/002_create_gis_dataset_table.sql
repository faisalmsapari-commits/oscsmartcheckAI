-- Migration 002: Create GIS Dataset Registry Table
-- Manages authoritative GIS dataset version lineage and source metadata

CREATE TABLE IF NOT EXISTS gis_dataset (
    id VARCHAR(64) PRIMARY KEY,
    dataset_code VARCHAR(64) NOT NULL,
    dataset_name VARCHAR(255) NOT NULL,
    dataset_type VARCHAR(32) NOT NULL, -- CADASTRAL, RTD_ZONING, ROAD, FACILITY, OPEN_SPACE, ENVIRONMENT, ADMIN_BOUNDARY, OTHER
    source_agency VARCHAR(128) NOT NULL, -- MPLBP, JUPEM, PLANMalaysia, etc.
    source_reference VARCHAR(128),
    version VARCHAR(32) NOT NULL,
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, SUPERSEDED, ARCHIVED
    source_crs VARCHAR(32) NOT NULL DEFAULT 'EPSG:4326',
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_by VARCHAR(64) NOT NULL,
    checksum VARCHAR(64),
    feature_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gis_dataset_code_version UNIQUE (dataset_code, version)
);

CREATE INDEX IF NOT EXISTS idx_gis_dataset_type_status ON gis_dataset(dataset_type, status);
CREATE INDEX IF NOT EXISTS idx_gis_dataset_effective ON gis_dataset(effective_from, effective_to);
