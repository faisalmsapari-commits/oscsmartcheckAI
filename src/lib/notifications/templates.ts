import type { NotificationTemplate } from "../../types/workflow.ts";

export const NOTIFICATION_TEMPLATE_VERSION = "1.0.0";

/**
 * Standardized Official Notification Templates for MPLBP
 */
export const DEFAULT_NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  RFI_ISSUED: {
    templateId: "TPL_RFI_ISSUED_V1",
    eventType: "RFI_ISSUED",
    channel: "IN_APP",
    language: "ms",
    subject: "Tindakan Diperlukan: Permintaan Maklumat bagi Permohonan {{applicationNo}}",
    body: "Terdapat permintaan maklumat atau pelan pinda berkaitan '{{requestTitle}}' bagi permohonan {{applicationNo}}. Sila berikan maklum balas sebelum {{deadline}} melalui portal rasmi.",
    version: NOTIFICATION_TEMPLATE_VERSION,
    status: "ACTIVE",
    allowedVariables: ["applicationNo", "projectTitle", "requestTitle", "deadline", "portalUrl"],
  },
  APPLICANT_RESPONSE_SUBMITTED: {
    templateId: "TPL_RESPONSE_SUBMITTED_V1",
    eventType: "APPLICANT_RESPONSE_SUBMITTED",
    channel: "IN_APP",
    language: "ms",
    subject: "Maklum Balas Diterima: Permohonan {{applicationNo}}",
    body: "Pemohon telah mengemukakan maklum balas bagi permintaan maklumat permohonan {{applicationNo}}.",
    version: NOTIFICATION_TEMPLATE_VERSION,
    status: "ACTIVE",
    allowedVariables: ["applicationNo", "projectTitle", "portalUrl"],
  },
  REPORT_PUBLISHED: {
    templateId: "TPL_REPORT_PUBLISHED_V1",
    eventType: "REPORT_PUBLISHED",
    channel: "IN_APP",
    language: "ms",
    subject: "Laporan Rasmi SmartCheck Diterbitkan: Permohonan {{applicationNo}}",
    body: "Laporan rasmi pra-semakan pematuhan perancangan bagi permohonan {{applicationNo}} telah diterbitkan oleh Majlis Perbandaran Langkawi Bandaraya Pelancongan. Sila log masuk ke portal untuk muat turun.",
    version: NOTIFICATION_TEMPLATE_VERSION,
    status: "ACTIVE",
    allowedVariables: ["applicationNo", "projectTitle", "portalUrl"],
  },
  APPLICATION_COMPLETED: {
    templateId: "TPL_APPLICATION_COMPLETED_V1",
    eventType: "APPLICATION_COMPLETED",
    channel: "IN_APP",
    language: "ms",
    subject: "Proses SmartCheck Selesai: Permohonan {{applicationNo}}",
    body: "Penilaian pra-semakan OSC SmartCheck bagi permohonan {{applicationNo}} telah selesai diproses sepenuhnya. Sila rujuk portal untuk ulasan dan laporan rasmi.",
    version: NOTIFICATION_TEMPLATE_VERSION,
    status: "ACTIVE",
    allowedVariables: ["applicationNo", "projectTitle", "portalUrl"],
  },
};

/**
 * Safely renders a notification template with variable replacement
 */
export function renderNotificationTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  for (const [key, val] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(pattern, val);
    body = body.replace(pattern, val);
  }

  return { subject, body };
}
