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
        normalizedValue: isFound ? f.rawValue : null,
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
  for (const page of doc.pages) {
    const text = page.text;
    const pageNum = page.pageNumber;

    const lotMatch = text.match(/(?:Nombor Lot|Lot)\s*:\s*(Lot\s*\d+)/i) || text.match(/(Lot\s*\d+)/i);
    if (lotMatch) {
      addFact("lotNumber", "Nombor Lot Tanah", "SITE", lotMatch[1], null, (v) => String(v), 0.95, [
        { pageNumber: pageNum, quotedText: lotMatch[0] },
      ]);
    }

    const mukimMatch = text.match(/Mukim\s*:\s*([A-Za-z]+)/i) || text.match(/Mukim\s+([A-Za-z]+)/i);
    if (mukimMatch) {
      addFact("mukim", "Mukim", "SITE", mukimMatch[1], null, (v) => String(v), 0.95, [
        { pageNumber: pageNum, quotedText: mukimMatch[0] },
      ]);
    }

    const distMatch = text.match(/Daerah\s*:\s*([A-Za-z]+)/i) || text.match(/Daerah\s+([A-Za-z]+)/i);
    if (distMatch) {
      addFact("district", "Daerah", "SITE", distMatch[1], null, (v) => String(v), 0.95, [
        { pageNumber: pageNum, quotedText: distMatch[0] },
      ]);
    }

    const siteAreaMatch = text.match(/Keluasan Tapak\s*:\s*([\d,.]+)\s*(m²|Hektar)?/i);
    if (siteAreaMatch) {
      addFact("siteAreaSqm", "Keluasan Tapak", "SITE", siteAreaMatch[1], siteAreaMatch[2] || "m²", normalizeArea, 0.95, [
        { pageNumber: pageNum, quotedText: siteAreaMatch[0] },
      ]);
    }

    const gfaMatch = text.match(/Keluasan Lantai Kasar(?:\s*\(GFA\))?\s*:\s*([\d,.]+)/i);
    if (gfaMatch) {
      addFact("grossFloorAreaSqm", "Jumlah GFA", "INTENSITY", gfaMatch[1], "m²", normalizeArea, 0.95, [
        { pageNumber: pageNum, quotedText: gfaMatch[0] },
      ]);
    }

    const prMatch = text.match(/Nisbah Plot(?:\s*\(Plot Ratio\))?\s*:\s*(?:1:)?([\d.]+)/i);
    if (prMatch) {
      addFact("plotRatio", "Nisbah Plot", "INTENSITY", prMatch[1], null, normalizePlotRatio, 0.95, [
        { pageNumber: pageNum, quotedText: prMatch[0] },
      ]);
    }

    const bcMatch = text.match(/Liputan Bangunan(?:\s*\(Plinth Area\))?\s*:\s*([\d.]+)%/i);
    if (bcMatch) {
      addFact("buildingCoveragePercent", "Liputan Bangunan", "INTENSITY", bcMatch[1], "%", normalizePercentage, 0.95, [
        { pageNumber: pageNum, quotedText: bcMatch[0] },
      ]);
    }

    const floorMatch = text.match(/Ketinggian(?:\s*Bangunan)?\s*:\s*(\d+)\s*Tingkat/i);
    if (floorMatch) {
      addFact("numberOfFloors", "Jumlah Tingkat", "BUILDING", floorMatch[1], "Tingkat", normalizeInteger, 0.95, [
        { pageNumber: pageNum, quotedText: floorMatch[0] },
      ]);
    }

    const heightMatch = text.match(/\(([\d.]+)\s*meter\)/i) || text.match(/Ketinggian.*:\s*([\d.]+)\s*m/i);
    if (heightMatch) {
      addFact("maximumBuildingHeightMeters", "Ketinggian Bangunan", "BUILDING", heightMatch[1], "m", normalizeDistance, 0.95, [
        { pageNumber: pageNum, quotedText: heightMatch[0] },
      ]);
    }

    const carMatch = text.match(/Tempat Letak Kereta\s*:\s*(\d+)/i);
    if (carMatch) {
      addFact("carParkingProvided", "Petak Kereta", "PARKING", carMatch[1], "petak", normalizeInteger, 0.95, [
        { pageNumber: pageNum, quotedText: carMatch[0] },
      ]);
    }

    const motoMatch = text.match(/Tempat Letak Motosikal\s*:\s*(\d+)/i);
    if (motoMatch) {
      addFact("motorcycleParkingProvided", "Petak Motosikal", "PARKING", motoMatch[1], "petak", normalizeInteger, 0.95, [
        { pageNumber: pageNum, quotedText: motoMatch[0] },
      ]);
    }

    const okuMatch = text.match(/Tempat Letak OKU\s*:\s*(\d+)/i);
    if (okuMatch) {
      addFact("disabledParkingProvided", "Petak OKU", "PARKING", okuMatch[1], "petak", normalizeInteger, 0.95, [
        { pageNumber: pageNum, quotedText: okuMatch[0] },
      ]);
    }

    const openSpaceMatch = text.match(/Kawasan Lapang\s*:\s*([\d,.]+)\s*m²/i);
    if (openSpaceMatch) {
      addFact("openSpaceAreaSqm", "Kawasan Lapang", "OPEN_SPACE", openSpaceMatch[1], "m²", normalizeArea, 0.95, [
        { pageNumber: pageNum, quotedText: openSpaceMatch[0] },
      ]);
    }

    const openSpacePctMatch = text.match(/Kawasan Lapang.*:\s*[\d,. ]+m²\s*\(([\d.]+)%\)/i);
    if (openSpacePctMatch) {
      addFact("openSpacePercent", "Peratus Kawasan Lapang", "OPEN_SPACE", openSpacePctMatch[1], "%", normalizePercentage, 0.95, [
        { pageNumber: pageNum, quotedText: openSpacePctMatch[0] },
      ]);
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
