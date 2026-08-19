-- Migration 006: Ensure GIST Spatial Performance Indexes

CREATE INDEX IF NOT EXISTS idx_cadastral_lot_geom_gist ON cadastral_lot USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_rtd_zone_geom_gist ON rtd_zone USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_planning_feature_geom_gist ON planning_feature USING GIST(geometry);
