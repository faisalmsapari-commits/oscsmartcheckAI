import { z } from "zod";

export const ALLOWED_DATASET_TYPES = [
  "CADASTRAL",
  "RTD_ZONING",
  "ROAD",
  "FACILITY",
  "OPEN_SPACE",
  "ENVIRONMENT",
  "ADMIN_BOUNDARY",
  "OTHER",
] as const;

export const LotSearchRequestSchema = z.object({
  lotNumber: z.string().max(64).optional(),
  mukim: z.string().max(64).optional(),
  district: z.string().max(64).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().positive().max(50000).default(1000).optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
});

export const PointToLotRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const SetApplicationLocationRequestSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  siteType: z.enum(["POINT_ONLY", "SINGLE_LOT", "MULTIPLE_LOTS", "CUSTOM_POLYGON"]).default("SINGLE_LOT"),
  selectedLotIds: z.array(z.string()).default([]),
  customPolygonCoordinates: z.array(z.array(z.number())).optional(),
});

export const VerifyLocationRequestSchema = z.object({
  verificationComment: z.string().max(500).optional(),
});

export const GisDatasetImportSchema = z.object({
  datasetCode: z.string().min(3).max(64),
  datasetName: z.string().min(3).max(255),
  datasetType: z.enum(ALLOWED_DATASET_TYPES),
  sourceAgency: z.string().min(2).max(128),
  sourceReference: z.string().max(128).nullable().optional(),
  version: z.string().min(1).max(32),
  effectiveFrom: z.string().nullable().optional(),
  effectiveTo: z.string().nullable().optional(),
  sourceCrs: z.string().default("EPSG:4326"),
  notes: z.string().max(1000).nullable().optional(),
});
