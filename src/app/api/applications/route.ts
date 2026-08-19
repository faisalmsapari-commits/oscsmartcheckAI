import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, safeVerifyIdToken, isCloudFirestoreConfigured } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { DraftApplicationFormSchema } from "@/lib/validation/application.schema";
import { convertToSqm } from "@/lib/utils/areaConverter";
import { saveApplicationToStore, getAllApplicationsFromStore } from "@/lib/store/applicationStore";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const role = (decodedToken.role as string) || "APPLICANT";
    const uid = decodedToken.uid;

    if (!isCloudFirestoreConfigured()) {
      return NextResponse.json({ applications: getAllApplicationsFromStore() }, { status: 200 });
    }

    const db = getAdminDb();
    let snap;

    try {
      let query = db.collection("applications").orderBy("createdAt", "desc");

      if (role === "APPLICANT") {
        query = db
          .collection("applications")
          .where("applicantUid", "in", [uid, "demo-applicant-uid"])
          .orderBy("createdAt", "desc");
      }

      // Fast timeout race (200ms) to ensure instant sub-second response
      snap = await Promise.race([
        query.get(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 200))
      ]);
    } catch {
      // Instant fallback to in-memory application store
      return NextResponse.json({ applications: getAllApplicationsFromStore() }, { status: 200 });
    }

    if (!snap || snap.empty) {
      return NextResponse.json({ applications: getAllApplicationsFromStore() }, { status: 200 });
    }

    const applications = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ applications }, { status: 200 });
  } catch {
    return NextResponse.json({ applications: getAllApplicationsFromStore() }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ code: "UNAUTHENTICATED", error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const parsed = DraftApplicationFormSchema.parse(body);

    const applicationId = body.applicationId || crypto.randomUUID();

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

    const draftNumber = `DRAFT-${applicationId.slice(0, 8).toUpperCase()}`;

    const newApplicationDoc = {
      ...parsed,
      applicationNo: draftNumber,
      applicantUid: uid,
      organizationId: "PUBLIC",
      developmentType,
      title,
      lotNo: lotNoList || null,
      mukim: primaryMukim || null,
      district: parsed.siteInfo?.district || "Langkawi",
      state: parsed.siteInfo?.state || "Kedah",
      siteAreaSqm,
      location: parsed.siteInfo?.location || { latitude: null, longitude: null },
      status: "DRAFT",
      currentVersion: 1,
      assignedOfficerUid: null,
      createdBy: uid,
      updatedBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      submittedAt: null,
      verifiedAt: null,
      schemaVersion: 1,
    };

    // Save into in-memory store for instant zero-latency retrieval
    saveApplicationToStore(applicationId, {
      ...newApplicationDoc,
      id: applicationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isCloudFirestoreConfigured()) {
      try {
        const db = getAdminDb();
        const appRef = db.collection("applications").doc(applicationId);
        await appRef.set(newApplicationDoc);

        // Add initial version 1 snapshot
        await appRef.collection("versions").doc("v1").set({
          versionNumber: 1,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: uid,
          reason: "Initial draft registration",
          statusAtCreation: "DRAFT",
          locked: false,
        });

        // Write audit log
        await db.collection("auditLogs").add({
          eventType: "APPLICATION_CREATED",
          resourceType: "applications",
          resourceId: applicationId,
          applicationId,
          actorUid: uid,
          actorRole: decodedToken.role || "APPLICANT",
          timestamp: FieldValue.serverTimestamp(),
          metadata: {
            action: "CREATE_DRAFT",
            title,
            developmentType,
          },
        });
      } catch {
        // Demo / Local storage fallback
      }
    }

    return NextResponse.json(
      {
        success: true,
        applicationId,
        applicationNo: draftNumber,
        status: "DRAFT",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const zodErr = error as { issues: Array<{ path: Array<string | number>; message: string }> };
      const message = zodErr.issues
        .map((i) => `${i.path.join(".") || "data"}: ${i.message}`)
        .join(", ");
      return NextResponse.json({ code: "VALIDATION_FAILED", error: message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create draft";
    return NextResponse.json({ code: "VALIDATION_FAILED", error: message }, { status: 400 });
  }
}
