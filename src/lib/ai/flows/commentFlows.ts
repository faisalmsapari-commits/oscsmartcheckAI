import { OscDraftSchema, ResultExplanationSchema, IssueDraftSchema } from "../../validation/comments.schema.ts";
import type {
  PlanningCommentContext,
  StructuredOscDraft,
  CategoryCommentSection,
  SourceReference,
} from "../../../types/comments.ts";

/**
 * Converts deterministic technical result into concise planning explanation
 */
export async function generateResultExplanation(
  resultId: string,
  context: PlanningCommentContext
): Promise<{
  summary: string;
  technicalExplanation: string;
  planningImplication: string;
  evidenceReferences: string[];
  limitations?: string | null;
}> {
  const res = context.results.find((r) => r.ruleId === resultId);
  if (!res) {
    throw new Error(`Keputusan semakan ${resultId} tidak dijumpai dalam konteks.`);
  }

  const isCompliant = res.machineStatus === "COMPLIANT";
  const summary = isCompliant
    ? `Kriteria ${res.ruleName} mematuhi garis panduan piawaian.`
    : `Kriteria ${res.ruleName} dikesan ${res.machineStatus} dengan perbezaan ${res.difference ?? "-"}.`;

  const technicalExplanation = `Berdasarkan ${res.ruleEvidence.sourceDocumentId || "Garis Panduan"} (Klausa ${
    res.ruleEvidence.sourceClause
  }), keperluan adalah ${String(res.requiredValue)} ${res.unit || ""} berbanding penyediaan ${String(
    res.actualValue
  )} ${res.unit || ""}.`;

  const planningImplication = isCompliant
    ? "Tiada pindaan fizikal diperlukan bagi komponen ini."
    : "Pindaan pelan susunatur atau justifikasi teknikal diperlukan sebelum pertimbangan jawatankuasa.";

  const evidenceRefs = [res.ruleCode, res.ruleEvidence.sourceClause];

  const parsed = ResultExplanationSchema.parse({
    summary,
    technicalExplanation,
    planningImplication,
    evidenceReferences: evidenceRefs,
    limitations: null,
  });

  return parsed;
}

/**
 * Drafts officer-editable comment for a specific issue
 */
export async function generateIssueDraftComment(
  issueId: string,
  context: PlanningCommentContext
): Promise<{
  draftComment: string;
  recommendedAction: string;
  evidenceRefs: string[];
}> {
  const issue = context.issues.find((i) => i.issueId === issueId);
  if (!issue) {
    throw new Error(`Isu ${issueId} tidak dijumpai dalam konteks.`);
  }

  const res = context.results.find((r) => r.ruleCode === issue.ruleCode);

  let draftComment = `Berdasarkan pra-semakan sistem, penemuan bagi kriteria ${issue.title} menunjukkan ${issue.description}.`;
  let recommendedAction = "Pemohon disyorkan mengemukakan pindaan dokumen atau pelan susunatur.";

  if (res) {
    draftComment = `Penyediaan bagi ${res.ruleName} adalah sebanyak ${String(res.actualValue)} ${
      res.unit || ""
    } berbanding keperluan ${String(res.requiredValue)} ${res.unit || ""} (Klausa ${
      res.ruleEvidence.sourceClause
    }). Sehubungan itu, pemohon disyorkan menyemak semula cadangan atau mengemukakan justifikasi teknikal untuk pertimbangan pegawai.`;
    recommendedAction = `Kemukakan pelan susunatur terpinda bagi memenuhi keperluan minimum ${String(
      res.requiredValue
    )} ${res.unit || ""}.`;
  }

  const parsed = IssueDraftSchema.parse({
    draftComment,
    recommendedAction,
    evidenceRefs: res ? [res.ruleCode, res.ruleEvidence.sourceClause] : [issue.ruleCode],
  });

  return parsed;
}

/**
 * Generates full structured OSC draft comment
 */
export async function generateOscDraftComment(
  context: PlanningCommentContext,
  style: "CONCISE" | "STANDARD" | "DETAILED" = "STANDARD"
): Promise<StructuredOscDraft> {
  void style;
  const { application, smartCheck, results, issues, officerAssessments } = context;

  // 1. Executive Summary
  const nonCompliant = results.filter((r) => r.machineStatus === "NON_COMPLIANT");
  const reviewRequired = results.filter((r) => r.machineStatus === "REQUIRES_REVIEW");

  let executiveSummary = `Permohonan Kebenaran Merancang ${application.applicationNo} bagi ${application.projectTitle} telah melalui pra-semakan SmartCheck Rule Engine v${context.sourceVersions.ruleEngineVersion}. Hasil pra-semakan mendapati status keseluruhan adalah ${smartCheck.overallStatus}. Sebanyak ${smartCheck.compliantCount} daripada ${smartCheck.totalRulesEvaluated} kriteria mematuhi garis panduan piawaian.`;
  if (nonCompliant.length > 0) {
    executiveSummary += ` Terdapat ${nonCompliant.length} kriteria tidak patuh dan ${reviewRequired.length} kriteria memerlukan pengesahan pegawai.`;
  }

  // 2. Planning Context
  const planningContext = `Cadangan pembangunan jenis ${application.developmentType} terletak di Mukim ${
    application.mukim
  } melibatkan Lot ${application.lotNumbers.join(", ")}. Berdasarkan Pelan Tempatan Langkawi (RTD 2030), zon guna tanah utama adalah mengikut peruntukan semasa.`;

  // 3. Category Comments
  const categoryComments: CategoryCommentSection[] = [];
  const categories = Array.from(new Set(results.map((r) => r.category)));

  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catNonCompliant = catResults.filter((r) => r.machineStatus === "NON_COMPLIANT");
    const catSummary =
      catNonCompliant.length === 0
        ? `Semakan bagi kategori ${cat} mematuhi kriteria asas perancangan.`
        : `Terdapat ${catNonCompliant.length} penemuan tidak patuh dalam kategori ${cat}.`;

    const findings = catResults.map((r) => {
      const assessment = officerAssessments.find((a) => a.resultId === r.ruleId);
      let text = `${r.ruleName} (${r.ruleCode}): Status ${r.machineStatus} [Sebenar: ${String(
        r.actualValue
      )} / Perlu: ${String(r.requiredValue)}] - Klausa ${r.ruleEvidence.sourceClause}.`;
      if (assessment && assessment.assessment === "DISAGREE") {
        text += ` (Nota Pegawai: Tidak bersetuju dengan dapatan sistem atas sebab: ${assessment.reason})`;
      }
      return text;
    });

    categoryComments.push({
      category: cat,
      summary: catSummary,
      findings,
      actionRequired:
        catNonCompliant.length > 0 ? "Pindaan pelan atau justifikasi bertulis diperlukan." : null,
      evidenceRefs: catResults.map((r) => r.ruleCode),
    });
  }

  // 4. Issues Requiring Action
  const issuesRequiringAction = issues
    .filter((i) => i.status === "OPEN" || i.status === "IN_REVIEW" || i.status === "WAITING_APPLICANT")
    .map((i) => ({
      issueId: i.issueId,
      ruleCode: i.ruleCode,
      description: i.description,
      recommendedAction:
        i.officerCommentDraft ||
        `Sila kemukakan pindaan dokumen/pelan bagi kriteria ${i.ruleCode} untuk semakan lanjut.`,
    }));

  // 5. Officer Judgement Items
  const officerJudgementItems = reviewRequired.map((r) => {
    const assessment = officerAssessments.find((a) => a.resultId === r.ruleId);
    return {
      ruleCode: r.ruleCode,
      finding: r.ruleName,
      officerAssessment: assessment ? `${assessment.assessment}: ${assessment.reason}` : "Belum diulas",
      implication: "Memerlukan pertimbangan teknikal pegawai penilai sebelum perakuan jawatankuasa.",
    };
  });

  // 6. Recommended Actions
  const recommendedApplicantActions: string[] = [];
  if (nonCompliant.length > 0) {
    recommendedApplicantActions.push("Kemukakan pelan susunatur terpinda mematuhi kriteria yang belum dicapai.");
  }
  if (reviewRequired.length > 0) {
    recommendedApplicantActions.push("Sediakan dokumen sokongan tambahan bagi kriteria bersyarat.");
  }
  if (recommendedApplicantActions.length === 0) {
    recommendedApplicantActions.push("Semua keperluan pra-semakan dipenuhi. Permohonan sedia untuk proses semakan seterusnya.");
  }

  // 7. Conclusion Draft
  const conclusionDraft = `Draf ulasan ini disediakan secara automatik berasaskan pra-semakan SmartCheck dan tertakluk kepada semakan, pengeditan serta pengesahan rasmi pegawai penilai OSC MPLBP.`;

  // 8. Source References
  const sourceReferences: SourceReference[] = results.map((r) => ({
    type: "RULE",
    ruleCode: r.ruleCode,
    document: r.ruleEvidence.sourceDocumentId,
    clause: r.ruleEvidence.sourceClause,
    page: r.ruleEvidence.sourcePage,
  }));

  const structuredDraft: StructuredOscDraft = {
    executiveSummary,
    planningContext,
    categoryComments,
    issuesRequiringAction,
    officerJudgementItems,
    recommendedApplicantActions,
    conclusionDraft,
    sourceReferences,
    warnings: [],
  };

  return OscDraftSchema.parse(structuredDraft);
}

/**
 * Formats Structured OSC Draft into complete readable Markdown text
 */
export function formatDraftToMarkdown(draft: StructuredOscDraft): string {
  let md = `## RINGKASAN EKSEKUTIF\n${draft.executiveSummary}\n\n`;
  md += `## KONTEKS PERANCANGAN\n${draft.planningContext}\n\n`;

  md += `## ULASAN MENGIKUT KATEGORI\n`;
  for (const cat of draft.categoryComments) {
    md += `### ${cat.category}\n${cat.summary}\n`;
    for (const f of cat.findings) {
      md += `- ${f}\n`;
    }
    if (cat.actionRequired) {
      md += `*Tindakan:* ${cat.actionRequired}\n`;
    }
    md += `\n`;
  }

  if (draft.issuesRequiringAction.length > 0) {
    md += `## ISU YANG MEMERLUKAN PINDAAN PEMOHON\n`;
    for (const iss of draft.issuesRequiringAction) {
      md += `- **${iss.ruleCode}:** ${iss.description}\n  *Saranan Tindakan:* ${iss.recommendedAction}\n`;
    }
    md += `\n`;
  }

  if (draft.officerJudgementItems.length > 0) {
    md += `## PERKARA MEMERLUKAN PERTIMBANGAN PEGAWAI\n`;
    for (const j of draft.officerJudgementItems) {
      md += `- **${j.ruleCode} (${j.finding}):** ${j.officerAssessment}\n  *Implikasi:* ${j.implication}\n`;
    }
    md += `\n`;
  }

  md += `## CADANGAN TINDAKAN PEMOHON\n`;
  for (const act of draft.recommendedApplicantActions) {
    md += `1. ${act}\n`;
  }
  md += `\n`;

  md += `## KESIMPULAN DRAF\n${draft.conclusionDraft}\n`;

  return md;
}
