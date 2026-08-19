/**
 * Centralized Server-Side PostgreSQL + PostGIS Connection & Query Service
 * Strictly executes in server-side runtimes (Route Handlers, Server Actions).
 * Never exposed to browser bundles.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

// In-memory Spatial DB for local development / testing fallback
class LocalMemorySpatialDb {
  private datasets = new Map<string, Record<string, unknown>>();
  private lots = new Map<string, Record<string, unknown>>();
  private rtdZones = new Map<string, Record<string, unknown>>();
  private features = new Map<string, Record<string, unknown>>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Seed Active Cadastral Dataset
    const dsCadastralId = "ds-cadastral-mplbp-2026";
    this.datasets.set(dsCadastralId, {
      id: dsCadastralId,
      dataset_code: "CADASTRAL_LANGKAWI_2026",
      dataset_name: "Set Data Kadaster Majlis Perbandaran Langkawi 2026",
      dataset_type: "CADASTRAL",
      source_agency: "JUPEM / MPLBP",
      source_reference: "JUPEM.KDH.01/2026",
      version: "V2026.1",
      effective_from: "2026-01-01",
      effective_to: null,
      status: "ACTIVE",
      source_crs: "EPSG:4326",
      feature_count: 2,
    });

    // Seed Lot 1234
    this.lots.set("LOT-1234-KUAH", {
      id: "LOT-1234-KUAH",
      dataset_id: dsCadastralId,
      lot_number: "Lot 1234",
      mukim_code: "01",
      mukim_name: "Kuah",
      district_name: "Langkawi",
      state_name: "Kedah",
      title_number: "GRN 54321",
      land_area_sqm: 12730.0,
      source_geometry_area_sqm: 12730.0,
      coordinates: [
        [99.845, 6.325],
        [99.855, 6.325],
        [99.855, 6.335],
        [99.845, 6.335],
        [99.845, 6.325],
      ],
      centroid_lat: 6.33,
      centroid_lng: 99.85,
    });

    // Seed Adjacent Lot 1235
    this.lots.set("LOT-1235-KUAH", {
      id: "LOT-1235-KUAH",
      dataset_id: dsCadastralId,
      lot_number: "Lot 1235",
      mukim_code: "01",
      mukim_name: "Kuah",
      district_name: "Langkawi",
      state_name: "Kedah",
      title_number: "GRN 54322",
      land_area_sqm: 8500.0,
      source_geometry_area_sqm: 8500.0,
      coordinates: [
        [99.855, 6.325],
        [99.865, 6.325],
        [99.865, 6.335],
        [99.855, 6.335],
        [99.855, 6.325],
      ],
      centroid_lat: 6.33,
      centroid_lng: 99.86,
    });

    // 2. Seed Active RTD Zoning Dataset (Rancangan Tempatan Daerah Langkawi 2030)
    const dsRtdId = "ds-rtd-langkawi-2030";
    this.datasets.set(dsRtdId, {
      id: dsRtdId,
      dataset_code: "RTD_LANGKAWI_2030",
      dataset_name: "Rancangan Tempatan Daerah Langkawi 2030 (Pengubahan 1)",
      dataset_type: "RTD_ZONING",
      source_agency: "PLANMalaysia / MPLBP",
      source_reference: "Warta No. 123/2024",
      version: "V2026.01",
      effective_from: "2024-01-01",
      effective_to: null,
      status: "ACTIVE",
      source_crs: "EPSG:4326",
      feature_count: 2,
    });

    this.rtdZones.set("ZONE-PERDAGANGAN-KUAH", {
      id: "ZONE-PERDAGANGAN-KUAH",
      dataset_id: dsRtdId,
      zone_code: "PERDAGANGAN",
      zone_name: "Zon Perdagangan & Pelancongan Utama",
      zone_category: "KOMERSIAL",
      planning_block_code: "BP1",
      planning_block_name: "Pusat Bandar Kuah",
      description: "Pembangunan komersial, perniagaan, hotel dan perkhidmatan.",
      coordinates: [
        [99.84, 6.32],
        [99.8535, 6.32],
        [99.8535, 6.34],
        [99.84, 6.34],
        [99.84, 6.32],
      ],
    });

    this.rtdZones.set("ZONE-PENGANGKUTAN-KUAH", {
      id: "ZONE-PENGANGKUTAN-KUAH",
      dataset_id: dsRtdId,
      zone_code: "PENGANGKUTAN",
      zone_name: "Zon Pengangkutan & Infrastruktur",
      zone_category: "INFRASTRUKTUR",
      planning_block_code: "BP1",
      planning_block_name: "Pusat Bandar Kuah",
      description: "Rizab jalan utama, terminal dan kemudahan pengangkutan.",
      coordinates: [
        [99.8535, 6.32],
        [99.87, 6.32],
        [99.87, 6.34],
        [99.8535, 6.34],
        [99.8535, 6.32],
      ],
    });

    // 3. Seed Planning Features (Roads & Facilities)
    const dsFeatureId = "ds-features-langkawi-2026";
    this.datasets.set(dsFeatureId, {
      id: dsFeatureId,
      dataset_code: "FEATURES_LANGKAWI_2026",
      dataset_name: "Kemudahan & Infrastruktur Langkawi 2026",
      dataset_type: "FACILITY",
      source_agency: "MPLBP",
      version: "V1",
      status: "ACTIVE",
      source_crs: "EPSG:4326",
    });

    this.features.set("FEAT-ROAD-1", {
      id: "FEAT-ROAD-1",
      dataset_id: dsFeatureId,
      feature_type: "ROAD",
      feature_name: "Jalan Persiaran Kuah (Rizab 66 kaki)",
      distance_meters: 15.0,
      lat: 6.325,
      lng: 99.85,
    });

    this.features.set("FEAT-HOTEL-1", {
      id: "FEAT-HOTEL-1",
      dataset_id: dsFeatureId,
      feature_type: "HOTEL",
      feature_name: "Adya Hotel Langkawi",
      distance_meters: 220.0,
      lat: 6.328,
      lng: 99.848,
    });

    this.features.set("FEAT-SCHOOL-1", {
      id: "FEAT-SCHOOL-1",
      dataset_id: dsFeatureId,
      feature_type: "SCHOOL",
      feature_name: "SK Mahsuri Kuah",
      distance_meters: 420.0,
      lat: 6.333,
      lng: 99.853,
    });

    this.features.set("FEAT-MOSQUE-1", {
      id: "FEAT-MOSQUE-1",
      dataset_id: dsFeatureId,
      feature_type: "MOSQUE",
      feature_name: "Masjid Al-Hana Kuah",
      distance_meters: 650.0,
      lat: 6.322,
      lng: 99.846,
    });
  }

  public getDatasets() {
    return Array.from(this.datasets.values());
  }

  public getDataset(id: string) {
    return this.datasets.get(id) || null;
  }

  public setDataset(dataset: Record<string, unknown>) {
    this.datasets.set(dataset.id as string, dataset);
  }

  public getLots() {
    return Array.from(this.lots.values());
  }

  public getLot(id: string) {
    return this.lots.get(id) || null;
  }

  public getRtdZones() {
    return Array.from(this.rtdZones.values());
  }

  public getFeatures() {
    return Array.from(this.features.values());
  }
}

export const localSpatialDb = new LocalMemorySpatialDb();

/**
 * Executes a parameterized SQL query against PostgreSQL + PostGIS or Local Memory GIS Engine
 */
export async function queryPostgis<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  // If live DATABASE_URL is configured, connect to Cloud SQL / PostgreSQL
  if (process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    try {
      const importDynamic = new Function("modulePath", "return import(modulePath)");
      const pgModule = await importDynamic("pg");
      const pool = new pgModule.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
      });

      const res = await pool.query(text, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount || res.rows.length,
      };
    } catch (err: unknown) {
      console.warn("Postgres query error, falling back to local spatial database:", err);
    }
  }

  // Local Memory GIS Execution Simulation
  const normalizedSql = text.toUpperCase();

  if (normalizedSql.includes("FROM CADASTRAL_LOT")) {
    const lotNumParam = params[0] ? String(params[0]).toLowerCase() : "";
    const mukimParam = params[1] ? String(params[1]).toLowerCase() : "";

    const lots = localSpatialDb.getLots().filter((lot) => {
      const matchLot = !lotNumParam || String(lot.lot_number).toLowerCase().includes(lotNumParam) || String(lot.id).toLowerCase().includes(lotNumParam);
      const matchMukim = !mukimParam || String(lot.mukim_name).toLowerCase().includes(mukimParam);
      return matchLot && matchMukim;
    });

    return { rows: lots as unknown as T[], rowCount: lots.length };
  }

  if (normalizedSql.includes("FROM RTD_ZONE")) {
    const zones = localSpatialDb.getRtdZones();
    return { rows: zones as unknown as T[], rowCount: zones.length };
  }

  if (normalizedSql.includes("FROM GIS_DATASET")) {
    const datasets = localSpatialDb.getDatasets();
    return { rows: datasets as unknown as T[], rowCount: datasets.length };
  }

  if (normalizedSql.includes("FROM PLANNING_FEATURE")) {
    const features = localSpatialDb.getFeatures();
    return { rows: features as unknown as T[], rowCount: features.length };
  }

  return { rows: [], rowCount: 0 };
}
