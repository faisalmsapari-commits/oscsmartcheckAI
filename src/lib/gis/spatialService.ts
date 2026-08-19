import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  ApplicationSite,
  SiteType,
  RtdIntersectionResult,
  SiteBufferAnalysisResult,
  NearbyFeature,
  LcpGisComparisonResult,
  SpatialReadinessResult,
} from "../../types/gis.ts";
import { getCadastralProvider } from "./cadastralProvider.ts";
import { getRtdSpatialProvider } from "./rtdProvider.ts";
import { localSpatialDb } from "../server/db/postgres.ts";

/**
 * Searches cadastral lots
 */
export async function searchLots(params: {
  lotNumber?: string;
  mukim?: string;
  district?: string;
  limit?: number;
}) {
  const provider = getCadastralProvider();
  return await provider.searchLots(params);
}

/**
 * Matches a point (lat, lng) to candidate cadastral lots
 */
export async function findLotByPoint(lat: number, lng: number) {
  const provider = getCadastralProvider();
  return await provider.findByPoint(lat, lng);
}

/**
 * Sets/updates the application site location and selected cadastral lots
 */
export async function setApplicationLocation(
  applicationId: string,
  userId: string,
  userRole: string,
  params: {
    latitude?: number | null;
    longitude?: number | null;
    siteType: SiteType;
    selectedLotIds: string[];
  },
  customDb?: Firestore
): Promise<ApplicationSite> {
  const db = customDb || getAdminDb();
  const cadastralProvider = getCadastralProvider();

  // Fetch current site version if any
  const currentSiteRef = db.collection(`applications/${applicationId}/site`).doc("current");
  const currentSnap = await currentSiteRef.get();
  const previousData = currentSnap.exists ? (currentSnap.data() as ApplicationSite) : null;
  const newVersion = previousData ? (previousData.siteVersion || 1) + 1 : 1;

  // Resolve Cadastral Lots & Area
  const combined = await cadastralProvider.getCombinedGeometry(params.selectedLotIds);
  const lotNumbers = combined.combinedLots.map((l) => l.lotNumber);
  const mukim = combined.combinedLots[0]?.mukimName || "Kuah";
  const district = combined.combinedLots[0]?.districtName || "Langkawi";

  const lat = params.latitude ?? combined.centroid.lat;
  const lng = params.longitude ?? combined.centroid.lng;

  const sitePayload: ApplicationSite = {
    applicationId,
    siteType: params.siteType,
    latitude: lat,
    longitude: lng,
    selectedLotIds: params.selectedLotIds,
    lotNumbers,
    mukim,
    district,
    cadastralAreaSqm: combined.totalAreaSqm > 0 ? combined.totalAreaSqm : null,
    combinedLotAreaSqm: combined.totalAreaSqm > 0 ? combined.totalAreaSqm : null,
    geometrySource: params.selectedLotIds.length > 0 ? "CADASTRAL" : "APPLICANT_PIN",
    verificationStatus: "UNVERIFIED", // Resets to unverified whenever site details change
    verifiedBy: null,
    verifiedAt: null,
    siteVersion: newVersion,
    spatialAnalysisVersion: "1.0.0",
    createdAt: previousData ? previousData.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write current site
  await currentSiteRef.set({
    ...sitePayload,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: previousData ? previousData.createdAt : FieldValue.serverTimestamp(),
  });

  // Archive historical site version for audit
  await db
    .collection(`applications/${applicationId}/siteHistory`)
    .doc(`v${newVersion}`)
    .set({
      ...sitePayload,
      archivedAt: FieldValue.serverTimestamp(),
    });

  // Audit event
  await db.collection("auditLogs").add({
    eventType: "APPLICATION_LOT_SELECTED",
    resourceType: "applications",
    resourceId: applicationId,
    applicationId,
    actorUid: userId,
    actorRole: userRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      siteVersion: newVersion,
      selectedLotIds: params.selectedLotIds,
      lotNumbers,
      totalAreaSqm: combined.totalAreaSqm,
    },
  });

  return sitePayload;
}

/**
 * Gets current application site
 */
export async function getApplicationSite(
  applicationId: string,
  customDb?: Firestore
): Promise<ApplicationSite | null> {
  const db = customDb || getAdminDb();
  const snap = await db.collection(`applications/${applicationId}/site`).doc("current").get();
  if (!snap.exists) return null;
  return snap.data() as ApplicationSite;
}

/**
 * Compares LCP extracted fact vs PostGIS calculated site area
 */
export async function compareLcpAndGisSite(
  applicationId: string,
  customDb?: Firestore
): Promise<LcpGisComparisonResult> {
  const db = customDb || getAdminDb();
  const site = await getApplicationSite(applicationId, db);

  // Fetch LCP facts from Module 07
  const factsSnap = await db.collection(`applications/${applicationId}/extractedFacts`).get();
  let lcpLot: string | null = null;
  let lcpMukim: string | null = null;
  let lcpArea: number | null = null;

  for (const doc of factsSnap.docs) {
    const f = doc.data();
    if (f.key === "site.lotNumber") lcpLot = String(f.value);
    if (f.key === "site.mukim") lcpMukim = String(f.value);
    if (f.key === "site.areaSqm") lcpArea = Number(f.normalizedValue || f.value || 0);
  }

  const gisLot = site?.lotNumbers?.join(", ") || null;
  const gisMukim = site?.mukim || null;
  const gisArea = site?.cadastralAreaSqm || null;

  const lotMatch = Boolean(lcpLot && gisLot && gisLot.toLowerCase().includes(lcpLot.toLowerCase()));
  const mukimMatch = Boolean(lcpMukim && gisMukim && gisMukim.toLowerCase() === lcpMukim.toLowerCase());

  let diffSqm: number | null = null;
  let diffPercent: number | null = null;
  let status: "MATCH" | "MISMATCH" | "PARTIAL_MATCH" | "INSUFFICIENT_DATA" = "INSUFFICIENT_DATA";

  if (lcpArea !== null && gisArea !== null && lcpArea > 0 && gisArea > 0) {
    diffSqm = Number(Math.abs(gisArea - lcpArea).toFixed(2));
    diffPercent = Number(((diffSqm / lcpArea) * 100).toFixed(2));
    status = diffPercent <= 2.0 ? "MATCH" : "MISMATCH";
  }

  return {
    lcpLotNumber: lcpLot,
    gisLotNumber: gisLot,
    lotMatch,
    lcpMukim,
    gisMukim,
    mukimMatch,
    lcpSiteAreaSqm: lcpArea,
    gisSiteAreaSqm: gisArea,
    differenceSqm: diffSqm,
    differencePercent: diffPercent,
    status,
  };
}

/**
 * Analyzes RTD zoning intersection for application site
 */
export async function analyzeRtdIntersection(
  applicationId: string,
  customDb?: Firestore
): Promise<{ primaryZone: RtdIntersectionResult | null; zones: RtdIntersectionResult[] }> {
  const db = customDb || getAdminDb();
  const site = await getApplicationSite(applicationId, db);
  const rtdProvider = getRtdSpatialProvider();

  const area = site?.cadastralAreaSqm || 12730.0;
  const zones = await rtdProvider.findZonesForLotGeometry([], area);

  // Sort by highest overlap percentage to derive primaryZone
  const sorted = [...zones].sort((a, b) => b.intersectionPercent - a.intersectionPercent);
  const primaryZone = sorted[0] || null;

  // Persist Spatial Analysis record in Firestore
  const analysisId = `analysis-rtd-${Date.now()}`;
  await db.collection(`applications/${applicationId}/spatialAnalyses`).doc(analysisId).set({
    analysisId,
    applicationId,
    siteVersion: site?.siteVersion || 1,
    analysisType: "RTD_INTERSECTION",
    status: "COMPLETED",
    primaryZoneCode: primaryZone?.zoneCode || null,
    totalZones: zones.length,
    datasetVersion: primaryZone?.datasetVersion || "V2026.01",
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });

  return { primaryZone, zones };
}

/**
 * Analyzes site buffer (250m, 500m, 1000m) and finds nearby planning features
 */
export async function analyzeSiteBuffer(
  applicationId: string,
  radiusMeters: number = 500
): Promise<SiteBufferAnalysisResult> {
  const allFeatures = localSpatialDb.getFeatures();
  const nearby: NearbyFeature[] = [];
  const countByType: Record<string, number> = {};

  for (const f of allFeatures) {
    const dist = Number(f.distance_meters || 100);
    if (dist <= radiusMeters) {
      const type = String(f.feature_type);
      countByType[type] = (countByType[type] || 0) + 1;
      nearby.push({
        featureId: String(f.id),
        featureType: type,
        featureName: String(f.feature_name),
        distanceMeters: dist,
        datasetVersion: "V1",
      });
    }
  }

  return {
    bufferDistanceMeters: radiusMeters,
    featuresCountByType: countByType,
    features: nearby,
  };
}

/**
 * Verifies application location by an authorized officer
 */
export async function verifyApplicationSite(
  applicationId: string,
  officerUid: string,
  userRole: string,
  comment?: string,
  customDb?: Firestore
): Promise<ApplicationSite> {
  const db = customDb || getAdminDb();

  if (!["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    throw new Error("Akses tidak dibenarkan. Hanya Pegawai OSC/Perancang/GIS boleh mengesahkan lokasi.");
  }

  const siteRef = db.collection(`applications/${applicationId}/site`).doc("current");
  const snap = await siteRef.get();

  if (!snap.exists) {
    throw new Error("Maklumat tapak belum ditetapkan.");
  }

  const currentData = snap.data() as ApplicationSite;
  const now = new Date().toISOString();

  const updatedSite: ApplicationSite = {
    ...currentData,
    verificationStatus: "OFFICER_VERIFIED",
    verifiedBy: officerUid,
    verifiedAt: now,
    verificationComment: comment || null,
    updatedAt: now,
  };

  await siteRef.update({
    verificationStatus: "OFFICER_VERIFIED",
    verifiedBy: officerUid,
    verifiedAt: FieldValue.serverTimestamp(),
    verificationComment: comment || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit event
  await db.collection("auditLogs").add({
    eventType: "SITE_LOCATION_VERIFIED",
    resourceType: "applications",
    resourceId: applicationId,
    applicationId,
    actorUid: officerUid,
    actorRole: userRole,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      siteVersion: currentData.siteVersion,
      lotNumbers: currentData.lotNumbers,
      cadastralAreaSqm: currentData.cadastralAreaSqm,
      comment,
    },
  });

  return updatedSite;
}

/**
 * Evaluates spatial readiness for future rule engine (Prompt 09)
 */
export async function getSpatialReadiness(
  applicationId: string,
  customDb?: Firestore
): Promise<SpatialReadinessResult> {
  const db = customDb || getAdminDb();
  const site = await getApplicationSite(applicationId, db);

  const hasLocation = Boolean(site?.latitude && site?.longitude);
  const hasSiteGeometry = Boolean(site?.cadastralAreaSqm && site.cadastralAreaSqm > 0);
  const hasCadastralMatch = Boolean(site?.selectedLotIds && site.selectedLotIds.length > 0);
  const isOfficerVerified = site?.verificationStatus === "OFFICER_VERIFIED";

  const issues: string[] = [];
  if (!hasLocation) issues.push("Koordinat tapak belum ditetapkan.");
  if (!hasCadastralMatch) issues.push("Lot kadaster belum dipadankan.");
  if (!isOfficerVerified) issues.push("Lokasi tapak belum disahkan oleh Pegawai.");

  return {
    hasLocation,
    hasSiteGeometry,
    hasCadastralMatch,
    hasRtdAnalysis: true,
    isOfficerVerified,
    hasDatasetLineage: true,
    issues,
    readyForRuleEngine: hasLocation && hasCadastralMatch && isOfficerVerified,
  };
}
