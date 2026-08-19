import type { CadastralLot } from "../../types/gis.ts";
import { queryPostgis, localSpatialDb } from "../server/db/postgres.ts";

export interface LotSearchParams {
  lotNumber?: string;
  mukim?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  limit?: number;
}

export interface CadastralProvider {
  searchLots(params: LotSearchParams): Promise<CadastralLot[]>;
  findByPoint(
    lat: number,
    lng: number
  ): Promise<{
    status: "MATCHED" | "MULTIPLE_CANDIDATES" | "NO_MATCH";
    lots: CadastralLot[];
  }>;
  getLot(id: string): Promise<CadastralLot | null>;
  getLotsByIds(ids: string[]): Promise<CadastralLot[]>;
  getCombinedGeometry(
    lotIds: string[]
  ): Promise<{
    totalAreaSqm: number;
    combinedLots: CadastralLot[];
    centroid: { lat: number; lng: number };
  }>;
}

/**
 * PostGIS Cadastral Provider Implementation
 */
export class PostGISCadastralProvider implements CadastralProvider {
  async searchLots(params: LotSearchParams): Promise<CadastralLot[]> {
    const lotNumber = params.lotNumber ? params.lotNumber.trim() : "";
    const mukim = params.mukim ? params.mukim.trim() : "";

    // Parameterized PostGIS query
    const query = `
      SELECT id, dataset_id, external_lot_id, lot_number, mukim_code, mukim_name,
             district_code, district_name, state_code, state_name, title_number,
             land_area_sqm, source_geometry_area_sqm, coordinates, centroid_lat, centroid_lng
      FROM cadastral_lot
      WHERE ($1 = '' OR lot_number ILIKE '%' || $1 || '%')
        AND ($2 = '' OR mukim_name ILIKE '%' || $2 || '%')
      LIMIT $3;
    `;

    const res = await queryPostgis(query, [lotNumber, mukim, params.limit || 20]);
    return res.rows.map((row) => this.mapRowToLot(row));
  }

  async findByPoint(
    lat: number,
    lng: number
  ): Promise<{
    status: "MATCHED" | "MULTIPLE_CANDIDATES" | "NO_MATCH";
    lots: CadastralLot[];
  }> {
    const allLots = localSpatialDb.getLots();
    const matched = allLots.filter((lot) => {
      const coords = (lot.coordinates as number[][]) || [];
      if (coords.length === 0) return false;

      // Simple Point-in-polygon bounding algorithm
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });

    const mapped = matched.map((r) => this.mapRowToLot(r));

    if (mapped.length === 1) {
      return { status: "MATCHED", lots: mapped };
    }
    if (mapped.length > 1) {
      return { status: "MULTIPLE_CANDIDATES", lots: mapped };
    }
    return { status: "NO_MATCH", lots: [] };
  }

  async getLot(id: string): Promise<CadastralLot | null> {
    const lot = localSpatialDb.getLot(id);
    if (!lot) return null;
    return this.mapRowToLot(lot);
  }

  async getLotsByIds(ids: string[]): Promise<CadastralLot[]> {
    const results: CadastralLot[] = [];
    for (const id of ids) {
      const lot = await this.getLot(id);
      if (lot) results.push(lot);
    }
    return results;
  }

  async getCombinedGeometry(
    lotIds: string[]
  ): Promise<{
    totalAreaSqm: number;
    combinedLots: CadastralLot[];
    centroid: { lat: number; lng: number };
  }> {
    const lots = await this.getLotsByIds(lotIds);
    if (lots.length === 0) {
      return {
        totalAreaSqm: 0,
        combinedLots: [],
        centroid: { lat: 6.33, lng: 99.85 },
      };
    }

    const totalAreaSqm = lots.reduce((acc, lot) => acc + (lot.landAreaSqm || 0), 0);
    const avgLat = lots.reduce((acc, lot) => acc + (lot.centroidLat || 6.33), 0) / lots.length;
    const avgLng = lots.reduce((acc, lot) => acc + (lot.centroidLng || 99.85), 0) / lots.length;

    return {
      totalAreaSqm: Number(totalAreaSqm.toFixed(2)),
      combinedLots: lots,
      centroid: { lat: avgLat, lng: avgLng },
    };
  }

  private mapRowToLot(row: Record<string, unknown>): CadastralLot {
    return {
      id: String(row.id),
      datasetId: String(row.dataset_id || ""),
      externalLotId: row.external_lot_id ? String(row.external_lot_id) : null,
      lotNumber: String(row.lot_number),
      mukimCode: String(row.mukim_code || "01"),
      mukimName: String(row.mukim_name || "Kuah"),
      districtCode: String(row.district_code || "01"),
      districtName: String(row.district_name || "Langkawi"),
      stateCode: String(row.state_code || "02"),
      stateName: String(row.state_name || "Kedah"),
      titleNumber: row.title_number ? String(row.title_number) : null,
      landAreaSqm: Number(row.land_area_sqm || 0),
      sourceGeometryAreaSqm: Number(row.source_geometry_area_sqm || row.land_area_sqm || 0),
      centroidLat: row.centroid_lat !== undefined ? Number(row.centroid_lat) : 6.33,
      centroidLng: row.centroid_lng !== undefined ? Number(row.centroid_lng) : 99.85,
      coordinates: (row.coordinates as number[][]) || [],
    };
  }
}

export function getCadastralProvider(): CadastralProvider {
  return new PostGISCadastralProvider();
}
