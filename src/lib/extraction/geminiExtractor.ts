import type {
  NormalizedDocument,
  PlanningFact,
  FactCategory,
  ConfidenceLevel,
  FactConflict,
} from "../../types/extraction.ts";
import {
  normalizeArea,
  normalizePlotRatio,
  normalizePercentage,
  normalizeInteger,
  normalizeDistance,
  normalizeUnitText,
} from "./normalizers.ts";

export const LCP_AI_PROMPT_VERSION = "v1.0.0-mp-lbp";
export const LCP_AI_MODEL_NAME = "gemini-1.5-pro";

/**
 * Gemini 1.5 Pro Controlled JSON Response Schema (Inference-time structure enforcement)
 */
export const GEMINI_CONTROLLED_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    facts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          label: { type: "STRING" },
          category: { type: "STRING" },
          rawValue: { type: "STRING", nullable: true },
          rawUnit: { type: "STRING", nullable: true },
          confidence: { type: "NUMBER" },
          evidence: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                pageNumber: { type: "INTEGER" },
                quotedText: { type: "STRING" },
                tableReference: { type: "STRING", nullable: true },
              },
              required: ["pageNumber", "quotedText"],
            },
          },
        },
        required: ["key", "label", "category", "confidence"],
      },
    },
  },
  required: ["facts"],
} as const;

/**
 * Gemini Request Generation Config enforcing application/json MIME type and responseSchema
 */
export const GEMINI_REQUEST_CONFIG = {
  model: LCP_AI_MODEL_NAME,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: GEMINI_CONTROLLED_JSON_SCHEMA,
    temperature: 0.1,
  },
};

export interface ExtractFactsOptions {
  documentType?: string;
  pageImages?: Array<{ pageNumber: number; mimeType: string; base64Data: string }>;
}

export interface ExtractionResult {
  facts: PlanningFact[];
  conflicts: FactConflict[];
  totalPages: number;
  isMultimodal?: boolean;
}

/**
 * Detects conflicts / contradictory candidate values across multiple page extractions
 */
export function detectFactConflicts(facts: PlanningFact[]): FactConflict[] {
  const conflicts: FactConflict[] = [];

  for (const fact of facts) {
    if (fact.status === "CONFLICT") {
      conflicts.push({
        key: fact.key,
        candidateValues: fact.sourceEvidence.map((ev) => ({
          value: fact.value,
          pageNumber: ev.pageNumber,
          quotedText: ev.quotedText,
        })),
      });
    }
  }

  return conflicts;
}

/**
 * Executes a live call to Gemini 1.5 Pro API when GEMINI_API_KEY is present
 */
async function callGeminiApiLive(
  doc: NormalizedDocument,
  applicationId: string,
  documentVersion: number,
  options?: ExtractFactsOptions
): Promise<PlanningFact[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const promptText = `Extract all Malaysian Planning Facts (LCP parameters) from the following document text and tables.
Output strict JSON adhering to the provided response schema. Include exact quoted evidence and page numbers.

DOCUMENT CONTENT:
${doc.pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join("\n\n")}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              ...(options?.pageImages || []).map((img) => ({
                inlineData: { mimeType: img.mimeType, data: img.base64Data },
              })),
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_CONTROLLED_JSON_SCHEMA,
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Gemini API call returned status ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as {
      facts?: Array<{
        key: string;
        label?: string;
        category?: string;
        rawValue?: unknown;
        rawUnit?: string | null;
        confidence?: number;
        evidence?: Array<{ pageNumber?: number; quotedText?: string; tableReference?: string | null }>;
      }>;
    };

    if (!parsed.facts || !Array.isArray(parsed.facts)) return null;

    const now = new Date().toISOString();
    return parsed.facts.map((f) => {
      const isFound = f.rawValue !== null && f.rawValue !== undefined && String(f.rawValue).trim() !== "";
      const conf = f.confidence ?? 0.9;
      return {
        factId: `${f.key}_v${documentVersion}`,
        applicationId,
        documentId: doc.documentId,
        documentVersion,
        key: f.key,
        label: f.label || f.key,
        category: (f.category as FactCategory) || "SITE",
        value: isFound ? f.rawValue : null,
        unit: normalizeUnitText(f.rawUnit || null),
        normalizedValue: (isFound ? f.rawValue : null) as string | number | boolean | null,
        status: isFound ? "EXTRACTED" : "NOT_FOUND",
        confidence: conf,
        confidenceLevel: conf >= 0.9 ? "HIGH" : conf >= 0.7 ? "MEDIUM" : "LOW",
        sourceEvidence: (f.evidence || []).map((e) => ({
          documentId: doc.documentId,
          documentVersion,
          pageNumber: e.pageNumber || 1,
          quotedText: e.quotedText || "",
          tableReference: e.tableReference || null,
        })),
        aiGenerated: true,
        confirmedValue: null,
        confirmedBy: null,
        confirmedAt: null,
        createdAt: now,
        updatedAt: now,
      };
    });
  } catch (err) {
    console.warn("Gemini API call failed:", err);
    return null;
  }
}

const STANDARD_FACT_DEFS: Array<{
  key: string;
  label: string;
  category: FactCategory;
  normalizer: (val: unknown) => number | string | boolean | null;
  unit: string | null;
  regexList: RegExp[];
}> = [
  {
    key: "projectTitle",
    label: "Tajuk Projek Cadangan",
    category: "PROJECT",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/TAJUK CADANGAN:\s*([^\n]+)/i, /CADANGAN PEMBANGUNAN\s+([^\n]+)/i],
  },
  {
    key: "developmentType",
    label: "Jenis Pembangunan Utama",
    category: "PROJECT",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/Guna Tanah Dicadangkan:\s*([^\n]+)/i, /(HOTEL|PERUMAHAN|PERNIAGAAN|KOMERSIAL)/i],
  },
  {
    key: "applicantName",
    label: "Nama Pemaju / Pemohon",
    category: "PROJECT",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/PEMOHON(?:\s*\/\s*PEMAJU)?:\s*([^\n]+)/i],
  },
  {
    key: "consultantName",
    label: "Jururancang Bandar / PSP",
    category: "PROJECT",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/JURURANCANG BANDAR:\s*([^\n]+)/i],
  },
  {
    key: "lotNumber",
    label: "Nombor Lot Tanah",
    category: "SITE",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/Nombor Lot:\s*(Lot\s*\d+)/i, /(Lot\s*\d+)/i],
  },
  {
    key: "mukim",
    label: "Mukim",
    category: "SITE",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/Mukim:\s*([A-Za-z]+)/i, /Mukim\s+([A-Za-z]+)/i],
  },
  {
    key: "district",
    label: "Daerah",
    category: "SITE",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/Daerah:\s*([A-Za-z]+)/i, /Daerah\s+([A-Za-z]+)/i],
  },
  {
    key: "siteAreaSqm",
    label: "Keluasan Tapak",
    category: "SITE",
    normalizer: normalizeArea,
    unit: "m²",
    regexList: [/Keluasan Tapak:\s*([\d,.]+)\s*(m²|Hektar)?/i],
  },
  {
    key: "proposedLandUse",
    label: "Guna Tanah Dicadangkan",
    category: "LAND_USE",
    normalizer: (v) => (v ? String(v) : null),
    unit: null,
    regexList: [/Guna Tanah Dicadangkan:\s*([^\n]+)/i],
  },
  {
    key: "grossFloorAreaSqm",
    label: "Jumlah Keluasan Lantai Kasar (GFA)",
    category: "INTENSITY",
    normalizer: normalizeArea,
    unit: "m²",
    regexList: [/Keluasan Lantai Kasar(?:\s*\(GFA\))?:\s*([\d,.]+)/i],
  },
  {
    key: "plotRatio",
    label: "Nisbah Plot",
    category: "INTENSITY",
    normalizer: normalizePlotRatio,
    unit: null,
    regexList: [/Nisbah Plot(?:\s*\(Plot Ratio\))?:\s*(?:1:)?([\d.]+)/i],
  },
  {
    key: "buildingCoveragePercent",
    label: "Liputan Bangunan (Plinth Area %)",
    category: "INTENSITY",
    normalizer: normalizePercentage,
    unit: "%",
    regexList: [/Liputan Bangunan(?:\s*\(Plinth Area\))?:\s*([\d.]+)%/i],
  },
  {
    key: "numberOfFloors",
    label: "Bilangan Tingkat Maksimum",
    category: "BUILDING",
    normalizer: normalizeInteger,
    unit: "Tingkat",
    regexList: [/Ketinggian(?:\s*Bangunan)?:\s*(\d+)\s*Tingkat/i],
  },
  {
    key: "maximumBuildingHeightMeters",
    label: "Ketinggian Bangunan",
    category: "BUILDING",
    normalizer: normalizeDistance,
    unit: "m",
    regexList: [/\(([\d.]+)\s*meter\)/i, /Ketinggian.*:\s*([\d.]+)\s*m/i],
  },
  {
    key: "carParkingProvided",
    label: "Tempat Letak Kereta (Petak)",
    category: "PARKING",
    normalizer: normalizeInteger,
    unit: "petak",
    regexList: [/(?:Jumlah )?Tempat Letak Kereta[^\n]*:\s*(\d+)[^\n]*/i],
  },
  {
    key: "motorcycleParkingProvided",
    label: "Tempat Letak Motosikal (Petak)",
    category: "PARKING",
    normalizer: normalizeInteger,
    unit: "petak",
    regexList: [/(?:Jumlah )?Tempat Letak Motosikal[^\n]*:\s*(\d+)[^\n]*/i],
  },
  {
    key: "disabledParkingProvided",
    label: "Tempat Letak Kereta OKU",
    category: "PARKING",
    normalizer: normalizeInteger,
    unit: "petak",
    regexList: [/(?:Jumlah )?Tempat Letak (?:Kereta )?OKU[^\n]*:\s*(\d+)[^\n]*/i],
  },
  {
    key: "openSpaceAreaSqm",
    label: "Kawasan Lapang (m²)",
    category: "OPEN_SPACE",
    normalizer: normalizeArea,
    unit: "m²",
    regexList: [/Kawasan Lapang.*:\s*([\d,.]+)\s*m²/i],
  },
  {
    key: "openSpacePercent",
    label: "Peratusan Kawasan Lapang (%)",
    category: "OPEN_SPACE",
    normalizer: normalizePercentage,
    unit: "%",
    regexList: [/Kawasan Lapang.*:\s*[\d,. ]+m²\s*\(([\d.]+)%\)/i],
  },
  {
    key: "totalResidentialUnits",
    label: "Jumlah Unit Kediaman",
    category: "HOUSING",
    normalizer: normalizeInteger,
    unit: "unit",
    regexList: [/Jumlah Unit Kediaman:\s*(\d+)/i, /(\d+)\s*UNIT RUMAH TERES/i],
  },
  {
    key: "hotelRooms",
    label: "Jumlah Bilik Hotel",
    category: "BUILDING",
    normalizer: normalizeInteger,
    unit: "bilik",
    regexList: [/Jumlah Bilik Hotel:\s*(\d+)/i, /(\d+)\s*bilik hotel/i],
  },
];

/**
 * Dynamic regex-based text extraction for offline mode
 */
function extractFactsFromDocumentText(
  doc: NormalizedDocument,
  addFact: (
    key: string,
    label: string,
    category: FactCategory,
    rawValue: unknown,
    rawUnit: string | null,
    normalizer: (val: unknown) => number | string | boolean | null,
    confidence: number,
    evidence: { pageNumber: number; quotedText: string; tableReference?: string | null }[]
  ) => void
) {
  const extractedKeys = new Set<string>();

  for (const page of doc.pages) {
    const text = page.text;
    const pageNum = page.pageNumber;

    for (const def of STANDARD_FACT_DEFS) {
      if (extractedKeys.has(def.key)) continue;

      for (const rx of def.regexList) {
        const match = text.match(rx);
        if (match) {
          const rawVal = match[1] || match[0];
          extractedKeys.add(def.key);
          addFact(def.key, def.label, def.category, rawVal, def.unit, def.normalizer, 0.95, [
            { pageNumber: pageNum, quotedText: match[0] },
          ]);
          break;
        }
      }
    }
  }

  // Populate any unextracted required/standard keys with status NOT_FOUND and confidence 0
  for (const def of STANDARD_FACT_DEFS) {
    if (!extractedKeys.has(def.key)) {
      addFact(def.key, def.label, def.category, null, def.unit, def.normalizer, 0, []);
    }
  }
}

/**
 * Extracts structured Malaysian Planning Facts from normalized LCP document pages.
 * Enforces strict planning guardrails, zero hallucinations, source quotes, and deterministic normalizers.
 */
export async function extractPlanningFactsFromDocument(
  doc: NormalizedDocument,
  applicationId: string,
  documentVersion: number,
  options?: ExtractFactsOptions
): Promise<ExtractionResult> {
  const docType = options?.documentType || "LCP";
  const LAYOUT_DRIVEN_TYPES = ["SITE_PLAN", "LAYOUT_PLAN", "LOCATION_PLAN", "BUILDING_PLAN"];
  const isLayoutDriven = LAYOUT_DRIVEN_TYPES.includes(docType);
  const isMultimodalEnabled = Boolean(isLayoutDriven && options?.pageImages && options.pageImages.length > 0);

  // Attempt live Gemini API call first if key is configured
  const liveFacts = await callGeminiApiLive(doc, applicationId, documentVersion, options);
  if (liveFacts && liveFacts.length > 0) {
    verifyEvidenceQuotes(liveFacts, doc);
    const conflicts = detectFactConflicts(liveFacts);
    return {
      facts: liveFacts,
      conflicts,
      totalPages: doc.totalPages,
      isMultimodal: isMultimodalEnabled,
    };
  }

  // Fallback to dynamic text extraction
  const facts: PlanningFact[] = [];
  const now = new Date().toISOString();

  const addFact = (
    key: string,
    label: string,
    category: FactCategory,
    rawValue: unknown,
    rawUnit: string | null,
    normalizer: (val: unknown) => number | string | boolean | null,
    confidence: number,
    evidence: { pageNumber: number; quotedText: string; tableReference?: string | null }[]
  ) => {
    const isFound = rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== "";
    const validEvidence = evidence.filter(
      (e) => Boolean(e.pageNumber && e.pageNumber > 0 && e.quotedText && e.quotedText.trim() !== "")
    );
    const isConflict = validEvidence.length > 1 && new Set(validEvidence.map((e) => e.quotedText.trim())).size > 1;

    let score = isFound ? Math.min(1.0, Math.max(0, confidence)) : 0;

    if (validEvidence.length === 0 && isFound) {
      score = Math.min(score, 0.89);
    }

    let confLevel: ConfidenceLevel = "LOW";
    if (isFound && score >= 0.9 && validEvidence.length > 0) {
      confLevel = "HIGH";
    } else if (isFound && score >= 0.7) {
      confLevel = "MEDIUM";
    } else {
      confLevel = "LOW";
    }

    const normalized = isFound ? normalizer(rawValue) : null;

    const fact: PlanningFact = {
      factId: `${key}_v${documentVersion}`,
      applicationId,
      documentId: doc.documentId,
      documentVersion,
      key,
      label,
      category,
      value: isFound ? rawValue : null,
      unit: normalizeUnitText(rawUnit),
      normalizedValue: normalized,
      status: isConflict ? "CONFLICT" : isFound ? "EXTRACTED" : "NOT_FOUND",
      confidence: score,
      confidenceLevel: confLevel,
      sourceEvidence: validEvidence.map((e) => ({
        documentId: doc.documentId,
        documentVersion,
        pageNumber: e.pageNumber,
        quotedText: e.quotedText.trim(),
        tableReference: e.tableReference || null,
      })),
      aiGenerated: true,
      confirmedValue: null,
      confirmedBy: null,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    facts.push(fact);
  };

  extractFactsFromDocumentText(doc, addFact);
  verifyEvidenceQuotes(facts, doc);

  const conflicts = detectFactConflicts(facts);

  return {
    facts,
    conflicts,
    totalPages: doc.totalPages,
    isMultimodal: isMultimodalEnabled,
  };
}

/**
 * Computes 3-gram character Sørensen-Dice similarity coefficient (0.0 to 1.0)
 */
export function computeTextSimilarity(strA: string, strB: string): number {
  const normA = strA.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normB = strB.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!normA || !normB) return 0;
  if (normA === normB || normB.includes(normA) || normA.includes(normB)) return 1.0;

  const getNgrams = (str: string, n = 3): Set<string> => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.substring(i, i + n));
    }
    return ngrams;
  };

  const ngramsA = getNgrams(normA);
  const ngramsB = getNgrams(normB);

  if (ngramsA.size === 0 || ngramsB.size === 0) return 0;

  let intersection = 0;
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) intersection++;
  }

  return (2 * intersection) / (ngramsA.size + ngramsB.size);
}

/**
 * Verifies quoted evidence text against actual NormalizedDocument text.
 * Flags unverifiable/fabricated quotes with evidenceVerified: false and downgrades confidence to LOW.
 */
export function verifyEvidenceQuotes(facts: PlanningFact[], doc: NormalizedDocument): void {
  const docFullText = doc.pages.map((p) => p.text).join("\n");

  for (const fact of facts) {
    if (fact.status === "NOT_FOUND" || fact.sourceEvidence.length === 0) {
      fact.evidenceVerified = true;
      continue;
    }

    let allEvidenceVerified = true;

    for (const ev of fact.sourceEvidence) {
      const page = doc.pages.find((p) => p.pageNumber === ev.pageNumber);
      const targetText = page ? page.text : docFullText;
      const sim = computeTextSimilarity(ev.quotedText, targetText);

      if (sim >= 0.8) {
        ev.evidenceVerified = true;
      } else {
        ev.evidenceVerified = false;
        allEvidenceVerified = false;
      }
    }

    fact.evidenceVerified = allEvidenceVerified;

    if (!allEvidenceVerified) {
      fact.confidenceLevel = "LOW";
      fact.confidence = Math.min(fact.confidence, 0.49);
    }
  }
}
