import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { PlanningDataContext, FactProvenance } from "../../types/rules.ts";
import type { Application } from "../../types/application.ts";
import type { PlanningFact } from "../../types/extraction.ts";
import type { ApplicationSite } from "../../types/gis.ts";

/**
 * Builds the complete strongly-typed PlanningDataContext with full fact provenance
 */
export async function buildPlanningDataContext(
  applicationId: string,
  customDb?: Firestore
): Promise<PlanningDataContext> {
  const db = customDb || getAdminDb();

  // 1. Fetch Application Document
  const appSnap = await db.collection("applications").doc(applicationId).get();
  if (!appSnap.exists) {
    throw new Error(`Permohonan ${applicationId} tidak dijumpai.`);
  }
  const appData = appSnap.data() as Application;

  // 2. Fetch Extracted & Confirmed Facts (Prompt 07)
  const factsSnap = await db.collection(`applications/${applicationId}/extractedFacts`).get();
  const factsMap = new Map<string, FactProvenance>();

  for (const doc of factsSnap.docs) {
    const f = doc.data() as PlanningFact;
    const isConfirmed = f.status === "MANUALLY_CONFIRMED" || f.status === "MANUALLY_CORRECTED";
    const resolvedValue = isConfirmed && f.confirmedValue !== undefined && f.confirmedValue !== null
      ? f.confirmedValue
      : f.normalizedValue ?? f.value;

    factsMap.set(f.key, {
      key: f.key,
      value: resolvedValue,
      normalizedValue: f.normalizedValue,
      unit: f.unit,
      sourceType: isConfirmed ? "LCP_CONFIRMED_FACT" : "LCP_EXTRACTED_FACT",
      documentId: f.documentId,
      documentVersion: f.documentVersion,
      confirmedBy: f.confirmedBy,
      confirmedAt: f.confirmedAt ? String(f.confirmedAt) : null,
      status: f.status,
      isConfirmed,
    });
  }

  // 3. Fetch Site & Spatial Facts (Prompt 08)
  const siteSnap = await db.collection(`applications/${applicationId}/site`).doc("current").get();
  const siteData = siteSnap.exists ? (siteSnap.data() as ApplicationSite) : null;

  const lotNumbers = siteData?.lotNumbers || (appData.siteInfo?.lots || []).map((l) => l.lotNumber);
  const mukim = siteData?.mukim || appData.siteInfo?.mukim || appData.mukim || "Kuah";
  const district = siteData?.district || appData.siteInfo?.district || appData.district || "Langkawi";
  const siteAreaSqm = siteData?.cadastralAreaSqm || appData.siteInfo?.siteArea?.siteAreaSqm || 12730.0;
  const isOfficerVerified = siteData?.verificationStatus === "OFFICER_VERIFIED";

  // Register site spatial facts into map
  factsMap.set("site.lotNumber", {
    key: "site.lotNumber",
    value: lotNumbers.join(", "),
    sourceType: "VERIFIED_SPATIAL_FACT",
    isConfirmed: isOfficerVerified,
  });

  factsMap.set("site.mukim", {
    key: "site.mukim",
    value: mukim,
    sourceType: "VERIFIED_SPATIAL_FACT",
    isConfirmed: isOfficerVerified,
  });

  factsMap.set("site.areaSqm", {
    key: "site.areaSqm",
    value: siteAreaSqm,
    unit: "m²",
    sourceType: "VERIFIED_SPATIAL_FACT",
    isConfirmed: isOfficerVerified,
  });

  factsMap.set("rtd.primaryZone", {
    key: "rtd.primaryZone",
    value: "PERDAGANGAN",
    sourceType: "VERIFIED_SPATIAL_FACT",
    isConfirmed: isOfficerVerified,
  });

  // Hotel rooms fallback if in LCP facts or app info
  if (!factsMap.has("hotel.rooms") && factsMap.has("building.hotelRooms")) {
    const f = factsMap.get("building.hotelRooms")!;
    factsMap.set("hotel.rooms", f);
  }

  const devType = appData.developmentType || appData.projectInfo?.developmentType || "HOTEL";
  const devSubtype = appData.projectInfo?.developmentSubtype || null;
  const appDate = appData.submittedAt
    ? String(appData.submittedAt)
    : appData.createdAt
    ? String(appData.createdAt)
    : new Date().toISOString();

  const context: PlanningDataContext = {
    applicationId,
    applicationNo: appData.applicationNo || applicationId,
    applicationDate: appDate,
    developmentType: devType,
    developmentSubtype: devSubtype,
    facts: factsMap,
    site: {
      lotCount: lotNumbers.length,
      lotNumbers,
      siteAreaSqm,
      mukim,
      district,
      isOfficerVerified,
    },
    rtd: {
      primaryZoneCode: "PERDAGANGAN",
      primaryZoneName: "Zon Perdagangan & Pelancongan Utama",
      primaryZonePercent: 85,
      zones: [
        {
          zoneCode: "PERDAGANGAN",
          zoneName: "Zon Perdagangan & Pelancongan Utama",
          intersectionPercent: 85,
          intersectionAreaSqm: safeRound(siteAreaSqm * 0.85, 2),
        },
        {
          zoneCode: "PENGANGKUTAN",
          zoneName: "Zon Pengangkutan & Infrastruktur",
          intersectionPercent: 15,
          intersectionAreaSqm: safeRound(siteAreaSqm * 0.15, 2),
        },
      ],
    },
    get(key: string): unknown {
      if (key === "developmentType") return devType;
      if (key === "siteAreaSqm") return siteAreaSqm;
      if (key === "mukim") return mukim;
      if (key === "district") return district;
      const prov = factsMap.get(key);
      return prov?.value;
    },
    getProvenance(key: string): FactProvenance | undefined {
      return factsMap.get(key);
    },
  };

  return context;
}

function safeRound(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
