import type { Timestamp } from "firebase/firestore";

/**
 * Types of Development Proposals for MPLBP Planning Permissions
 */
export type DevelopmentType =
  | "HOUSING"
  | "HOTEL"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "MIXED_DEVELOPMENT"
  | "OTHER";

export const ALLOWED_DEVELOPMENT_TYPES: readonly DevelopmentType[] = [
  "HOUSING",
  "HOTEL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "MIXED_DEVELOPMENT",
  "OTHER",
] as const;

/**
 * Planning Application Categories (Kategori Permohonan Kebenaran Merancang)
 */
export type PlanningApplicationCategory =
  | "PERUMAHAN"
  | "PERDAGANGAN"
  | "PELANCONGAN"
  | "INDUSTRI"
  | "INSTITUSI"
  | "PEMBANGUNAN_BERCAMPUR"
  | "LAIN_LAIN";

export const ALLOWED_PLANNING_CATEGORIES: readonly PlanningApplicationCategory[] = [
  "PERUMAHAN",
  "PERDAGANGAN",
  "PELANCONGAN",
  "INDUSTRI",
  "INSTITUSI",
  "PEMBANGUNAN_BERCAMPUR",
  "LAIN_LAIN",
] as const;

/**
 * Comprehensive Application Lifecycle Statuses
 */
export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DOCUMENT_CHECK"
  | "AWAITING_DOCUMENT_COMPLETION"
  | "DOCUMENT_COMPLETE"
  | "AI_PROCESSING"
  | "SMARTCHECK_READY"
  | "SMARTCHECK_COMPLETED"
  | "OFFICER_REVIEW"
  | "REQUEST_INFORMATION"
  | "WAITING_APPLICANT"
  | "RESUBMITTED"
  | "RECHECK_REQUIRED"
  | "VERIFIED"
  | "VERIFIED_COMMENT_READY"
  | "REPORT_READY"
  | "COMPLETED"
  | "WITHDRAWN"
  | "CANCELLED";

export const ALLOWED_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "DOCUMENT_CHECK",
  "AWAITING_DOCUMENT_COMPLETION",
  "DOCUMENT_COMPLETE",
  "AI_PROCESSING",
  "SMARTCHECK_READY",
  "SMARTCHECK_COMPLETED",
  "OFFICER_REVIEW",
  "REQUEST_INFORMATION",
  "WAITING_APPLICANT",
  "RESUBMITTED",
  "RECHECK_REQUIRED",
  "VERIFIED",
  "VERIFIED_COMMENT_READY",
  "REPORT_READY",
  "COMPLETED",
  "WITHDRAWN",
  "CANCELLED",
] as const;

export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
}

export type AreaUnit = "SQM" | "HECTARE" | "ACRE";

export interface SiteAreaInfo {
  originalValue: number | null;
  originalUnit: AreaUnit;
  siteAreaSqm: number | null;
}

export interface LotDetail {
  lotNumber: string;
  mukim: string;
  titleNumber?: string;
  landStatus?: string;
}

export type ApplicantType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "CONSULTANT"
  | "GOVERNMENT_AGENCY"
  | "OTHER";

export interface ApplicantInfo {
  applicantName: string;
  applicantType: ApplicantType;
  companyName: string | null;
  registrationNumber: string | null;
  email: string;
  phone: string;
  address: string;
}

export interface ConsultantInfo {
  principalSubmittingPerson: string | null;
  consultantCompany: string | null;
  professionalRegistrationNo: string | null;
  email: string | null;
  phone: string | null;
}

export interface ProjectInfo {
  projectName: string;
  developmentType: DevelopmentType;
  developmentSubtype: string | null;
  developmentDescription: string;
  developmentCategory: string | null;
  proposedUse: string;
  existingUse: string | null;
  estimatedProjectValue: number | null;
}

export interface SiteInfo {
  lots: LotDetail[];
  mukim: string;
  district: string;
  state: string;
  siteAddress: string;
  siteArea: SiteAreaInfo;
  location: GeoLocation;
}

export type DataSource = "APPLICANT" | "DOCUMENT_AI" | "AI_EXTRACTION" | "OFFICER" | "SYSTEM";

export interface DevelopmentParameters {
  source: DataSource;
  totalDevelopmentUnits: number | null;
  residentialUnits: number | null;
  hotelRooms: number | null;
  commercialFloorAreaSqm: number | null;
  grossFloorAreaSqm: number | null;
  buildingFootprintSqm: number | null;
  numberOfBlocks: number | null;
  maximumFloors: number | null;
  maximumBuildingHeightM: number | null;
  plotRatio: number | null;
  siteCoveragePercent: number | null;
  parkingProvided: number | null;
  motorcycleParkingProvided: number | null;
  disabledParkingProvided: number | null;
  openSpaceAreaSqm: number | null;
  openSpacePercent: number | null;
  confidence?: number;
}

export interface ApplicantDeclaration {
  declarationAccepted: boolean;
  declaredAt: Timestamp | string | null;
  declaredBy: string | null;
}

/**
 * Primary Application Document Schema: applications/{applicationId}
 */
export interface Application {
  id?: string;
  applicationNo: string;
  applicantUid: string;
  organizationId: string | null;
  developmentType: DevelopmentType;
  title: string;
  lotNo: string | null;
  mukim: string | null;
  district: string;
  state: string;
  siteAreaSqm: number | null;
  location: GeoLocation;
  status: ApplicationStatus;
  currentVersion: number;
  assignedOfficerUid: string | null;

  // Detailed Form Sections
  applicationType?: string;
  planningApplicationCategory?: PlanningApplicationCategory;
  categoryOtherDescription?: string | null;
  submissionTitle?: string;
  projectReference?: string | null;

  applicantInfo?: ApplicantInfo;
  consultantInfo?: ConsultantInfo;
  projectInfo?: ProjectInfo;
  siteInfo?: SiteInfo;
  developmentParameters?: DevelopmentParameters;
  declaration?: ApplicantDeclaration;

  createdAt: Timestamp | string;
  createdBy: string;
  updatedAt: Timestamp | string;
  updatedBy: string;
  submittedAt: Timestamp | string | null;
  verifiedAt: Timestamp | string | null;
  schemaVersion: number;
}

/**
 * Version Snapshot Document Schema: applications/{applicationId}/versions/{versionId}
 */
export interface ApplicationVersion {
  id?: string;
  versionNumber: number;
  createdAt: Timestamp | string;
  createdBy: string;
  reason: string | null;
  statusAtCreation: ApplicationStatus | string;
  locked: boolean;
}
