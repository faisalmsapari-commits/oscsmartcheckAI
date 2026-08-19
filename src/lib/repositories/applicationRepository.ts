import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { Application, ApplicationStatus, ApplicationVersion } from "@/types/application";
import {
  CreateDraftApplicationSchema,
  UpdateDraftApplicationSchema,
  ApplicationVersionSchema,
  DraftApplicationFormSchema,
} from "@/lib/validation/application.schema";
import { convertToSqm } from "@/lib/utils/areaConverter";

export class ApplicationRepository {
  private db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  /**
   * Creates a new DRAFT application document under applications/{applicationId}
   */
  async createDraftApplication(
    applicationId: string,
    rawInput: unknown
  ): Promise<{ id: string; success: boolean }> {
    const validated = CreateDraftApplicationSchema.parse(rawInput);

    const appRef = doc(this.db, "applications", applicationId);
    await setDoc(appRef, {
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create initial Version 1 snapshot subdocument
    const versionRef = doc(this.db, `applications/${applicationId}/versions`, "v1");
    await setDoc(versionRef, {
      versionNumber: 1,
      createdAt: serverTimestamp(),
      createdBy: validated.createdBy,
      reason: "Initial draft registration",
      statusAtCreation: "DRAFT",
      locked: false,
    });

    return { id: applicationId, success: true };
  }

  /**
   * Saves or updates a multi-section KM draft application
   */
  async saveKmDraft(
    applicationId: string,
    applicantUid: string,
    formData: unknown
  ): Promise<{ id: string; success: boolean }> {
    const parsed = DraftApplicationFormSchema.parse(formData);

    const appRef = doc(this.db, "applications", applicationId);
    const existingSnap = await getDoc(appRef);

    // Compute derived normalized fields
    const title =
      parsed.submissionTitle?.trim() ||
      parsed.projectInfo?.projectName?.trim() ||
      parsed.title ||
      "Draf Permohonan KM";

    const developmentType =
      parsed.projectInfo?.developmentType || parsed.developmentType || "COMMERCIAL";

    const primaryMukim =
      parsed.siteInfo?.mukim ||
      (parsed.siteInfo?.lots && parsed.siteInfo.lots[0]?.mukim) ||
      "";

    const lotNoList = parsed.siteInfo?.lots
      ? parsed.siteInfo.lots.map((l) => l.lotNumber).filter(Boolean).join(", ")
      : "";

    const siteAreaSqm = parsed.siteInfo?.siteArea?.originalValue
      ? convertToSqm(parsed.siteInfo.siteArea.originalValue, parsed.siteInfo.siteArea.originalUnit)
      : null;

    const payload: Record<string, unknown> = {
      ...parsed,
      title,
      developmentType,
      mukim: primaryMukim,
      lotNo: lotNoList || null,
      district: parsed.siteInfo?.district || "Langkawi",
      state: parsed.siteInfo?.state || "Kedah",
      siteAreaSqm,
      location: parsed.siteInfo?.location || { latitude: null, longitude: null },
      updatedBy: applicantUid,
      updatedAt: serverTimestamp(),
    };

    if (parsed.siteInfo?.siteArea) {
      payload.siteInfo = {
        ...parsed.siteInfo,
        siteArea: {
          ...parsed.siteInfo.siteArea,
          siteAreaSqm,
        },
      };
    }

    if (!existingSnap.exists()) {
      // Create new draft
      await setDoc(appRef, {
        ...payload,
        applicationNo: `DRAFT-${applicationId.slice(0, 8).toUpperCase()}`,
        applicantUid,
        organizationId: "PUBLIC",
        status: "DRAFT",
        currentVersion: 1,
        assignedOfficerUid: null,
        createdBy: applicantUid,
        createdAt: serverTimestamp(),
        submittedAt: null,
        verifiedAt: null,
        schemaVersion: 1,
      });

      const versionRef = doc(this.db, `applications/${applicationId}/versions`, "v1");
      await setDoc(versionRef, {
        versionNumber: 1,
        createdAt: serverTimestamp(),
        createdBy: applicantUid,
        reason: "Initial draft registration",
        statusAtCreation: "DRAFT",
        locked: false,
      });
    } else {
      // Update existing draft
      await updateDoc(appRef, payload);
    }

    return { id: applicationId, success: true };
  }

  /**
   * Retrieves an application by its ID
   */
  async getApplicationById(applicationId: string): Promise<Application | null> {
    const appRef = doc(this.db, "applications", applicationId);
    const snap = await getDoc(appRef);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...snap.data() } as Application;
  }

  /**
   * Retrieves applications lodged by a specific applicant
   */
  async getApplicationsByApplicant(
    applicantUid: string,
    statusFilter?: ApplicationStatus
  ): Promise<Application[]> {
    const appCol = collection(this.db, "applications");
    let q = query(
      appCol,
      where("applicantUid", "==", applicantUid),
      orderBy("createdAt", "desc")
    );

    if (statusFilter) {
      q = query(
        appCol,
        where("applicantUid", "==", applicantUid),
        where("status", "==", statusFilter),
        orderBy("createdAt", "desc")
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
  }

  /**
   * Retrieves officer review queue applications
   */
  async getOfficerQueue(
    assignedOfficerUid?: string,
    statusFilter?: ApplicationStatus
  ): Promise<Application[]> {
    const appCol = collection(this.db, "applications");
    let q = query(appCol, orderBy("updatedAt", "desc"));

    if (assignedOfficerUid && statusFilter) {
      q = query(
        appCol,
        where("assignedOfficerUid", "==", assignedOfficerUid),
        where("status", "==", statusFilter),
        orderBy("updatedAt", "desc")
      );
    } else if (assignedOfficerUid) {
      q = query(
        appCol,
        where("assignedOfficerUid", "==", assignedOfficerUid),
        orderBy("updatedAt", "desc")
      );
    } else if (statusFilter) {
      q = query(appCol, where("status", "==", statusFilter), orderBy("updatedAt", "desc"));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
  }

  /**
   * Updates an existing DRAFT application
   */
  async updateDraftApplication(
    applicationId: string,
    rawUpdates: unknown
  ): Promise<{ success: boolean }> {
    const validated = UpdateDraftApplicationSchema.parse(rawUpdates);

    const appRef = doc(this.db, "applications", applicationId);
    await updateDoc(appRef, {
      ...validated,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  }

  /**
   * Creates a version checkpoint under applications/{id}/versions/{versionId}
   */
  async createApplicationVersion(
    applicationId: string,
    versionId: string,
    rawVersionInput: unknown
  ): Promise<{ id: string; success: boolean }> {
    const validated = ApplicationVersionSchema.parse(rawVersionInput);

    const versionRef = doc(this.db, `applications/${applicationId}/versions`, versionId);
    await setDoc(versionRef, {
      ...validated,
      createdAt: serverTimestamp(),
    });

    return { id: versionId, success: true };
  }

  /**
   * Gets version history for an application
   */
  async getApplicationVersions(applicationId: string): Promise<ApplicationVersion[]> {
    const versionsCol = collection(this.db, `applications/${applicationId}/versions`);
    const q = query(versionsCol, orderBy("versionNumber", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ApplicationVersion));
  }
}

export const applicationRepository = new ApplicationRepository();
