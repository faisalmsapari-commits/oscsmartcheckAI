-- Migration 001: Enable PostGIS Extension
-- Database: PostgreSQL + PostGIS (Cloud SQL / Local Dev)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
