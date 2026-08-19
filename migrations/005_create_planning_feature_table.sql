-- Migration 005: Create Planning Feature Table
-- Stores spatial features (roads, schools, mosques, utilities, environmentally sensitive areas)

CREATE TABLE IF NOT EXISTS planning_feature (
    id VARCHAR(64) PRIMARY KEY,
    dataset_id VARCHAR(64) NOT NULL REFERENCES gis_dataset(id) ON DELETE CASCADE,
    feature_type VARCHAR(64) NOT NULL, -- ROAD, SCHOOL, MOSQUE, HOSPITAL, PUBLIC_FACILITY, COMMERCIAL_AREA, HOTEL, TOURISM_AREA, BEACH, RIVER, OPEN_SPACE, HERITAGE, ENVIRONMENTALLY_SENSITIVE_AREA, UTILITY, OTHER
    feature_code VARCHAR(32),
    feature_name VARCHAR(128) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_feature_type ON planning_feature(feature_type);
CREATE INDEX IF NOT EXISTS idx_planning_feature_geom_gist ON planning_feature USING GIST(geometry);
