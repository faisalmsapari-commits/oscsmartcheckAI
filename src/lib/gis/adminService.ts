import type { GisDataset, DatasetType } from "../../types/gis.ts";
import { localSpatialDb } from "../server/db/postgres.ts";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export interface CreateDatasetParams {
  datasetCode: string;
  datasetName: string;
  datasetType: DatasetType;
  sourceAgency: string;
  sourceReference?: string | null;
  version: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  sourceCrs?: string;
  notes?: string | null;
  importedBy: string;
}

export async function createDataset(
  params: CreateDatasetParams,
  customDb?: Firestore
): Promise<GisDataset> {
  const id = `ds-${params.datasetType.toLowerCase()}-${Date.now()}`;
  const now = new Date().toISOString();

  const dataset: GisDataset = {
    id,
    datasetCode: params.datasetCode,
    datasetName: params.datasetName,
    datasetType: params.datasetType,
    sourceAgency: params.sourceAgency,
    sourceReference: params.sourceReference || null,
    version: params.version,
    effectiveFrom: params.effectiveFrom || null,
    effectiveTo: params.effectiveTo || null,
    status: "DRAFT",
    sourceCrs: params.sourceCrs || "EPSG:4326",
    importedAt: now,
    importedBy: params.importedBy,
    featureCount: 0,
    notes: params.notes || null,
  };

  localSpatialDb.setDataset(dataset as unknown as Record<string, unknown>);

  // Audit log
  if (customDb || process.env.NODE_ENV !== "test") {
    try {
      const db = customDb || getAdminDb();
      await db.collection("auditLogs").add({
        eventType: "GIS_DATASET_IMPORTED",
        resourceType: "gisDatasets",
        resourceId: id,
        actorUid: params.importedBy,
        actorRole: "GIS_OFFICER",
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          datasetCode: params.datasetCode,
          version: params.version,
          datasetType: params.datasetType,
        },
      });
    } catch {
      // Graceful fallback in unit test without credentials
    }
  }

  return dataset;
}

export async function publishDataset(
  datasetId: string,
  officerUid: string,
  customDb?: Firestore
): Promise<GisDataset> {
  const dataset = localSpatialDb.getDataset(datasetId) as unknown as GisDataset | null;
  if (!dataset) {
    throw new Error("Set data GIS tidak dijumpai.");
  }

  // If there's an existing ACTIVE dataset of the same type and code, mark it SUPERSEDED
  const allDatasets = localSpatialDb.getDatasets() as unknown as GisDataset[];
  for (const ds of allDatasets) {
    if (ds.datasetCode === dataset.datasetCode && ds.status === "ACTIVE" && ds.id !== datasetId) {
      ds.status = "SUPERSEDED";
      localSpatialDb.setDataset(ds as unknown as Record<string, unknown>);
    }
  }

  dataset.status = "ACTIVE";
  localSpatialDb.setDataset(dataset as unknown as Record<string, unknown>);

  if (customDb || process.env.NODE_ENV !== "test") {
    try {
      const db = customDb || getAdminDb();
      await db.collection("auditLogs").add({
        eventType: "GIS_DATASET_PUBLISHED",
        resourceType: "gisDatasets",
        resourceId: datasetId,
        actorUid: officerUid,
        actorRole: "GIS_OFFICER",
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          datasetCode: dataset.datasetCode,
          version: dataset.version,
        },
      });
    } catch {
      // Graceful fallback in unit test without credentials
    }
  }

  return dataset;
}

export async function getDatasets(): Promise<GisDataset[]> {
  const datasets = localSpatialDb.getDatasets() as unknown as GisDataset[];
  return datasets;
}
