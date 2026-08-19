import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import type { StandardPhraseTemplate } from "../../types/comments.ts";

export const DEFAULT_STANDARD_TEMPLATES: Array<Omit<StandardPhraseTemplate, "templateId" | "createdAt" | "updatedAt">> = [
  {
    name: "Pindaan TLK Kereta",
    category: "PARKING",
    text: "Penyediaan petak tempat letak kereta (TLK) didapati tidak mencukupi berdasarkan piawaian garis panduan. Pemohon disyorkan mengemukakan pelan susunatur terpinda bagi memenuhi keperluan minimum.",
    isLocked: false,
    status: "ACTIVE",
    version: 1,
    approvedBy: "SYSTEM",
  },
  {
    name: "Penyediaan Kawasan Lapang",
    category: "OPEN_SPACE",
    text: "Penyediaan kawasan lapang berfungsi hendaklah mematuhi peruntukan 10% daripada keluasan kasar tapak pembangunan seperti yang digariskan.",
    isLocked: false,
    status: "ACTIVE",
    version: 1,
    approvedBy: "SYSTEM",
  },
  {
    name: "Pengesahan Zon RTD",
    category: "RTD",
    text: "Guna tanah yang dicadangkan adalah bersyarat di bawah peruntukan Rancangan Tempatan Langkawi 2030 dan memerlukan perakuan jawatankuasa teknikal.",
    isLocked: false,
    status: "ACTIVE",
    version: 1,
    approvedBy: "SYSTEM",
  },
];

export async function getStandardTemplates(customDb?: Firestore): Promise<StandardPhraseTemplate[]> {
  const db = customDb || getAdminDb();
  const snap = await db.collection("commentTemplates").where("status", "==", "ACTIVE").get();
  if (snap.empty) {
    return DEFAULT_STANDARD_TEMPLATES.map((t, idx) => ({
      ...t,
      templateId: `tpl-default-${idx + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
  return snap.docs.map((d) => d.data() as StandardPhraseTemplate);
}

export async function createStandardTemplate(
  payload: Omit<StandardPhraseTemplate, "templateId" | "createdAt" | "updatedAt">,
  adminUid: string,
  customDb?: Firestore
): Promise<StandardPhraseTemplate> {
  const db = customDb || getAdminDb();
  const templateId = `tpl-${Date.now()}`;
  const now = new Date().toISOString();

  const doc: StandardPhraseTemplate = {
    ...payload,
    templateId,
    approvedBy: adminUid,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("commentTemplates").doc(templateId).set({
    ...doc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return doc;
}
