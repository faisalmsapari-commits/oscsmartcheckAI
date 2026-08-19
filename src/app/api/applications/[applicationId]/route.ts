import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { DraftApplicationFormSchema } from "@/lib/validation/application.schema";
import { convertToSqm } from "@/lib/utils/areaConverter";
import { DEMO_10_APPLICATIONS, getDemoApplication } from "@/lib/seed/demoDataSeeder";
import { getApplicationFromStore, saveApplicationToStore } from "@/lib/store/applicationStore";

interface RouteParams {
  params: Promise<{
    applicationId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await safeVerifyIdToken(token);

    // Instant check in-memory store for newly created drafts & live sessions
    const inMemApp = getApplicationFromStore(applicationId);
    if (inMemApp) {
      return NextResponse.json({ application: inMemApp }, { status: 200 });
    }

    // Instant return for demo applications to avoid Firestore network timeout
    if (applicationId.startsWith("app-demo-")) {
      const demoApp = getDemoApplication(applicationId);
      return NextResponse.json({
        application: {
          id: demoApp.id,
          applicationNo: demoApp.applicationNo,
          title: demoApp.title,
          developmentType: demoApp.developmentType,
          developmentCategory: demoApp.developmentCategory,
          mukim: demoApp.mukim,
          district: "Langkawi",
          state: "Kedah",
          status: demoApp.status,
          currentVersion: demoApp.currentVersion,
          applicantUid: demoApp.applicantUid,
          applicantName: demoApp.applicantName,
          consultantName: demoApp.consultantName,
          estimatedCost: demoApp.estimatedCost,
          remarks: demoApp.remarks,
          createdAt: demoApp.createdAt,
          updatedAt: demoApp.updatedAt,
          landDetails: {
            lotNo: demoApp.lotNo,
            mukim: demoApp.mukim,
            district: "Langkawi",
            state: "Kedah",
            siteAreaSqm: demoApp.siteAreaSqm,
          },
          location: {
            latitude: demoApp.latitude,
            longitude: demoApp.longitude,
          },
          project: {
            projectName: demoApp.title,
            developmentType: demoApp.developmentType,
            developmentCategory: demoApp.developmentCategory,
            proposedUse: demoApp.title,
            estimatedProjectValue: demoApp.estimatedCost,
          },
          applicant: {
            applicantName: demoApp.applicantName,
            applicantType: "COMPANY",
            companyName: demoApp.applicantName,
            email: "pemohon@perunding.com",
            phone: "+604-9661234",
            address: "Pekan Kuah, 07000 Langkawi, Kedah",
          },
          consultant: {
            principalSubmittingPerson: demoApp.consultantName,
            consultantCompany: demoApp.applicantName,
            professionalRegistrationNo: "LAM/BEM/2026",
            email: "perunding@arkitek.com",
            phone: "+604-9665678",
          },
        },
      }, { status: 200 });
    }

    if (isCloudFirestoreConfigured()) {
      try {
        const db = getAdminDb();
        const appDoc = (await Promise.race([
          db.collection("applications").doc(applicationId).get(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100)),
        ])) as FirebaseFirestore.DocumentSnapshot;
        if (appDoc.exists) {
          const appData = appDoc.data()!;
          return NextResponse.json({ application: { id: appDoc.id, ...appData } }, { status: 200 });
        }
      } catch {
        // Instant Fallback
      }
    }

    // Demo application fallback
    const demoApp = DEMO_10_APPLICATIONS.find((a) => a.id === applicationId) || DEMO_10_APPLICATIONS[0];
    const generatedDraft = {
      id: applicationId,
      applicationNo: `DRAFT-${applicationId.slice(0, 8).toUpperCase()}`,
      title: demoApp.title,
      submissionTitle: demoApp.title,
      developmentType: demoApp.developmentType,
      planningApplicationCategory: demoApp.developmentCategory || "PERDAGANGAN",
      mukim: demoApp.mukim,
      district: "Langkawi",
      state: "Kedah",
      status: "DRAFT",
      currentVersion: 1,
      applicantUid: "demo-applicant-uid",
      siteAreaSqm: demoApp.siteAreaSqm,
      siteInfo: {
        lots: [{ lotNumber: demoApp.lotNo || "Lot 1042", mukim: demoApp.mukim || "Kuah", titleNumber: "GM 412", landStatus: "HAKMILIK_KEKAL" }],
        mukim: demoApp.mukim || "Kuah",
        district: "Langkawi",
        state: "Kedah",
        siteAddress: `Mukim ${demoApp.mukim}, 07000 Langkawi, Kedah`,
        siteArea: { originalValue: demoApp.siteAreaSqm || 18500, originalUnit: "SQM", siteAreaSqm: demoApp.siteAreaSqm || 18500 },
        location: { latitude: demoApp.latitude || 6.2915, longitude: demoApp.longitude || 99.7289 },
      },
      projectInfo: {
        projectName: demoApp.title,
        developmentType: demoApp.developmentType || "HOTEL",
        developmentSubtype: "Resort Tepi Pantai",
        developmentDescription: "Cadangan pemajuan kebenaran merancang yang diekstrak secara pintar oleh AI SmartCheck.",
        developmentCategory: demoApp.developmentCategory || "PELANCONGAN",
        proposedUse: demoApp.title,
        existingUse: "Tanah Kosong",
        estimatedProjectValue: demoApp.estimatedCost || 45000000,
      },
      applicantInfo: {
        applicantName: "Perunding Arkitek Langkawi Sdn Bhd",
        applicantType: "COMPANY",
        companyName: "Perunding Arkitek Langkawi Sdn Bhd",
        registrationNumber: "201801029384 (1289410-X)",
        email: "ahmad@perundinglangkawi.com",
        phone: "+604-9668899",
        address: "Pusat Perniagaan Chenang, 07000 Langkawi, Kedah",
      },
      consultantInfo: {
        principalSubmittingPerson: "Ar. Ahmad Zulkifli bin Ismail",
        consultantCompany: "Perunding Arkitek Langkawi Sdn Bhd",
        professionalRegistrationNo: "LAM A/1245",
        email: "ahmad@perundinglangkawi.com",
        phone: "+604-9668899",
      },
      developmentParameters: {
        source: "DOCUMENT_AI",
        totalDevelopmentUnits: 120,
        residentialUnits: null,
        hotelRooms: 120,
        commercialFloorAreaSqm: 3500,
        grossFloorAreaSqm: 27750,
        buildingFootprintSqm: 8325,
        numberOfBlocks: 3,
        maximumFloors: 4,
        maximumBuildingHeightM: 16.5,
        plotRatio: 1.5,
        siteCoveragePercent: 45,
        parkingProvided: 145,
        motorcycleParkingProvided: 60,
        disabledParkingProvided: 4,
        openSpaceAreaSqm: 3700,
        openSpacePercent: 20,
      },
      declaration: {
        declarationAccepted: true,
        declaredAt: new Date().toISOString(),
        declaredBy: "Ar. Ahmad Zulkifli bin Ismail (PSP)",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveApplicationToStore(applicationId, generatedDraft);
    return NextResponse.json({ application: generatedDraft }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching application";
    return NextResponse.json({ code: "SERVER_ERROR", error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const role = (decodedToken.role as string) || "APPLICANT";
    const uid = decodedToken.uid;
    const body = await req.json();
    const parsed = DraftApplicationFormSchema.parse(body);

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
      : 18500;

    const updatePayload: Record<string, unknown> = {
      ...parsed,
      id: applicationId,
      title,
      developmentType,
      lotNo: lotNoList || null,
      mukim: primaryMukim || null,
      district: parsed.siteInfo?.district || "Langkawi",
      state: parsed.siteInfo?.state || "Kedah",
      siteAreaSqm,
      location: parsed.siteInfo?.location || { latitude: null, longitude: null },
      updatedBy: uid,
      updatedAt: new Date().toISOString(),
    };

    if (parsed.siteInfo?.siteArea) {
      updatePayload.siteInfo = {
        ...parsed.siteInfo,
        siteArea: {
          ...parsed.siteInfo.siteArea,
          siteAreaSqm,
        },
      };
    }

    saveApplicationToStore(applicationId, updatePayload);

    try {
      const db = getAdminDb();
      const appRef = db.collection("applications").doc(applicationId);
      await appRef.update(updatePayload);

      // Audit log
      await db.collection("auditLogs").add({
        eventType: "APPLICATION_DRAFT_UPDATED",
        resourceType: "applications",
        resourceId: applicationId,
        applicationId,
        actorUid: uid,
        actorRole: role,
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          action: "UPDATE_DRAFT",
          title,
          updatedFields: Object.keys(body),
        },
      });
    } catch {
      // Demo / Local storage fallback
    }

    return NextResponse.json({ success: true, applicationId }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update application";
    return NextResponse.json({ code: "VALIDATION_FAILED", error: message }, { status: 400 });
  }
}
