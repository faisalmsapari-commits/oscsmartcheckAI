export type AgencyLogoType = "PRESET_EMBLEM" | "IMAGE_URL" | "CUSTOM_UPLOAD";
export type AgencyEmblemPreset = "MPLBP" | "KEDAH_STATE" | "PLANMALAYSIA" | "JUPEM" | "KPKT";

export interface AgencyBrandingConfig {
  // Identiti Visual & Logo
  agencyLogoType: AgencyLogoType;
  agencyLogoUrl: string;
  agencyEmblemPreset: AgencyEmblemPreset;
  logoSizePx: number;

  // Maklumat Agensi & PBT
  agencyName: string;
  agencyAcronym: string;
  agencyDepartment: string;
  stateName: string;

  // Jalur Header & Tajuk Portal
  portalTitle: string;
  portalTagline: string;
  topStripText: string;
  referencePlanText: string;

  // Maklumat Perhubungan & Meja Bantuan
  helpdeskEmail: string;
  helpdeskPhone: string;
  agencyAddress: string;

  // Penafian Statutori
  statutoryActNotice: string;

  // Metadata Audit
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_AGENCY_BRANDING: AgencyBrandingConfig = {
  agencyLogoType: "PRESET_EMBLEM",
  agencyLogoUrl: "",
  agencyEmblemPreset: "MPLBP",
  logoSizePx: 44,

  agencyName: "Majlis Perbandaran Langkawi Bandaraya Pelancongan",
  agencyAcronym: "MPLBP",
  agencyDepartment: "Unit Pusat Setempat (OSC)",
  stateName: "Kedah Darul Aman",

  portalTitle: "OSC SmartCheck AI",
  portalTagline: "Semak Pintar • Lokasi Tepat • Keputusan Diyakini",
  topStripText: "PORTAL RASMI KERAJAAN TEMPATAN NEGERI KEDAH DARUL AMAN",
  referencePlanText: "RTD Langkawi 2030",

  helpdeskEmail: "osc@mplbp.gov.my",
  helpdeskPhone: "+604-966 6590",
  agencyAddress: "Kompleks MPLBP, Persiaran Putra, Kuah, 07000 Langkawi, Kedah Darul Aman",

  statutoryActNotice:
    "Akses tertakluk kepada Akta Perancangan Bandar dan Desa 1976 (Akta 172). Semua aktiviti diaudit.",
};
