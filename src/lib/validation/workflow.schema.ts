import { z } from "zod";

export const RfiRequestTypeSchema = z.enum([
  "DOCUMENT",
  "CLARIFICATION",
  "PLAN_AMENDMENT",
  "TECHNICAL_INFORMATION",
  "GIS_INFORMATION",
  "OTHER",
]);

export const CreateRfiSchema = z.object({
  requestType: RfiRequestTypeSchema,
  title: z.string().min(3, "Tajuk permintaan mestilah sekurang-kurangnya 3 aksara."),
  description: z.string().min(5, "Penerangan permintaan mestilah sekurang-kurangnya 5 aksara."),
  relatedIssueIds: z.array(z.string()).optional().default([]),
  relatedResultIds: z.array(z.string()).optional().default([]),
  requiredDocumentTypes: z.array(z.string()).optional().default([]),
  requestedFields: z.array(z.string()).optional().default([]),
  responseDeadline: z.string().nullable().optional(),
  visibility: z.enum(["INTERNAL", "APPLICANT_VISIBLE"]).default("INTERNAL"),
});

export const AmendRfiSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  requiredDocumentTypes: z.array(z.string()).optional(),
  responseDeadline: z.string().nullable().optional(),
  reason: z.string().min(3, "Sebab pindaan permintaan maklumat diperlukan."),
});

export const ExtendRfiDeadlineSchema = z.object({
  newDeadline: z.string().min(10, "Tarikh akhir baru mestilah sah."),
  reason: z.string().min(3, "Sebab lanjutan tarikh akhir diperlukan."),
});

export const SubmitApplicantResponseSchema = z.object({
  responseText: z.string().optional().default(""),
  relatedDocumentIds: z.array(z.string()).optional().default([]),
});

export const ReviewApplicantResponseSchema = z.object({
  action: z.enum(["ACCEPT", "PARTIAL_ACCEPT", "REQUIRE_FURTHER"]),
  reviewComment: z.string().min(3, "Ulasan semakan pegawai diperlukan."),
});

export const CreateNotificationTemplateSchema = z.object({
  templateId: z.string().min(3),
  eventType: z.string().min(3),
  channel: z.enum(["IN_APP", "EMAIL", "PUSH", "SMS"]).default("IN_APP"),
  language: z.enum(["ms", "en"]).default("ms"),
  subject: z.string().min(3),
  body: z.string().min(5),
  allowedVariables: z.array(z.string()).default([]),
});

export const CaseCompletionRequestSchema = z.object({
  remarks: z.string().optional().default("Selesai proses penilaian SmartCheck."),
  confirmStatutoryNotice: z.boolean().refine((val) => val === true, {
    message: "Pegawai mesti mengesahkan pemahaman bahawa penyelesaian SmartCheck bukan kelulusan rasmi KM.",
  }),
});

export const ReopenCaseRequestSchema = z.object({
  reason: z.string().min(5, "Sebab pembukaan semula kes permohonan diperlukan."),
});
