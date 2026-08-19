import type { Timestamp } from "firebase/firestore";

export type DatasetType =
  | "CADASTRAL"
  | "RTD_ZONING"
  | "ROAD"
  | "FACILITY"
  | "OPEN_SPACE"
  | "ENVIRONMENT"
  | "ADMIN_BOUNDARY"
  | "OTHER";

export type DatasetStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";

export interface GisDataset {
  id: string;
  datasetCode: string;
  datasetName: string;
  datasetType: DatasetType;
  sourceAgency: string;
  sourceReference: string | null;
  version: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: DatasetStatus;
  sourceCrs: string;
  importedAt: string;
  importedBy: string;
  featureCount: number;
  notes?: string | null;
}

export interface CadastralLot {
  id: string;
  datasetId: string;
  externalLotId?: string | null;
  lotNumber: string;
  mukimCode: string;
  mukimName: string;
  districtCode?: string;
  districtName: string;
  stateCode?: string;
  stateName?: string;
  titleNumber?: string | null;
  landAreaSqm: number;
  sourceGeometryAreaSqm: number;
  centroidLat?: number;
  centroidLng?: number;
  coordinates: number[][]; // GeoJSON format: [[lng, lat], ...]
}

export interface RtdZone {
  id: string;
  datasetId: string;
  zoneCode: string;
  zoneName: string;
  zoneCategory: string;
  planningBlockCode?: string | null;
  planningBlockName?: string | null;
  subzoneCode?: string | null;
  description?: string | null;
  coordinates: number[][];
}

export type FeatureType =
  | "ROAD"
  | "SCHOOL"
  | "MOSQUE"
  | "HOSPITAL"
  | "PUBLIC_FACILITY"
  | "COMMERCIAL_AREA"
  | "HOTEL"
  | "TOURISM_AREA"
  | "BEACH"
  | "RIVER"
  | "OPEN_SPACE"
  | "HERITAGE"
  | "ENVIRONMENTALLY_SENSITIVE_AREA"
  | "UTILITY"
  | "OTHER";

export interface PlanningFeature {
  id: string;
  datasetId: string;
  featureType: FeatureType;
  featureCode?: string | null;
  featureName: string;
  distanceMeters?: number;
  lat: number;
  lng: number;
}

export type SiteType = "POINT_ONLY" | "SINGLE_LOT" | "MULTIPLE_LOTS" | "CUSTOM_POLYGON";

export type GeometrySource = "CADASTRAL" | "APPLICANT_PIN" | "OFFICER_DRAWN" | "IMPORTED" | "OTHER";

export type LocationVerificationStatus =
  | "UNVERIFIED"
  | "SYSTEM_MATCHED"
  | "OFFICER_VERIFIED"
  | "REQUIRES_REVIEW";

/**
 * Application Site Model
 * Stored at: applications/{applicationId}/site/current
 */
export interface ApplicationSite {
  id?: string;
  applicationId: string;
  siteType: SiteType;
  latitude: number | null;
  longitude: number | null;
  selectedLotIds: string[];
  lotNumbers: string[];
  mukim: string;
  district: string;
  cadastralAreaSqm: number | null;
  combinedLotAreaSqm: number | null;
  geometrySource: GeometrySource;
  verificationStatus: LocationVerificationStatus;
  verifiedBy: string | null;
  verifiedAt: Timestamp | string | null;
  verificationComment?: string | null;
  siteVersion: number;
  spatialAnalysisVersion: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface RtdIntersectionResult {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  zoneCategory: string;
  intersectionAreaSqm: number;
  intersectionPercent: number;
  datasetVersion: string;
}

export interface NearbyFeature {
  featureId: string;
  featureType: string;
  featureName: string;
  distanceMeters: number;
  datasetVersion: string;
}

export interface SiteBufferAnalysisResult {
  bufferDistanceMeters: number;
  featuresCountByType: Record<string, number>;
  features: NearbyFeature[];
}

export interface LcpGisComparisonResult {
  lcpLotNumber: string | null;
  gisLotNumber: string | null;
  lotMatch: boolean;
  lcpMukim: string | null;
  gisMukim: string | null;
  mukimMatch: boolean;
  lcpSiteAreaSqm: number | null;
  gisSiteAreaSqm: number | null;
  differenceSqm: number | null;
  differencePercent: number | null;
  status: "MATCH" | "MISMATCH" | "PARTIAL_MATCH" | "INSUFFICIENT_DATA";
}

/**
 * Spatial Fact Entity
 * applications/{applicationId}/spatialFacts/{factId}
 */
export interface SpatialFact {
  id?: string;
  factId: string;
  applicationId: string;
  key: string;
  value: unknown;
  unit: string | null;
  sourceDatasetId: string;
  sourceDatasetVersion: string;
  analysisId: string;
  verificationStatus: LocationVerificationStatus;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface SpatialReadinessResult {
  hasLocation: boolean;
  hasSiteGeometry: boolean;
  hasCadastralMatch: boolean;
  hasRtdAnalysis: boolean;
  isOfficerVerified: boolean;
  hasDatasetLineage: boolean;
  issues: string[];
  readyForRuleEngine: boolean; // Informational signal for Prompt 09
}

export type LayoutElementCategory =
  | "BUILDING_BLOCK"
  | "ROAD"
  | "OPEN_SPACE"
  | "PARKING"
  | "UTILITY"
  | "SETBACK";

export interface LayoutPlanElement {
  id: string;
  name: string;
  category: LayoutElementCategory;
  label: string;
  color: string;
  fillColor: string;
  fillOpacity: number;
  coordinates: [number, number][]; // [lat, lng]
  areaSqm?: number;
  details?: string;
  unitCount?: number;
  heightStoreys?: number;
}

export interface ApplicationLayoutPlan {
  applicationId: string;
  planName: string;
  drawingNumber: string;
  scale: string;
  architectName?: string;
  totalUnits?: number;
  totalFloors?: number;
  plotRatio?: number;
  siteCoveragePercent?: number;
  openSpacePercent?: number;
  openSpaceAreaSqm?: number;
  parkingBays?: {
    car: number;
    motorcycle: number;
    oku: number;
    loading: number;
  };
  elements: LayoutPlanElement[];
}
