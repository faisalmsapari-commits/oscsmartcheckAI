# Authoritative GIS Datasets & Lineage

## 1. Statutory Datasets
OSC SmartCheck AI operates on versioned government spatial datasets registered in the `gis_dataset` catalog:

1. **Cadastral Lots (`CADASTRAL`)**: Authoritative lot boundaries, lot numbers, mukim, land areas, and title details sourced from JUPEM and MPLBP.
2. **RTD Local Plan Zoning (`RTD_ZONING`)**: Statutory land use zoning from Rancangan Tempatan Daerah (RTD) Langkawi 2030 (Warta No. 123/2024).
3. **Roads & Reserves (`ROAD`)**: Road alignments, reserves, and road hierarchy.
4. **Public Facilities (`FACILITY`)**: Schools, mosques, hospitals, hotels, and tourist attractions.

## 2. Versioning Lifecycle
- `DRAFT`: Newly uploaded dataset pending topology validation.
- `ACTIVE`: Authoritative dataset version actively used in spatial analysis.
- `SUPERSEDED`: Replaced by a newer version; preserved for historical audit of past applications.
- `ARCHIVED`: Obsolete dataset preserved in cold storage.
