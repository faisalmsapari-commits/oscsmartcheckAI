import { z } from "zod";

export const SourceReferenceSchema = z.object({
  type: z.enum(["RULE", "LCP", "GIS", "FACT"]),
  ruleCode: z.string().optional(),
  document: z.string().optional(),
  clause: z.string().optional(),
  page: z.number().optional(),
  documentVersion: z.number().optional(),
  description: z.string().optional(),
});

export const CategoryCommentSectionSchema = z.object({
  category: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(z.string()),
  actionRequired: z.string().nullable(),
  evidenceRefs: z.array(z.string()),
});

export const OscDraftSchema = z.object({
  executiveSummary: z.string().min(10),
  planningContext: z.string().min(10),
  categoryComments: z.array(CategoryCommentSectionSchema),
  issuesRequiringAction: z.array(
    z.object({
      issueId: z.string().optional(),
      ruleCode: z.string(),
      description: z.string(),
      recommendedAction: z.string(),
    })
  ),
  officerJudgementItems: z.array(
    z.object({
      ruleCode: z.string(),
      finding: z.string(),
      officerAssessment: z.string(),
      implication: z.string(),
    })
  ),
  recommendedApplicantActions: z.array(z.string()),
  conclusionDraft: z.string().min(10),
  sourceReferences: z.array(SourceReferenceSchema),
  warnings: z.array(z.string()).default([]),
});

export const ResultExplanationSchema = z.object({
  summary: z.string().min(5),
  technicalExplanation: z.string().min(10),
  planningImplication: z.string().min(5),
  evidenceReferences: z.array(z.string()),
  limitations: z.string().nullable().optional(),
});

export const IssueDraftSchema = z.object({
  draftComment: z.string().min(10).max(2000),
  recommendedAction: z.string().min(5),
  evidenceRefs: z.array(z.string()),
});

export const SaveOfficerDraftEditSchema = z.object({
  officerEditedText: z.string().min(10, "Kandungan ulasan sekurang-kurangnya 10 aksara"),
  expectedRevisionNumber: z.number().int().nonnegative().optional(),
});

export const VerifyCommentSchema = z.object({
  finalText: z.string().min(10, "Kandungan ulasan akhir wajib diisi"),
  confirmedByOfficer: z.boolean().refine((val) => val === true, {
    message: "Pengesahan pegawai wajib disahkan.",
  }),
});

export const PublishCommentSchema = z.object({
  publicationNote: z.string().max(1000).optional(),
});

export const StandardTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.string().min(2).max(50),
  text: z.string().min(5).max(2000),
  isLocked: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
