# GIS Security & Access Control

## 1. Zero Direct Database Exposure
The browser client never connects directly to PostgreSQL / PostGIS. All spatial interactions traverse authenticated Next.js route handlers verified via Firebase Auth Custom Claims.

## 2. Parameterized Queries
All database operations utilize strict parameterized queries or object mapper methods, preventing SQL injection vulnerabilities.

## 3. Role-Based Permissions
- **APPLICANT**: Search lots, place pin, select lot for own application, view permitted layers.
- **OSC_OFFICER / PLANNING_OFFICER / GIS_OFFICER**: Verify site location, view cross-checks, inspect full GIS spatial facts.
- **GIS_OFFICER / ADMIN / SUPER_ADMIN**: Manage and publish authoritative GIS datasets.
