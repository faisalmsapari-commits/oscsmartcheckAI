import { Firestore } from "firebase-admin/firestore";
import { getAdminDb, isCloudFirestoreConfigured } from "../firebase/admin.ts";
import type { PlanningFact } from "../../types/extraction.ts";

export interface FactCorrectionStat {
  key: string;
  totalExtracted: number;
  totalCorrected: number;
  correctionRate: number; // Percentage, e.g., 15.0 for 15.0%
}

export interface SampleCorrectionPair {
  factId: string;
  applicationId: string;
  key: string;
  originalAiValue: unknown;
  correctedValue: unknown;
  reason?: string | null;
  updatedAt?: string | null;
}

export interface CorrectionAnalyticsResult {
  totalFactsCount: number;
  totalCorrectionsCount: number;
  overallCorrectionRate: number; // Percentage, e.g., 9.17 for 9.17%
  correctionRatePerKey: Record<string, FactCorrectionStat>;
  top5MostCorrectedFields: FactCorrectionStat[];
  sampleCorrections: SampleCorrectionPair[];
}

export function getDemoCorrectionAnalytics(): CorrectionAnalyticsResult {
  const statsMap: Record<string, FactCorrectionStat> = {
    plotRatio: { key: "plotRatio", totalExtracted: 20, totalCorrected: 3, correctionRate: 15.0 },
    plinthAreaPercent: { key: "plinthAreaPercent", totalExtracted: 20, totalCorrected: 3, correctionRate: 15.0 },
    landAreaM2: { key: "landAreaM2", totalExtracted: 20, totalCorrected: 2, correctionRate: 10.0 },
    totalParkingBays: { key: "totalParkingBays", totalExtracted: 20, totalCorrected: 2, correctionRate: 10.0 },
    buildingHeightMeters: { key: "buildingHeightMeters", totalExtracted: 20, totalCorrected: 1, correctionRate: 5.0 },
    proposedLandUse: { key: "proposedLandUse", totalExtracted: 20, totalCorrected: 0, correctionRate: 0.0 },
  };

  const top5: FactCorrectionStat[] = [
    statsMap.plotRatio,
    statsMap.plinthAreaPercent,
    statsMap.landAreaM2,
    statsMap.totalParkingBays,
    statsMap.buildingHeightMeters,
  ];

  const sampleCorrections: SampleCorrectionPair[] = [
    {
      factId: "fact-demo-001",
      applicationId: "app-demo-001",
      key: "plotRatio",
      originalAiValue: 3.5,
      correctedValue: 4.0,
      reason: "Berdasarkan jadual pelan susun atur terbaharu (Block B)",
      updatedAt: new Date().toISOString(),
    },
    {
      factId: "fact-demo-002",
      applicationId: "app-demo-001",
      key: "plinthAreaPercent",
      originalAiValue: "60%",
      correctedValue: "65%",
      reason: "Perkiraan anjung kereta diambil kira",
      updatedAt: new Date().toISOString(),
    },
    {
      factId: "fact-demo-003",
      applicationId: "app-demo-002",
      key: "landAreaM2",
      originalAiValue: 12500,
      correctedValue: 12850,
      reason: "Luas jajaran rizab jalan baharu",
      updatedAt: new Date().toISOString(),
    },
    {
      factId: "fact-demo-004",
      applicationId: "app-demo-003",
      key: "totalParkingBays",
      originalAiValue: 120,
      correctedValue: 135,
      reason: "Petak letak kereta OKU dimasukkan",
      updatedAt: new Date().toISOString(),
    },
    {
      factId: "fact-demo-005",
      applicationId: "app-demo-003",
      key: "buildingHeightMeters",
      originalAiValue: 45.0,
      correctedValue: 48.5,
      reason: "Ketinggian lif motor room di bumbung",
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    totalFactsCount: 120,
    totalCorrectionsCount: 11,
    overallCorrectionRate: 9.17,
    correctionRatePerKey: statsMap,
    top5MostCorrectedFields: top5,
    sampleCorrections,
  };
}

/**
 * Aggregates extraction correction analytics across all applications.
 */
export async function getFactCorrectionAnalytics(customDb?: Firestore): Promise<CorrectionAnalyticsResult> {
  if (!isCloudFirestoreConfigured() && !customDb) {
    return getDemoCorrectionAnalytics();
  }

  const db = customDb || getAdminDb();

  try {
    const snap = await db.collectionGroup("extractedFacts").get();
    if (snap.empty) {
      return getDemoCorrectionAnalytics();
    }

    let totalFactsCount = 0;
    let totalCorrectionsCount = 0;
    const statsMap: Record<string, { totalExtracted: number; totalCorrected: number }> = {};
    const sampleCorrections: SampleCorrectionPair[] = [];

    snap.forEach((doc) => {
      totalFactsCount++;
      const data = doc.data() as PlanningFact;
      const key = data.key || "unknownKey";
      const isCorrected = data.status === "MANUALLY_CORRECTED";

      if (!statsMap[key]) {
        statsMap[key] = { totalExtracted: 0, totalCorrected: 0 };
      }
      statsMap[key].totalExtracted += 1;

      if (isCorrected) {
        totalCorrectionsCount += 1;
        statsMap[key].totalCorrected += 1;

        const pathSegments = doc.ref.path.split("/");
        const appId = data.applicationId || (pathSegments.length >= 2 ? pathSegments[1] : "unknown-app");

        sampleCorrections.push({
          factId: doc.id,
          applicationId: appId,
          key,
          originalAiValue: data.originalAiValue ?? data.value ?? null,
          correctedValue: data.confirmedValue ?? null,
          reason: data.rejectionReason || null,
          updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        });
      }
    });

    const correctionRatePerKey: Record<string, FactCorrectionStat> = {};
    const statsList: FactCorrectionStat[] = [];

    for (const [key, stat] of Object.entries(statsMap)) {
      const rate = stat.totalExtracted > 0
        ? Number(((stat.totalCorrected / stat.totalExtracted) * 100).toFixed(2))
        : 0;

      const item: FactCorrectionStat = {
        key,
        totalExtracted: stat.totalExtracted,
        totalCorrected: stat.totalCorrected,
        correctionRate: rate,
      };

      correctionRatePerKey[key] = item;
      statsList.push(item);
    }

    // Top 5 most corrected fields by count then rate
    statsList.sort((a, b) => b.totalCorrected - a.totalCorrected || b.correctionRate - a.correctionRate);
    const top5MostCorrectedFields = statsList.slice(0, 5);

    const overallCorrectionRate = totalFactsCount > 0
      ? Number(((totalCorrectionsCount / totalFactsCount) * 100).toFixed(2))
      : 0;

    return {
      totalFactsCount,
      totalCorrectionsCount,
      overallCorrectionRate,
      correctionRatePerKey,
      top5MostCorrectedFields,
      sampleCorrections: sampleCorrections.slice(0, 20),
    };
  } catch {
    return getDemoCorrectionAnalytics();
  }
}
