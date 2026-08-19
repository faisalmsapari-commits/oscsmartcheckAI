import { NextRequest, NextResponse } from "next/server";
import { getOfficerSmartCheckQueue } from "@/lib/issues/dashboardService";
import { isCloudFirestoreConfigured, safeVerifyIdToken } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Tidak dibenarkan. Sila log masuk." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await safeVerifyIdToken(token);
    const userRole = (decodedToken.role as string) || "OSC_OFFICER";

    if (isCloudFirestoreConfigured()) {
      try {
        const queue = await Promise.race([
          getOfficerSmartCheckQueue(decodedToken.uid, userRole),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100)),
        ]);
        if (queue && queue.length > 0) {
          return NextResponse.json({ queue });
        }
      } catch {
        // Fallback
      }
    }

    // Return rich demo queue strictly conforming to OfficerQueueItem
    const demoQueue = [
      {
        applicationId: "app-demo-002",
        applicationNo: "KM/2026/000102",
        projectName: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
        title: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
        developmentType: "HOUSING",
        applicantName: "Pembinaan Seri Kedah Sdn Bhd",
        smartCheckId: "sc-demo-002",
        overallStatus: "OFFICER_REVIEW_REQUIRED",
        status: "OFFICER_REVIEW",
        mukim: "Kuah",
        district: "Langkawi",
        submittedAt: "2026-07-15T09:00:00Z",
        totalIssues: 2,
        criticalIssues: 1,
        resolvedIssues: 1,
        requiresReviewCount: 1,
        latestSmartCheckVersion: 1,
        assignedOfficer: "En. Faisal (Perancang)",
        assignedOfficerUid: decodedToken.uid,
        slaDeadline: "2026-08-30T17:00:00Z",
        lastUpdated: "2026-08-15T09:00:00Z",
      },
      {
        applicationId: "app-demo-003",
        applicationNo: "KM/2026/000103",
        projectName: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
        title: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
        developmentType: "COMMERCIAL",
        applicantName: "Syarikat Niaga Mahsuri Sdn Bhd",
        smartCheckId: "sc-demo-003",
        overallStatus: "OFFICER_REVIEW_REQUIRED",
        status: "REQUEST_INFORMATION",
        mukim: "Kuah",
        district: "Langkawi",
        submittedAt: "2026-07-20T10:15:00Z",
        totalIssues: 2,
        criticalIssues: 1,
        resolvedIssues: 0,
        requiresReviewCount: 2,
        latestSmartCheckVersion: 1,
        assignedOfficer: "Pn. Siti Nurhaliza (OSC)",
        assignedOfficerUid: decodedToken.uid,
        slaDeadline: "2026-08-28T17:00:00Z",
        lastUpdated: "2026-08-16T10:15:00Z",
      },
      {
        applicationId: "app-demo-005",
        applicationNo: "KM/2026/000105",
        projectName: "Cadangan Pusat Pemprosesan Makanan Laut & Gudang Logistik Sejuk Beku",
        title: "Cadangan Pusat Pemprosesan Makanan Laut & Gudang Logistik Sejuk Beku",
        developmentType: "INDUSTRIAL",
        applicantName: "Langkawi Fisheries Logistics Sdn Bhd",
        smartCheckId: "sc-demo-005",
        overallStatus: "PASS_PRECHECK",
        status: "SMARTCHECK_COMPLETED",
        mukim: "Ayer Hangat",
        district: "Langkawi",
        submittedAt: "2026-08-01T14:00:00Z",
        totalIssues: 0,
        criticalIssues: 0,
        resolvedIssues: 0,
        requiresReviewCount: 0,
        latestSmartCheckVersion: 1,
        assignedOfficer: "En. Faisal (Perancang)",
        assignedOfficerUid: decodedToken.uid,
        slaDeadline: "2026-08-31T17:00:00Z",
        lastUpdated: "2026-08-18T14:00:00Z",
      },
      {
        applicationId: "app-demo-006",
        applicationNo: "KM/2026/000106",
        projectName: "Cadangan Pembinaan Pusat Kebudayaan & Galeri Geopark Langkawi",
        title: "Cadangan Pembinaan Pusat Kebudayaan & Galeri Geopark Langkawi",
        developmentType: "INSTITUTIONAL",
        applicantName: "Lembaga Pembangunan Geopark Negara",
        smartCheckId: "sc-demo-006",
        overallStatus: "PASS_PRECHECK",
        status: "VERIFIED",
        mukim: "Bohor",
        district: "Langkawi",
        submittedAt: "2026-07-10T08:45:00Z",
        totalIssues: 0,
        criticalIssues: 0,
        resolvedIssues: 0,
        requiresReviewCount: 0,
        latestSmartCheckVersion: 1,
        assignedOfficer: "En. Khairul (GIS)",
        assignedOfficerUid: decodedToken.uid,
        slaDeadline: "2026-08-25T17:00:00Z",
        lastUpdated: "2026-08-17T08:45:00Z",
      },
    ];

    return NextResponse.json({ queue: demoQueue });
  } catch {
    return NextResponse.json({ queue: [] }, { status: 200 });
  }
}
