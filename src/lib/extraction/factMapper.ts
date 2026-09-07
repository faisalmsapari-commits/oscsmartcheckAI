import type { Application } from "../../types/application.ts";
import type { PlanningFact } from "../../types/extraction.ts";

export function mapRealFactsToApplication(facts: PlanningFact[]): {
  extractedData: Partial<Application>;
  extractedKeys: string[];
  unextractedKeys: string[];
  unextractedNotice?: string;
} {
  const data: Partial<Application> = {};
  const extractedKeys: string[] = [];
  const unextractedKeys: string[] = [];

  const getValidFact = (key: string) => {
    const fact = facts.find((f) => f.key === key);
    if (!fact) return null;
    if (
      (fact.confidenceLevel === "HIGH" || fact.confidenceLevel === "MEDIUM") &&
      fact.value !== null &&
      fact.value !== undefined &&
      fact.value !== "" &&
      fact.status !== "NOT_FOUND"
    ) {
      return fact;
    }
    return null;
  };

  // Title
  const titleFact = getValidFact("projectTitle");
  if (titleFact) {
    const val = String(titleFact.value);
    data.title = val;
    data.submissionTitle = val;
    data.projectInfo = { ...(data.projectInfo || {}), projectName: val } as any;
    extractedKeys.push("projectTitle");
  } else {
    unextractedKeys.push("projectTitle");
  }

  // Development Type
  const devTypeFact = getValidFact("developmentType");
  if (devTypeFact) {
    const devTypeVal = String(devTypeFact.value).toUpperCase();
    if (["COMMERCIAL", "HOUSING", "HOTEL", "INDUSTRIAL", "MIXED_DEVELOPMENT"].includes(devTypeVal)) {
      data.developmentType = devTypeVal as any;
      data.projectInfo = { ...(data.projectInfo || {}), developmentType: devTypeVal as any } as any;
      extractedKeys.push("developmentType");
    }
  } else {
    unextractedKeys.push("developmentType");
  }

  // Lot & Mukim
  const lotFact = getValidFact("lotNumber");
  const mukimFact = getValidFact("mukim");
  if (lotFact || mukimFact) {
    const lotNo = lotFact ? String(lotFact.value) : "";
    const mukimName = mukimFact ? String(mukimFact.value) : "";
    data.siteInfo = {
      ...(data.siteInfo || {}),
      lots: lotNo || mukimName ? [{ lotNumber: lotNo, mukim: mukimName, titleNumber: "", landStatus: "HAKMILIK_KEKAL" }] : [],
      mukim: mukimName || undefined,
    } as any;
    if (lotFact) extractedKeys.push("lotNumber");
    if (mukimFact) extractedKeys.push("mukim");
  } else {
    unextractedKeys.push("lotNumber", "mukim");
  }

  // Site Area
  const areaFact = getValidFact("siteAreaSqm");
  if (areaFact) {
    const num = Number(areaFact.value);
    if (!isNaN(num) && num > 0) {
      data.siteInfo = {
        ...(data.siteInfo || {}),
        siteArea: { originalValue: num, originalUnit: "SQM", siteAreaSqm: num },
      } as any;
      extractedKeys.push("siteAreaSqm");
    }
  } else {
    unextractedKeys.push("siteAreaSqm");
  }

  // Development Parameters
  const params: any = { source: "DOCUMENT_AI" };
  let hasParam = false;

  const plotRatioFact = getValidFact("plotRatio");
  if (plotRatioFact) {
    params.plotRatio = Number(plotRatioFact.value);
    extractedKeys.push("plotRatio");
    hasParam = true;
  } else unextractedKeys.push("plotRatio");

  const unitsFact = getValidFact("totalResidentialUnits") || getValidFact("hotelRooms");
  if (unitsFact) {
    params.totalDevelopmentUnits = Number(unitsFact.value);
    extractedKeys.push(unitsFact.key);
    hasParam = true;
  } else unextractedKeys.push("totalDevelopmentUnits");

  const parkingFact = getValidFact("carParkingProvided");
  if (parkingFact) {
    params.parkingProvided = Number(parkingFact.value);
    extractedKeys.push("carParkingProvided");
    hasParam = true;
  } else unextractedKeys.push("carParkingProvided");

  const gfaFact = getValidFact("grossFloorAreaSqm");
  if (gfaFact) {
    params.grossFloorAreaSqm = Number(gfaFact.value);
    extractedKeys.push("grossFloorAreaSqm");
    hasParam = true;
  } else unextractedKeys.push("grossFloorAreaSqm");

  const coverageFact = getValidFact("buildingCoveragePercent");
  if (coverageFact) {
    params.siteCoveragePercent = Number(coverageFact.value);
    extractedKeys.push("buildingCoveragePercent");
    hasParam = true;
  } else unextractedKeys.push("buildingCoveragePercent");

  if (hasParam) {
    data.developmentParameters = params;
  }

  return {
    extractedData: data,
    extractedKeys,
    unextractedKeys,
    unextractedNotice: unextractedKeys.length > 0 ? "Tidak dapat dikesan secara automatik — sila isi secara manual" : undefined,
  };
}
