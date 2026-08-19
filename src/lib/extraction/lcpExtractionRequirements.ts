import type { DevelopmentType } from "../../types/application.ts";

export interface FactRequirementConfig {
  key: string;
  label: string;
  category: string;
  required: boolean;
  conditionalOnDevelopmentType?: DevelopmentType[];
}

export const BASE_REQUIRED_LCP_FACTS: FactRequirementConfig[] = [
  { key: "projectTitle", label: "Tajuk Projek", category: "PROJECT", required: true },
  { key: "developmentType", label: "Jenis Pembangunan", category: "PROJECT", required: true },
  { key: "lotNumber", label: "Nombor Lot", category: "SITE", required: true },
  { key: "mukim", label: "Mukim", category: "SITE", required: true },
  { key: "siteAreaSqm", label: "Keluasan Tapak (m²)", category: "AREA", required: true },
  { key: "proposedLandUse", label: "Guna Tanah Dicadangkan", category: "LAND_USE", required: true },
];

export const CONDITIONAL_LCP_FACTS: FactRequirementConfig[] = [
  {
    key: "hotelRooms",
    label: "Jumlah Bilik Hotel",
    category: "BUILDING",
    required: false,
    conditionalOnDevelopmentType: ["HOTEL"],
  },
  {
    key: "totalResidentialUnits",
    label: "Jumlah Unit Kediaman",
    category: "HOUSING",
    required: false,
    conditionalOnDevelopmentType: ["HOUSING", "MIXED_DEVELOPMENT"],
  },
  {
    key: "grossFloorAreaSqm",
    label: "Jumlah Keluasan Lantai Kasar (GFA)",
    category: "INTENSITY",
    required: false,
    conditionalOnDevelopmentType: ["COMMERCIAL", "HOTEL", "INDUSTRIAL", "MIXED_DEVELOPMENT"],
  },
  {
    key: "plotRatio",
    label: "Nisbah Plot",
    category: "INTENSITY",
    required: false,
    conditionalOnDevelopmentType: ["COMMERCIAL", "HOTEL", "MIXED_DEVELOPMENT"],
  },
  {
    key: "buildingCoveragePercent",
    label: "Liputan Bangunan (Plinth Area %)",
    category: "INTENSITY",
    required: false,
  },
  {
    key: "numberOfFloors",
    label: "Bilangan Tingkat Maksimum",
    category: "BUILDING",
    required: false,
  },
  {
    key: "carParkingProvided",
    label: "Tempat Letak Kereta (Petak)",
    category: "PARKING",
    required: false,
  },
  {
    key: "motorcycleParkingProvided",
    label: "Tempat Letak Motosikal (Petak)",
    category: "PARKING",
    required: false,
  },
  {
    key: "disabledParkingProvided",
    label: "Tempat Letak Kereta OKU",
    category: "PARKING",
    required: false,
  },
  {
    key: "openSpaceAreaSqm",
    label: "Kawasan Lapang (m²)",
    category: "OPEN_SPACE",
    required: false,
  },
  {
    key: "openSpacePercent",
    label: "Peratusan Kawasan Lapang (%)",
    category: "OPEN_SPACE",
    required: false,
  },
  {
    key: "roadReserveWidthMeters",
    label: "Lebar Rizab Jalan (m)",
    category: "ACCESS",
    required: false,
  },
];

/**
 * Returns list of required fact keys for a specific development type
 */
export function getRequiredFactKeys(developmentType?: DevelopmentType): string[] {
  const required = [...BASE_REQUIRED_LCP_FACTS.map((f) => f.key)];

  if (developmentType) {
    CONDITIONAL_LCP_FACTS.forEach((fact) => {
      if (fact.conditionalOnDevelopmentType?.includes(developmentType)) {
        required.push(fact.key);
      }
    });
  }

  return required;
}
