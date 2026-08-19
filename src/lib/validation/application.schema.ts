import { z } from "zod";

export const ALLOWED_DEVELOPMENT_TYPES = [
  "HOUSING",
  "HOTEL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "MIXED_DEVELOPMENT",
  "OTHER",
] as const;

export const ALLOWED_PLANNING_CATEGORIES = [
  "PERUMAHAN",
  "PERDAGANGAN",
  "PELANCONGAN",
  "INDUSTRI",
  "INSTITUSI",
  "PEMBANGUNAN_BERCAMPUR",
  "LAIN_LAIN",
] as const;

export const ALLOWED_APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "DOCUMENT_CHECK",
  "AI_PROCESSING",
  "SMARTCHECK_COMPLETED",
  "OFFICER_REVIEW",
  "REQUEST_INFORMATION",
  "RESUBMITTED",
  "VERIFIED",
  "COMPLETED",
] as const;

export const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
});

export const LotDetailSchema = z.object({
  lotNumber: z.string().min(1, "Nombor lot diperlukan").max(100),
  mukim: z.string().min(1, "Mukim diperlukan").max(100),
  titleNumber: z.string().max(100).optional().default(""),
  landStatus: z.string().max(100).optional().default(""),
});

export const SiteAreaInfoSchema = z.object({
  originalValue: z.number().positive("Keluasan tapak mestilah bernilai positif").nullable().default(null),
  originalUnit: z.enum(["SQM", "HECTARE", "ACRE"]).default("SQM"),
  siteAreaSqm: z.number().positive().nullable().default(null),
});

export const ApplicantInfoSchema = z.object({
  applicantName: z.string().min(1, "Nama pemohon diperlukan").max(200),
  applicantType: z.enum(["INDIVIDUAL", "COMPANY", "CONSULTANT", "GOVERNMENT_AGENCY", "OTHER"]).default("COMPANY"),
  companyName: z.string().max(200).nullable().default(null),
  registrationNumber: z.string().max(100).nullable().default(null),
  email: z.string().email("Emel tidak sah"),
  phone: z.string().min(5, "Nombor telefon tidak sah").max(50),
  address: z.string().max(500).default(""),
});

export const ConsultantInfoSchema = z.object({
  principalSubmittingPerson: z.string().max(200).nullable().default(null),
  consultantCompany: z.string().max(200).nullable().default(null),
  professionalRegistrationNo: z.string().max(100).nullable().default(null),
  email: z.string().email("Emel tidak sah").nullable().optional().or(z.literal("")),
  phone: z.string().max(50).nullable().default(null),
});

export const ProjectInfoSchema = z.object({
  projectName: z.string().min(1, "Tajuk projek diperlukan").max(300),
  developmentType: z.enum(ALLOWED_DEVELOPMENT_TYPES).default("COMMERCIAL"),
  developmentSubtype: z.string().max(100).nullable().default(null),
  developmentDescription: z.string().max(2000).default(""),
  developmentCategory: z.string().max(100).nullable().default(null),
  proposedUse: z.string().max(500).default(""),
  existingUse: z.string().max(500).nullable().default(null),
  estimatedProjectValue: z.number().positive().nullable().default(null),
});

export const DevelopmentParametersSchema = z.object({
  source: z.enum(["APPLICANT", "DOCUMENT_AI", "AI_EXTRACTION", "OFFICER", "SYSTEM"]).or(z.string()).default("APPLICANT"),
  totalDevelopmentUnits: z.number().int().nonnegative().nullable().default(null),
  residentialUnits: z.number().int().nonnegative().nullable().default(null),
  hotelRooms: z.number().int().nonnegative().nullable().default(null),
  commercialFloorAreaSqm: z.number().nonnegative().nullable().default(null),
  grossFloorAreaSqm: z.number().nonnegative().nullable().default(null),
  buildingFootprintSqm: z.number().nonnegative().nullable().default(null),
  numberOfBlocks: z.number().int().nonnegative().nullable().default(null),
  maximumFloors: z.number().int().nonnegative().nullable().default(null),
  maximumBuildingHeightM: z.number().nonnegative().nullable().default(null),
  plotRatio: z.number().nonnegative().nullable().default(null),
  siteCoveragePercent: z.number().min(0).max(100).nullable().default(null),
  parkingProvided: z.number().int().nonnegative().nullable().default(null),
  motorcycleParkingProvided: z.number().int().nonnegative().nullable().default(null),
  disabledParkingProvided: z.number().int().nonnegative().nullable().default(null),
  openSpaceAreaSqm: z.number().nonnegative().nullable().default(null),
  openSpacePercent: z.number().min(0).max(100).nullable().default(null),
  confidence: z.number().min(0).max(1).optional(),
});

export const ApplicantDeclarationSchema = z.object({
  declarationAccepted: z.boolean().default(false),
  declaredAt: z.string().nullable().default(null),
  declaredBy: z.string().nullable().default(null),
});

/**
 * Draft Save Validation Schema (Permissive for partial saves)
 */
export const DraftApplicationFormSchema = z.object({
  title: z.string().max(300).default("Draf Permohonan KM"),
  applicationType: z.string().default("Kebenaran Merancang"),
  planningApplicationCategory: z.enum(ALLOWED_PLANNING_CATEGORIES).default("PERDAGANGAN"),
  categoryOtherDescription: z.string().max(300).nullable().default(null),
  submissionTitle: z.string().max(300).default(""),
  projectReference: z.string().max(100).nullable().default(null),
  developmentType: z.enum(ALLOWED_DEVELOPMENT_TYPES).default("COMMERCIAL"),

  applicantInfo: ApplicantInfoSchema.partial().optional(),
  consultantInfo: ConsultantInfoSchema.partial().optional(),
  projectInfo: ProjectInfoSchema.partial().optional(),
  siteInfo: z
    .object({
      lots: z.array(LotDetailSchema).default([]),
      mukim: z.string().max(100).default(""),
      district: z.string().max(100).default("Langkawi"),
      state: z.string().max(100).default("Kedah"),
      siteAddress: z.string().max(500).default(""),
      siteArea: SiteAreaInfoSchema.default({ originalValue: null, originalUnit: "SQM", siteAreaSqm: null }),
      location: GeoLocationSchema.default({ latitude: null, longitude: null }),
    })
    .optional(),
  developmentParameters: DevelopmentParametersSchema.partial().optional(),
  declaration: ApplicantDeclarationSchema.optional(),
});

/**
 * Strict Pre-Submission Statutory Schema (Authoritative)
 */
export const StrictSubmitApplicationSchema = z.object({
  title: z.string().min(5, "Tajuk permohonan sekurang-kurangnya 5 aksara"),
  developmentType: z.enum(ALLOWED_DEVELOPMENT_TYPES),
  district: z.string().min(1, "Daerah diperlukan"),
  state: z.string().min(1, "Negeri diperlukan"),
  applicantUid: z.string().min(1, "Pengesahan identiti pemohon diperlukan"),
  siteInfo: z.object({
    lots: z.array(LotDetailSchema).min(1, "Sekurang-kurangnya satu lot tanah diperlukan"),
    mukim: z.string().min(1, "Mukim diperlukan"),
    district: z.string().min(1, "Daerah diperlukan"),
    state: z.string().min(1, "Negeri diperlukan"),
    siteArea: z.object({
      originalValue: z.number().positive("Keluasan tapak diperlukan"),
      originalUnit: z.enum(["SQM", "HECTARE", "ACRE"]),
      siteAreaSqm: z.number().positive("Keluasan tapak (m²) diperlukan"),
    }),
  }),
  declaration: z.object({
    declarationAccepted: z.literal(true),
  }),
});

export const CreateDraftApplicationSchema = z.object({
  applicationNo: z.string().min(3).max(100),
  applicantUid: z.string().min(1),
  organizationId: z.string().nullable().default(null),
  developmentType: z.enum(ALLOWED_DEVELOPMENT_TYPES),
  title: z.string().min(5).max(300),
  lotNo: z.string().max(100).nullable().default(null),
  mukim: z.string().max(100).nullable().default(null),
  district: z.string().min(1).default("Langkawi"),
  state: z.string().min(1).default("Kedah"),
  siteAreaSqm: z.number().positive().nullable().default(null),
  location: GeoLocationSchema.default({ latitude: null, longitude: null }),
  status: z.literal("DRAFT").default("DRAFT"),
  currentVersion: z.literal(1).default(1),
  assignedOfficerUid: z.null().default(null),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  submittedAt: z.null().default(null),
  verifiedAt: z.null().default(null),
  schemaVersion: z.literal(1).default(1),
});

export const UpdateDraftApplicationSchema = z.object({
  developmentType: z.enum(ALLOWED_DEVELOPMENT_TYPES).optional(),
  title: z.string().min(5).max(300).optional(),
  lotNo: z.string().max(100).nullable().optional(),
  mukim: z.string().max(100).nullable().optional(),
  district: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  siteAreaSqm: z.number().positive().nullable().optional(),
  location: GeoLocationSchema.optional(),
  updatedBy: z.string().min(1),
});

export const ApplicationVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
  createdBy: z.string().min(1),
  reason: z.string().max(500).nullable().default(null),
  statusAtCreation: z.enum(ALLOWED_APPLICATION_STATUSES),
  locked: z.boolean().default(false),
});
