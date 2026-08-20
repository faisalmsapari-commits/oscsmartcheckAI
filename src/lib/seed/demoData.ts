import type {
  CommentDraft,
  VerifiedComment,
  CommentReadinessResult,
  StandardPhraseTemplate,
} from "@/types/comments";

export interface DemoApplicationSeed {
  id: string;
  applicationNo: string;
  title: string;
  developmentType: string;
  developmentCategory: string;
  mukim: string;
  lotNo: string;
  status: string;
  currentVersion: number;
  applicantUid: string;
  applicantName: string;
  consultantName: string;
  estimatedCost: number;
  latitude: number;
  longitude: number;
  siteAreaSqm: number;
  createdAt: string;
  updatedAt: string;
  remarks: string;
  // Sub-collection items
  issuesCount: number;
  complianceScore: number;
}

export const DEMO_5_APPLICATIONS: DemoApplicationSeed[] = [
  {
    id: "app-demo-001",
    applicationNo: "KM/2026/000101",
    title: "Cadangan Pembangunan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
    developmentType: "HOTEL",
    developmentCategory: "PELANCONGAN",
    mukim: "Kedawang",
    lotNo: "Lot 1042",
    status: "COMPLETED",
    currentVersion: 2,
    applicantUid: "demo-applicant-uid",
    applicantName: "Perunding Arkitek Langkawi Sdn Bhd",
    consultantName: "Ar. Ahmad Zulkifli (LAM A/1245)",
    estimatedCost: 45000000,
    latitude: 6.2915,
    longitude: 99.7289,
    siteAreaSqm: 18500,
    createdAt: "2026-06-01T08:30:00Z",
    updatedAt: "2026-08-10T14:20:00Z",
    remarks: "Permohonan selesai diproses sepenuhnya dan Laporan Rasmi PDF diterbitkan.",
    issuesCount: 0,
    complianceScore: 100,
  },
  {
    id: "app-demo-002",
    applicationNo: "KM/2026/000102",
    title: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
    developmentType: "HOUSING",
    developmentCategory: "PERUMAHAN",
    mukim: "Kuah",
    lotNo: "Lot 3241",
    status: "OFFICER_REVIEW",
    currentVersion: 1,
    applicantUid: "demo-applicant-uid",
    applicantName: "Pembinaan Seri Kedah Sdn Bhd",
    consultantName: "Ar. Siti Fatimah (LAM A/1890)",
    estimatedCost: 28000000,
    latitude: 6.3265,
    longitude: 99.8432,
    siteAreaSqm: 24000,
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-08-16T11:45:00Z",
    remarks: "Pegawai perancang sedang menilai isu anjakan hadapan bangunan.",
    issuesCount: 1,
    complianceScore: 85,
  },
  {
    id: "app-demo-003",
    applicationNo: "KM/2026/000103",
    title: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
    developmentType: "COMMERCIAL",
    developmentCategory: "PERDAGANGAN",
    mukim: "Kuah",
    lotNo: "Lot 512",
    status: "REQUEST_INFORMATION",
    currentVersion: 1,
    applicantUid: "demo-applicant-uid",
    applicantName: "Syarikat Niaga Mahsuri Sdn Bhd",
    consultantName: "Ar. Tan Boon Huat (LAM A/2104)",
    estimatedCost: 16500000,
    latitude: 6.3198,
    longitude: 99.8512,
    siteAreaSqm: 9200,
    createdAt: "2026-07-20T10:15:00Z",
    updatedAt: "2026-08-14T16:30:00Z",
    remarks: "Pegawai OSC mengeluarkan RFI bagi pindaan kapasiti tempat letak kereta.",
    issuesCount: 2,
    complianceScore: 70,
  },
  {
    id: "app-demo-004",
    applicationNo: "KM/2026/000104",
    title: "Cadangan Pembangunan Bercampur (Pangsapuri Servis & Ruang Niaga Maritim)",
    developmentType: "MIXED_DEVELOPMENT",
    developmentCategory: "PEMBANGUNAN_BERCAMPUR",
    mukim: "Padang Matsirat",
    lotNo: "Lot 889",
    status: "RESUBMITTED",
    currentVersion: 2,
    applicantUid: "demo-applicant-uid",
    applicantName: "Marina Bay Langkawi Development Ltd",
    consultantName: "Ar. David Wong (LAM A/1550)",
    estimatedCost: 62000000,
    latitude: 6.3541,
    longitude: 99.7188,
    siteAreaSqm: 31000,
    createdAt: "2026-06-25T11:00:00Z",
    updatedAt: "2026-08-17T09:10:00Z",
    remarks: "Pemohon telah memuat naik pelan pinda LCP v2 berikutan ulasan teknikal.",
    issuesCount: 1,
    complianceScore: 90,
  },
  {
    id: "app-demo-005",
    applicationNo: "KM/2026/000105",
    title: "Cadangan Pusat Pemprosesan Makanan Laut & Gudang Logistik Sejuk Beku",
    developmentType: "INDUSTRIAL",
    developmentCategory: "INDUSTRI",
    mukim: "Ayer Hangat",
    lotNo: "Lot 1503",
    status: "VERIFIED",
    currentVersion: 1,
    applicantUid: "demo-applicant-uid",
    applicantName: "Langkawi Fisheries Logistics Sdn Bhd",
    consultantName: "Ir. Mohd Ridzuan (BEM 28411)",
    estimatedCost: 12000000,
    latitude: 6.4182,
    longitude: 99.8214,
    siteAreaSqm: 14500,
    createdAt: "2026-08-01T14:00:00Z",
    updatedAt: "2026-08-18T10:00:00Z",
    remarks: "Semakan enjin peraturan SmartCheck selesai dan disahkan pegawai.",
    issuesCount: 0,
    complianceScore: 100,
  },
];

// Alias for backwards compatibility
export const DEMO_10_APPLICATIONS = DEMO_5_APPLICATIONS;

export function getDemoApplication(id: string): DemoApplicationSeed {
  return DEMO_10_APPLICATIONS.find((a) => a.id === id || a.applicationNo === id) || DEMO_10_APPLICATIONS[0];
}

export function getDemoSmartCheckForApp(id: string) {
  const app = getDemoApplication(id);
  const isApp2 = app.id === "app-demo-002" || app.id === "app-demo-02";
  const isApp3 = app.id === "app-demo-003" || app.id === "app-demo-03";

  return [
    {
      ruleId: "RTD-ZONING-01",
      ruleCode: "RTD-ZONING-01",
      ruleName: "Pematuhan Pengezonan Guna Tanah RTD 2030",
      ruleSetId: "ruleset-langkawi-2030",
      ruleSetVersion: "1.0.0",
      category: "RTD",
      status: "COMPLIANT" as const,
      severity: "CRITICAL" as const,
      actualValue: app.developmentCategory,
      requiredValue: `Zon ${app.developmentCategory} / Bercampur`,
      difference: null,
      unit: "ZON",
      messageCode: "ZONING_MATCH",
      messageText: `Guna tanah ${app.developmentCategory} selaras dengan Rancangan Tempatan Daerah Langkawi 2030 (Mukim ${app.mukim}).`,
      inputEvidence: [
        {
          key: "proposedLandUse",
          value: app.title,
          sourceType: "LCP_CONFIRMED_FACT" as const,
          isConfirmed: true,
        },
      ],
      ruleEvidence: {
        sourceDocumentId: "Rancangan Tempatan Daerah Langkawi 2030",
        sourceDocumentVersion: "1.0",
        sourceClause: "Klausa 4.2 (Jadual Pengezonan)",
        sourcePage: 48,
        sourceTextExcerpt: "Pembangunan dibenarkan selaras dengan peruntukan zon guna tanah yang diwartakan.",
      },
      requiresOfficerReview: false,
      evaluatedAt: app.updatedAt,
      engineVersion: "1.0.0",
    },
    {
      ruleId: "RTD-SETBACK-01",
      ruleCode: "RTD-SETBACK-01",
      ruleName: "Anjakan Hadapan Bangunan Minimum 6.0 Meter",
      ruleSetId: "ruleset-langkawi-2030",
      ruleSetVersion: "1.0.0",
      category: "SETBACK",
      status: (isApp2 ? "NON_COMPLIANT" : "COMPLIANT") as "NON_COMPLIANT" | "COMPLIANT",
      severity: "HIGH" as const,
      actualValue: isApp2 ? "4.50" : "7.50",
      requiredValue: "6.00",
      difference: isApp2 ? -1.5 : 1.5,
      unit: "METER",
      messageCode: isApp2 ? "SETBACK_INSUFFICIENT" : "SETBACK_COMPLIANT",
      messageText: isApp2
        ? "Anjakan bangunan hadapan tidak mencukupi rizab jalan minimum 6.0m (Defisit 1.50m)."
        : "Anjakan bangunan hadapan mematuhi kehendak minimum rizab jalan utama.",
      inputEvidence: [
        {
          key: "frontSetback",
          value: isApp2 ? 4.5 : 7.5,
          sourceType: "LCP_EXTRACTED_FACT" as const,
          isConfirmed: true,
        },
      ],
      ruleEvidence: {
        sourceDocumentId: "Undang-Undang Kecil Bangunan Seragam (UKBS 1984)",
        sourceDocumentVersion: "1.0",
        sourceClause: "UKBS Klausa 38(1)",
        sourcePage: 24,
        sourceTextExcerpt: "Setiap bangunan yang didirikan hendaklah mempunyai anjakan hadapan tidak kurang daripada 6.0 meter dari garis rizab jalan.",
      },
      requiresOfficerReview: isApp2,
      evaluatedAt: app.updatedAt,
      engineVersion: "1.0.0",
    },
    {
      ruleId: "RTD-PARKING-01",
      ruleCode: "RTD-PARKING-01",
      ruleName: "Penyediaan Tempat Letak Kereta Mengikut Nisbah Piawaian",
      ruleSetId: "ruleset-langkawi-2030",
      ruleSetVersion: "1.0.0",
      category: "PARKING",
      status: (isApp3 ? "NON_COMPLIANT" : "COMPLIANT") as "NON_COMPLIANT" | "COMPLIANT",
      severity: "MEDIUM" as const,
      actualValue: isApp3 ? "85" : "135",
      requiredValue: isApp3 ? "110" : "120",
      difference: isApp3 ? -25 : 15,
      unit: "PETAK",
      messageCode: isApp3 ? "PARKING_DEFICIT" : "PARKING_COMPLIANT",
      messageText: isApp3
        ? "Kapasiti tempat letak kereta kurang 25 petak daripada keperluan minima piawaian komersial."
        : "Kapasiti tempat letak kereta mencukupi termasuk petak OKU dan kenderaan elektrik (EV).",
      inputEvidence: [
        {
          key: "parkingBays",
          value: isApp3 ? 85 : 135,
          sourceType: "LCP_EXTRACTED_FACT" as const,
          isConfirmed: true,
        },
      ],
      ruleEvidence: {
        sourceDocumentId: "Piawaian Perancangan Tempat Letak Kereta Negeri Kedah",
        sourceDocumentVersion: "1.0",
        sourceClause: "Piawaian 3.1 (Perniagaan & Kediaman)",
        sourcePage: 15,
        sourceTextExcerpt: "Penyediaan tempat letak kereta hendaklah mematuhi nisbah keluasan lantai kasar bangunan.",
      },
      requiresOfficerReview: isApp3,
      evaluatedAt: app.updatedAt,
      engineVersion: "1.0.0",
    },
    {
      ruleId: "RTD-GREEN-01",
      ruleCode: "RTD-GREEN-01",
      ruleName: "Penyediaan Kawasan Lapang & Zon Hijau Minimum 10%",
      ruleSetId: "ruleset-langkawi-2030",
      ruleSetVersion: "1.0.0",
      category: "OPEN_SPACE",
      status: "COMPLIANT" as const,
      severity: "MEDIUM" as const,
      actualValue: "12.4",
      requiredValue: "10.0",
      difference: 2.4,
      unit: "%",
      messageCode: "GREEN_SPACE_COMPLIANT",
      messageText: "Zon hijau dan landskap lembut melebihi peratusan minimum yang ditetapkan.",
      inputEvidence: [
        {
          key: "openSpacePercentage",
          value: 12.4,
          sourceType: "LCP_EXTRACTED_FACT" as const,
          isConfirmed: true,
        },
      ],
      ruleEvidence: {
        sourceDocumentId: "Garis Panduan Landskap & Kawasan Lapang Negeri Kedah",
        sourceDocumentVersion: "1.0",
        sourceClause: "Klausa 2.1 (Rizab Kawasan Lapang)",
        sourcePage: 10,
        sourceTextExcerpt: "Pembangunan melebihi 1 ekar wajib memperuntukkan sekurang-kurangnya 10% kawasan lapang berfungsi.",
      },
      requiresOfficerReview: false,
      evaluatedAt: app.updatedAt,
      engineVersion: "1.0.0",
    },
  ];
}

export function getDemoDocumentsForApp(id: string) {
  const app = getDemoApplication(id);
  return [
    {
      id: `doc-${app.id}-lcp`,
      documentId: `doc-${app.id}-lcp`,
      applicationId: app.id,
      documentType: "LCP" as const,
      fileName: `LCP_Pelan_Susunatur_${app.lotNo.replace(/\s+/g, "_")}_v${app.currentVersion}.0.pdf`,
      originalFileName: `LCP_Pelan_Susunatur_${app.lotNo.replace(/\s+/g, "_")}_v${app.currentVersion}.0.pdf`,
      storagePath: `applications/${app.id}/documents/LCP_v${app.currentVersion}.pdf`,
      version: app.currentVersion,
      isCurrent: true,
      fileSize: 14850200,
      mimeType: "application/pdf",
      checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "ACTIVE" as const,
      processingStatus: "COMPLETED" as const,
      supersedesDocumentId: null,
      uploadedBy: app.applicantUid,
      uploadedAt: app.createdAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `doc-${app.id}-grant`,
      documentId: `doc-${app.id}-grant`,
      applicationId: app.id,
      documentType: "SITE_PLAN" as const,
      fileName: `Pelan_Tapak_${app.lotNo.replace(/\s+/g, "_")}_Mukim_${app.mukim}.pdf`,
      originalFileName: `Pelan_Tapak_${app.lotNo.replace(/\s+/g, "_")}_Mukim_${app.mukim}.pdf`,
      storagePath: `applications/${app.id}/documents/Pelan_Tapak.pdf`,
      version: 1,
      isCurrent: true,
      fileSize: 4250100,
      mimeType: "application/pdf",
      checksum: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      status: "ACTIVE" as const,
      processingStatus: "COMPLETED" as const,
      supersedesDocumentId: null,
      uploadedBy: app.applicantUid,
      uploadedAt: app.createdAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
  ];
}

export function getDemoFactsForApp(id: string) {
  const app = getDemoApplication(id);
  const isApp2 = app.id === "app-demo-002" || app.id === "app-demo-02";
  const isApp3 = app.id === "app-demo-003" || app.id === "app-demo-03";

  return [
    // 1. PROJECT
    {
      id: `fact-${app.id}-proj-1`,
      factId: `fact-${app.id}-proj-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "projectName",
      label: "Nama Projek Pemajuan",
      category: "PROJECT" as const,
      value: app.title,
      unit: null,
      normalizedValue: app.title,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.99,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.title,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 1,
          quotedText: `Tajuk Cadangan: ${app.title}.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-proj-2`,
      factId: `fact-${app.id}-proj-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "applicantName",
      label: "Pemohon / Pemaju",
      category: "PROJECT" as const,
      value: app.applicantName,
      unit: null,
      normalizedValue: app.applicantName,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.98,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.applicantName,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 1,
          quotedText: `Pemaju: ${app.applicantName}.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-proj-3`,
      factId: `fact-${app.id}-proj-3`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "consultantName",
      label: "Jururancang Bandar / Arkitek",
      category: "PROJECT" as const,
      value: app.consultantName,
      unit: null,
      normalizedValue: app.consultantName,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.97,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.consultantName,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 2,
          quotedText: `Disediakan oleh: ${app.consultantName}.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-proj-4`,
      factId: `fact-${app.id}-proj-4`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "estimatedCost",
      label: "Anggaran Kos Pemajuan (RM)",
      category: "PROJECT" as const,
      value: app.estimatedCost,
      unit: "MYR",
      normalizedValue: app.estimatedCost,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.estimatedCost,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 3,
          quotedText: `Anggaran nilai keseluruhan projek adalah RM ${app.estimatedCost.toLocaleString()}.`,
          tableReference: "Jadual 1.2: Anggaran Kos",
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 2. SITE
    {
      id: `fact-${app.id}-site-1`,
      factId: `fact-${app.id}-site-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "lotNo",
      label: "Nombor Lot Hakmilik",
      category: "SITE" as const,
      value: app.lotNo,
      unit: null,
      normalizedValue: app.lotNo,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.99,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.lotNo,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 3,
          quotedText: `Tapak cadangan terletak di ${app.lotNo}, Mukim ${app.mukim}, Langkawi.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-site-2`,
      factId: `fact-${app.id}-site-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "siteAreaSqm",
      label: "Keluasan Tapak (m²)",
      category: "SITE" as const,
      value: app.siteAreaSqm,
      unit: "SQM",
      normalizedValue: app.siteAreaSqm,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.99,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.siteAreaSqm,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 3,
          quotedText: `Jumlah keluasan tapak pemajuan adalah seluas ${app.siteAreaSqm.toLocaleString()} m².`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-site-3`,
      factId: `fact-${app.id}-site-3`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "landStatus",
      label: "Status Hakmilik & Pegangan",
      category: "SITE" as const,
      value: "Pajakan 99 Tahun (Leasehold)",
      unit: null,
      normalizedValue: "Pajakan 99 Tahun",
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.96,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "Pajakan 99 Tahun (Leasehold)",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 4,
          quotedText: `Status pegangan tanah adalah Pajakan 99 Tahun yang berakhir pada tahun 2115.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 3. LAND_USE
    {
      id: `fact-${app.id}-land-1`,
      factId: `fact-${app.id}-land-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "proposedLandUse",
      label: "Cadangan Guna Tanah Utama",
      category: "LAND_USE" as const,
      value: app.developmentType,
      unit: null,
      normalizedValue: app.developmentType,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.98,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: app.developmentType,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 5,
          quotedText: `Cadangan guna tanah yang dikemukakan adalah bagi tujuan ${app.developmentType}.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-land-2`,
      factId: `fact-${app.id}-land-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "rtdZoning",
      label: "Pengezonan RTD Langkawi 2030",
      category: "LAND_USE" as const,
      value: `Zon Pembangunan ${app.developmentType} (Blok Perancangan BP 2)`,
      unit: null,
      normalizedValue: app.developmentType,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.97,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: `Zon Pembangunan ${app.developmentType} (Blok Perancangan BP 2)`,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 6,
          quotedText: `Menurut Rancangan Tempatan Daerah Langkawi 2030, tapak berada dalam zon pemajuan yang dibenarkan.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 4. INTENSITY
    {
      id: `fact-${app.id}-int-1`,
      factId: `fact-${app.id}-int-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "plotRatio",
      label: "Nisbah Plot (Plot Ratio)",
      category: "INTENSITY" as const,
      value: "1 : 2.5",
      unit: "RATIO",
      normalizedValue: 2.5,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.96,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "1 : 2.5",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 8,
          quotedText: `Nisbah plot yang dicadangkan ialah 1:2.5 selaras dengan piawaian kelas guna tanah.`,
          tableReference: "Jadual Intensiti Pembangunan",
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-int-2`,
      factId: `fact-${app.id}-int-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "gfaSqm",
      label: "Jumlah Luas Lantai Kasar / GFA (m²)",
      category: "INTENSITY" as const,
      value: Math.round(app.siteAreaSqm * 1.8),
      unit: "SQM",
      normalizedValue: Math.round(app.siteAreaSqm * 1.8),
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: Math.round(app.siteAreaSqm * 1.8),
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 8,
          quotedText: `Gross Floor Area (GFA) keseluruhan bangunan adalah ${Math.round(app.siteAreaSqm * 1.8).toLocaleString()} m².`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-int-3`,
      factId: `fact-${app.id}-int-3`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "plinthCoverage",
      label: "Liputan Tapak / Plinth Area (%)",
      category: "INTENSITY" as const,
      value: "58.5%",
      unit: "PERCENT",
      normalizedValue: 58.5,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.94,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "58.5%",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 9,
          quotedText: `Liputan plinth bangunan dicadangkan pada kadar 58.5% dari luas tapak bersih.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 5. BUILDING
    {
      id: `fact-${app.id}-bldg-1`,
      factId: `fact-${app.id}-bldg-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "buildingStoreys",
      label: "Bilangan Tingkat Bangunan",
      category: "BUILDING" as const,
      value: isApp3 ? "3 Tingkat" : isApp2 ? "2 Tingkat" : "8 Tingkat",
      unit: "TINGKAT",
      normalizedValue: isApp3 ? 3 : isApp2 ? 2 : 8,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.97,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: isApp3 ? "3 Tingkat" : isApp2 ? "2 Tingkat" : "8 Tingkat",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 10,
          quotedText: `Struktur bangunan terdiri daripada ${isApp3 ? "3" : isApp2 ? "2" : "8"} tingkat utama.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-bldg-2`,
      factId: `fact-${app.id}-bldg-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "frontSetback",
      label: "Anjakan Bangunan Hadapan (m)",
      category: "BUILDING" as const,
      value: isApp2 ? 4.5 : 7.5,
      unit: "METER",
      normalizedValue: isApp2 ? 4.5 : 7.5,
      status: isApp2 ? ("CONFLICT" as const) : ("MANUALLY_CONFIRMED" as const),
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: isApp2 ? 4.5 : 7.5,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 11,
          quotedText: `Anjakan bangunan hadapan dari rezab jalan utama: ${isApp2 ? "4.50" : "7.50"} meter.`,
          tableReference: "Jadual Anjakan Bangunan",
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-bldg-3`,
      factId: `fact-${app.id}-bldg-3`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "sideSetback",
      label: "Anjakan Bangunan Sisi & Belakang (m)",
      category: "BUILDING" as const,
      value: 6.0,
      unit: "METER",
      normalizedValue: 6.0,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.96,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: 6.0,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 11,
          quotedText: `Anjakan sisi dan belakang adalah 6.00 meter mematuhi kelebaran zon penampan.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 6. PARKING
    {
      id: `fact-${app.id}-park-1`,
      factId: `fact-${app.id}-park-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "parkingBays",
      label: "Tempat Letak Kereta (Petak)",
      category: "PARKING" as const,
      value: isApp3 ? 85 : 135,
      unit: "PETAK",
      normalizedValue: isApp3 ? 85 : 135,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.96,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: isApp3 ? 85 : 135,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 13,
          quotedText: `Penyediaan petak letak kereta: ${isApp3 ? "85" : "135"} petak.`,
          tableReference: "Jadual TLK",
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-park-2`,
      factId: `fact-${app.id}-park-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "motorcycleBays",
      label: "Petak Letak Motosikal (Petak)",
      category: "PARKING" as const,
      value: 30,
      unit: "PETAK",
      normalizedValue: 30,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: 30,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 13,
          quotedText: `Petak motosikal disediakan sebanyak 30 petak berbumbung.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-park-3`,
      factId: `fact-${app.id}-park-3`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "okuParkingBays",
      label: "Petak Letak Kereta OKU (Petak)",
      category: "PARKING" as const,
      value: 3,
      unit: "PETAK",
      normalizedValue: 3,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.98,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: 3,
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 13,
          quotedText: `3 petak khas orang kurang upaya (OKU) disediakan berdekatan lobi lif utama.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 7. OPEN_SPACE
    {
      id: `fact-${app.id}-open-1`,
      factId: `fact-${app.id}-open-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "openSpacePercentage",
      label: "Peratusan Kawasan Lapang Awam (%)",
      category: "OPEN_SPACE" as const,
      value: "10.5%",
      unit: "PERCENT",
      normalizedValue: 10.5,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.97,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "10.5%",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 15,
          quotedText: `Peruntukan kawasan lapang berfungsi adalah 10.5% daripada jumlah keluasan skim pembangunan.`,
          tableReference: "Jadual Kawasan Lapang",
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-open-2`,
      factId: `fact-${app.id}-open-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "greenAreaSqm",
      label: "Keluasan Kawasan Hijau & Rekreasi (m²)",
      category: "OPEN_SPACE" as const,
      value: Math.round(app.siteAreaSqm * 0.11),
      unit: "SQM",
      normalizedValue: Math.round(app.siteAreaSqm * 0.11),
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: Math.round(app.siteAreaSqm * 0.11),
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 15,
          quotedText: `Keluasan landskap lembut dan zon hijau ialah ${Math.round(app.siteAreaSqm * 0.11).toLocaleString()} m².`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },

    // 8. ACCESS
    {
      id: `fact-${app.id}-acc-1`,
      factId: `fact-${app.id}-acc-1`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "roadReserveWidth",
      label: "Kelebaran Rizab Jalan Masuk Utama (m)",
      category: "ACCESS" as const,
      value: "20.0 m (66 kaki)",
      unit: "METER",
      normalizedValue: 20.0,
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.98,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "20.0 m (66 kaki)",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 17,
          quotedText: `Laluan keluar masuk utama disambungkan ke jalan protokol dengan rezab selebar 20.0 meter.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
    {
      id: `fact-${app.id}-acc-2`,
      factId: `fact-${app.id}-acc-2`,
      applicationId: app.id,
      documentId: `doc-${app.id}-lcp`,
      documentVersion: app.currentVersion,
      key: "pedestrianWalkway",
      label: "Laluan Pejalan Kaki & OKU",
      category: "ACCESS" as const,
      value: "Laluan Berturap 1.5m Bersambung",
      unit: null,
      normalizedValue: "Laluan Berturap 1.5m",
      status: "MANUALLY_CONFIRMED" as const,
      confidence: 0.94,
      confidenceLevel: "HIGH" as const,
      aiGenerated: true,
      confirmedValue: "Laluan Berturap 1.5m Bersambung",
      confirmedBy: "demo-officer-uid",
      confirmedAt: app.updatedAt,
      sourceEvidence: [
        {
          documentId: `doc-${app.id}-lcp`,
          documentVersion: app.currentVersion,
          pageNumber: 17,
          quotedText: `Penyediaan laluan pejalan kaki mesra OKU selebar 1.5 meter di sepanjang perimeter tapak.`,
          tableReference: null,
        },
      ],
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
  ];
}

export function getDemoCommentDraftForApp(id: string): CommentDraft {
  const app = getDemoApplication(id);

  const generatedText = `# ULASAN TEKNIKAL KEBENARAN MERANCANG (DRAF PEGAWAI OSC)

**No. Permohonan:** ${app.applicationNo}
**Tajuk Permohonan:** ${app.title}
**Pemohon / Pemaju:** ${app.applicantName}
**Orang Utama Mengemukakan (PSP):** ${app.consultantName}
**Lokasi Tapak:** ${app.lotNo}, Mukim ${app.mukim}, Daerah Langkawi, Kedah
**Keluasan Tapak:** ${app.siteAreaSqm.toLocaleString()} m²
**Kategori Pembangunan:** ${app.developmentCategory} (${app.developmentType})
**Tarikh Penjanaan AI:** ${new Date(app.updatedAt).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}

---

### 1. RINGKASAN EKSEKUTIF & KONTEKS PERANCANGAN
Permohonan ini melibatkan cadangan pemajuan kebenaran merancang (KM) bagi ${app.title.toLowerCase()} di atas ${app.lotNo}, Mukim ${app.mukim}. Penilaian pra-semakan komprehensif berbantukan enjin AI SmartCheck dan semakan silang geospatial SmartGIS mendapati bahawa cadangan ini secara umumnya adalah **SELARAS DENGAN RANCANGAN TEMPATAN DAERAH (RTD) LANGKAWI 2030** serta mematuhi piawaian perancangan teknikal utama dengan skor pematuhan ${app.complianceScore}%.

### 2. KEPUTUSAN SEMAKAN PARAMETER TEKNIKAL & SPATIAL
1. **Pengezonan Guna Tanah (RTD 2030):**
   - Tapak cadangan terletak di dalam Zon Pembangunan ${app.developmentType} (BP 2) yang membenarkan aktiviti pemajuan yang dicadangkan.
2. **Kepadatan & Intensiti Pembangunan:**
   - Nisbah Plot (Plot Ratio) dan kepadatan unit yang dikemukakan dalam LCP adalah mematuhi had siling yang ditetapkan dalam garis panduan perancangan.
3. **Kawasan Lapang & Landskap (Open Space):**
   - Penyediaan kawasan lapang berfungsi melebihi had minimum statutori 10.0% daripada jumlah keluasan skim pemajuan.
4. **Penyediaan Tempat Letak Kereta & Motosikal:**
   - Jumlah petak letak kereta (termasuk petak khas OKU) dan motosikal yang diperuntukkan menepati formula perkiraan MPM/MPLBP.
5. **Anjakan Bangunan (Building Setback):**
   - Garisan anjakan bangunan hadapan, sisi, dan belakang mematuhi kehendak zon rizab jalan dan bangunan bersebelahan.

### 3. ISU TEKNIKAL & PERKARA YANG MEMERLUKAN TINDAKAN PEMOHON
1. **Pelan Pengurusan Air Larian Hujan & Kolam Takungan (OSD):**
   - Pemohon/PSP perlu mengemukakan perincian kapasiti sistem On-Site Detention (OSD) serta perkiraan hidrologi selaras dengan Manual Saliran Mesra Alam (MSMA Edisi Ke-2).
2. **Kelegaan Akses Kenderaan Bomba & Penyelamat:**
   - Memastikan kelegaan kelebaran laluan perkhidmatan kecemasan minimum 6.0 meter dengan jejari pusingan (*turning radius*) yang mencukupi untuk jentera Jabatan Bomba dan Penyelamat Malaysia (JBPM).

### 4. SYARAT-SYARAT KEBENARAN MERANCANG (CADANGAN)
1. Pemajuan hendaklah dilaksanakan dengan mematuhi sepenuhnya Pelan Susunatur CAD Georeferenced (DWG/KM/2026/000003-L01) yang diluluskan.
2. Membina dan menyelenggara laluan pejalan kaki mesra OKU selebar minimum 1.5 meter di sepanjang perimeter rezab jalan hadapan tapak.
3. Mengemukakan kelulusan rasmi daripada agensi teknikal luaran (JPS, JKR, IWK, TNB, SADA, JBPM) sebelum permohonan Pelan Bangunan dikemukakan ke OSC.

---
*Draf ini dijana secara automatik oleh OSC SmartCheck AI Assistant (Model Gemini 1.5 Pro). Pegawai Penilai OSC boleh menyunting dan menambah ulasan sebelum pengesahan muktamad.*`;

  return {
    id: `draft-${app.id}-01`,
    draftId: `draft-${app.id}-01`,
    applicationId: app.id,
    smartCheckId: `sc-${app.id}-latest`,
    draftType: "OSC_FULL_DRAFT",
    draftStyle: "STANDARD",
    status: "AI_DRAFT",
    version: 1,
    revisionNumber: 0,
    sourceFingerprint: `fp-${app.id}-v1`,
    sourceVersions: {
      lcpVersion: app.currentVersion,
      siteVersion: 1,
      smartCheckId: `sc-${app.id}-latest`,
      engineVersion: "OSC_RULE_ENGINE_V1.0",
      promptVersion: "PROMPT_V1.0",
    },
    aiModel: "Gemini 1.5 Pro (OSC Technical Reasoning Engine)",
    promptVersion: "PROMPT_V1.0",
    generatedSections: {
      executiveSummary: `Permohonan bagi ${app.title} di atas ${app.lotNo}, Mukim ${app.mukim} mematuhi RTD Langkawi 2030 dengan skor pematuhan ${app.complianceScore}%.`,
      planningContext: `Tapak cadangan seluas ${app.siteAreaSqm.toLocaleString()} m² terletak di dalam zon guna tanah ${app.developmentCategory}.`,
      categoryComments: [
        {
          category: "LAND_USE_ZONING",
          summary: "Guna tanah dan zon RTD 2030 mematuhi sepenuhnya syarat perancangan.",
          findings: ["Guna tanah selaras dengan RTD Langkawi 2030 (BP2 Kuah)."],
          actionRequired: null,
          evidenceRefs: [`doc-${app.id}-lcp p.3`, "RTD Langkawi 2030"],
        },
        {
          category: "INTENSITY_GFA",
          summary: "Nisbah plot dan kepadatan mematuhi had maksimum.",
          findings: ["Plot ratio mematuhi had kawasan perbandaran."],
          actionRequired: null,
          evidenceRefs: [`doc-${app.id}-lcp p.7`],
        },
        {
          category: "PARKING",
          summary: "Peruntukan tempat letak kereta dan OKU mencukupi.",
          findings: ["Penyediaan petak TLK melepasi formula minimum Majlis."],
          actionRequired: null,
          evidenceRefs: [`doc-${app.id}-lcp p.13`],
        },
        {
          category: "DRAINAGE",
          summary: "Perlu perincian kapasiti kolam takungan (OSD).",
          findings: ["Perlu semakan hidrologi MSMA 2."],
          actionRequired: "Kemukakan perkiraan OSD JPS.",
          evidenceRefs: [`doc-${app.id}-lcp p.16`],
        },
      ],
      issuesRequiringAction: [
        {
          ruleCode: "DRAIN-001",
          description: "Pengiraan kapasiti On-Site Detention (OSD) perlu diselaraskan dengan garis panduan JPS MSMA 2.",
          recommendedAction: "Kemukakan nota perkiraan hidrologi dan pelan skematik OSD.",
        },
      ],
      officerJudgementItems: [
        {
          ruleCode: "SETBACK-002",
          finding: "Anjakan sisi bangunan adalah 6.0 meter.",
          officerAssessment: "Bersetuju kerana melebihi syarat minimum 3.0 meter.",
          implication: "Memenuhi keperluan penampan dan keselamatan kebakaran.",
        },
      ],
      recommendedApplicantActions: [
        "Kemukakan pelan perincian sistem saliran OSD yang diperakukan oleh Jurutera Bertauliah (PE).",
        "Sediakan laluan pejalan kaki mesra OKU selebar minimum 1.5 meter di sepanjang perimeter hadapan.",
      ],
      conclusionDraft: "Secara keseluruhannya, cadangan pembangunan ini adalah teratur dari segi perancangan dan disyorkan untuk pertimbangan kelulusan bersyarat oleh Jawatankuasa OSC.",
      sourceReferences: [
        { type: "RULE", ruleCode: "RTD-2030-BP2", description: "Rancangan Tempatan Daerah Langkawi 2030" },
        { type: "LCP", document: `doc-${app.id}-lcp`, page: 5, description: "Laporan Cadangan Pemajuan" },
      ],
      warnings: [],
    },
    aiGeneratedText: generatedText,
    officerEditedText: generatedText,
    createdBy: "OSC_AI_DRAFT_ASSISTANT",
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    lastEditedBy: "demo-officer-uid",
  };
}

export function getDemoVerifiedCommentsForApp(id: string): VerifiedComment[] {
  const draft = getDemoCommentDraftForApp(id);
  const app = getDemoApplication(id);

  return [
    {
      id: `vc-${app.id}-01`,
      commentId: `vc-${app.id}-01`,
      applicationId: app.id,
      smartCheckId: `sc-${app.id}-latest`,
      draftId: draft.draftId,
      version: 1,
      status: "VERIFIED",
      visibility: "APPLICANT_VISIBLE",
      finalText: draft.officerEditedText || draft.aiGeneratedText,
      structuredSections: draft.generatedSections,
      sourceSnapshot: {
        lcpVersion: app.currentVersion,
        siteVersion: 1,
        smartCheckId: `sc-${app.id}-latest`,
        ruleSetVersions: ["RULESET_V1.0"],
        gisDatasetVersions: ["GIS_RTD_2030_V1"],
        engineVersion: "OSC_RULE_ENGINE_V1.0",
        promptVersion: "PROMPT_V1.0",
        sourceFingerprint: `fp-${app.id}-v1`,
      },
      checksum: `sha256-verified-comment-${app.id}-001`,
      verifiedBy: "Sr. Ahmad Fauzi (Pegawai Perancang / GIS)",
      verifiedAt: app.updatedAt,
      publishedBy: "Sr. Ahmad Fauzi (Pegawai Perancang / GIS)",
      publishedAt: app.updatedAt,
      createdAt: app.createdAt,
    },
  ];
}

export function getDemoCommentReadiness(): CommentReadinessResult {
  return {
    ready: true,
    smartCheckReady: true,
    officerReviewReady: true,
    sourceReady: true,
    unresolvedCriticalErrors: [],
    warnings: [],
    blockingIssues: [],
  };
}

export function getDemoCommentTemplates(): StandardPhraseTemplate[] {
  return [
    {
      id: "tpl-001",
      templateId: "tpl-001",
      name: "Kelulusan Bersyarat - Saliran OSD JPS",
      category: "DRAINAGE",
      text: "Pemohon/PSP dikehendaki mengemukakan pelan perincian sistem On-Site Detention (OSD) serta perkiraan hidrologi yang diperakukan oleh Jurutera Bertauliah selaras dengan Manual Saliran Mesra Alam (MSMA Edisi Ke-2) kepada JPS Daerah Langkawi.",
      isLocked: false,
      status: "ACTIVE",
      version: 1,
      approvedBy: "demo-admin-uid",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "tpl-002",
      templateId: "tpl-002",
      name: "Penyediaan Laluan Pejalan Kaki & Kemudahan OKU",
      category: "ACCESS",
      text: "Penyediaan laluan pejalan kaki mesra OKU selebar minimum 1.5 meter yang bersambung dengan rezab jalan utama dan dilengkapi blok penunjuk arah (tactile paving) hendaklah disediakan selaras dengan Garis Panduan Reka Bentuk Sejagat (Universal Design).",
      isLocked: false,
      status: "ACTIVE",
      version: 1,
      approvedBy: "demo-admin-uid",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "tpl-003",
      templateId: "tpl-003",
      name: "Pematuhan Garisan Anjakan Hadapan Jalan Protokol",
      category: "SETBACK",
      text: "Semua struktur bangunan kekal hendaklah mematuhi garisan anjakan hadapan minimum 12.0 meter daripada garisan rezab jalan protokol 20.0 meter (66 kaki).",
      isLocked: false,
      status: "ACTIVE",
      version: 1,
      approvedBy: "demo-admin-uid",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];
}

export function getDemoGisForApp(id: string) {
  const app = getDemoApplication(id);
  const siteArea = app.siteAreaSqm;

  const site = {
    id: `site-${app.id}-01`,
    applicationId: app.id,
    siteType: "SINGLE_LOT" as const,
    latitude: app.latitude,
    longitude: app.longitude,
    selectedLotIds: [`lot-${app.id}-cad`],
    lotNumbers: [app.lotNo],
    mukim: app.mukim,
    district: "Langkawi",
    cadastralAreaSqm: siteArea,
    combinedLotAreaSqm: siteArea,
    geometrySource: "CADASTRAL" as const,
    verificationStatus: "OFFICER_VERIFIED" as const,
    verifiedBy: "demo-officer-uid",
    verifiedAt: app.updatedAt,
    verificationComment: `Tapak telah disahkan oleh Pegawai GIS MPLBP selaras dengan Lot ${app.lotNo}, Mukim ${app.mukim}.`,
    siteVersion: 1,
    spatialAnalysisVersion: "GIS_ENGINE_V1.0",
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };

  const comparison = {
    lcpLotNumber: app.lotNo,
    gisLotNumber: app.lotNo,
    lotMatch: true,
    lcpMukim: app.mukim,
    gisMukim: app.mukim,
    mukimMatch: true,
    lcpSiteAreaSqm: siteArea,
    gisSiteAreaSqm: siteArea,
    differenceSqm: 0,
    differencePercent: 0,
    status: "MATCH" as const,
  };

  const rtdData = {
    primaryZone: {
      zoneId: `zone-${app.id}-01`,
      zoneCode: "BP2-KM-01",
      zoneName: `Zon Pembangunan ${app.developmentType} (Perniagaan & Kediaman)`,
      zoneCategory: app.developmentCategory === "COMMERCIAL" ? "PERNIAGAAN" : "KEDIAMAN",
      intersectionAreaSqm: Math.round(siteArea * 0.85),
      intersectionPercent: 85,
      datasetVersion: "RTD_LANGKAWI_2030_V2.1",
    },
    zones: [
      {
        zoneId: `zone-${app.id}-01`,
        zoneCode: "BP2-KM-01",
        zoneName: `Zon Pembangunan ${app.developmentType} (Perniagaan & Kediaman)`,
        zoneCategory: app.developmentCategory === "COMMERCIAL" ? "PERNIAGAAN" : "KEDIAMAN",
        intersectionAreaSqm: Math.round(siteArea * 0.85),
        intersectionPercent: 85,
        datasetVersion: "RTD_LANGKAWI_2030_V2.1",
      },
      {
        zoneId: `zone-${app.id}-02`,
        zoneCode: "BP2-INF-02",
        zoneName: "Zon Pengangkutan, Rizab Jalan & Utiliti Awam",
        zoneCategory: "INFRASTRUKTUR",
        intersectionAreaSqm: Math.round(siteArea * 0.15),
        intersectionPercent: 15,
        datasetVersion: "RTD_LANGKAWI_2030_V2.1",
      },
    ],
  };

  // Tailor nearby features based on Mukim & Location
  let features = [
    {
      featureId: `feat-${app.id}-01`,
      featureType: "HOTEL",
      featureName: "Adya Hotel Langkawi",
      distanceMeters: 220,
      datasetVersion: "POI_LANGKAWI_2026",
    },
    {
      featureId: `feat-${app.id}-02`,
      featureType: "ROAD",
      featureName: "Jalan Persiaran Kuah (Rizab 66 kaki / 20m)",
      distanceMeters: 45,
      datasetVersion: "JALAN_JKR_2026",
    },
    {
      featureId: `feat-${app.id}-03`,
      featureType: "SCHOOL",
      featureName: "SK Mahsuri Kuah",
      distanceMeters: 420,
      datasetVersion: "POI_LANGKAWI_2026",
    },
    {
      featureId: `feat-${app.id}-04`,
      featureType: "PUBLIC_FACILITY",
      featureName: "Masjid Al-Hana Kuah",
      distanceMeters: 480,
      datasetVersion: "POI_LANGKAWI_2026",
    },
  ];

  if (app.mukim.toLowerCase().includes("kedawang") || app.mukim.toLowerCase().includes("cenang")) {
    features = [
      {
        featureId: `feat-${app.id}-01`,
        featureType: "HOTEL",
        featureName: "Pelangi Beach Resort & Spa Langkawi",
        distanceMeters: 180,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-02`,
        featureType: "ROAD",
        featureName: "Jalan Pantai Cenang (Rizab 66 kaki / 20m)",
        distanceMeters: 30,
        datasetVersion: "JALAN_JKR_2026",
      },
      {
        featureId: `feat-${app.id}-03`,
        featureType: "SCHOOL",
        featureName: "SK Kedawang",
        distanceMeters: 380,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-04`,
        featureType: "PUBLIC_FACILITY",
        featureName: "Klinik Kesihatan Pantai Cenang",
        distanceMeters: 450,
        datasetVersion: "POI_LANGKAWI_2026",
      },
    ];
  } else if (app.mukim.toLowerCase().includes("ayer") || app.mukim.toLowerCase().includes("hangat")) {
    features = [
      {
        featureId: `feat-${app.id}-01`,
        featureType: "HOTEL",
        featureName: "Tanjung Rhu Luxury Resort",
        distanceMeters: 320,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-02`,
        featureType: "ROAD",
        featureName: "Jalan Teluk Ewa - Ayer Hangat (Rizab 66 kaki)",
        distanceMeters: 50,
        datasetVersion: "JALAN_JKR_2026",
      },
      {
        featureId: `feat-${app.id}-03`,
        featureType: "PUBLIC_FACILITY",
        featureName: "Jeti Perikanan LKIM Teluk Ewa",
        distanceMeters: 280,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-04`,
        featureType: "SCHOOL",
        featureName: "SK Ayer Hangat",
        distanceMeters: 410,
        datasetVersion: "POI_LANGKAWI_2026",
      },
    ];
  } else if (app.mukim.toLowerCase().includes("matsirat")) {
    features = [
      {
        featureId: `feat-${app.id}-01`,
        featureType: "PUBLIC_FACILITY",
        featureName: "Lapangan Terbang Antarabangsa Langkawi (LGK)",
        distanceMeters: 650,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-02`,
        featureType: "ROAD",
        featureName: "Jalan Lapangan Terbang (Rizab 100 kaki / 30m)",
        distanceMeters: 40,
        datasetVersion: "JALAN_JKR_2026",
      },
      {
        featureId: `feat-${app.id}-03`,
        featureType: "COMMERCIAL_AREA",
        featureName: "Mahsuri International Exhibition Centre (MIEC)",
        distanceMeters: 490,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-04`,
        featureType: "SCHOOL",
        featureName: "SK Padang Matsirat",
        distanceMeters: 350,
        datasetVersion: "POI_LANGKAWI_2026",
      },
    ];
  } else if (app.mukim.toLowerCase().includes("melaka")) {
    features = [
      {
        featureId: `feat-${app.id}-01`,
        featureType: "TOURISM_AREA",
        featureName: "Pusat Rekreasi Lubuk Semilang & Air Terjun",
        distanceMeters: 520,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-02`,
        featureType: "ROAD",
        featureName: "Jalan Ulu Melaka (Rizab 66 kaki / 20m)",
        distanceMeters: 60,
        datasetVersion: "JALAN_JKR_2026",
      },
      {
        featureId: `feat-${app.id}-03`,
        featureType: "SCHOOL",
        featureName: "SK Ulu Melaka",
        distanceMeters: 430,
        datasetVersion: "POI_LANGKAWI_2026",
      },
      {
        featureId: `feat-${app.id}-04`,
        featureType: "PUBLIC_FACILITY",
        featureName: "Masjid Nurul Huda Ulu Melaka",
        distanceMeters: 470,
        datasetVersion: "POI_LANGKAWI_2026",
      },
    ];
  }

  const bufferData = {
    bufferDistanceMeters: 500,
    featuresCountByType: {
      HOTEL: features.filter((f) => f.featureType === "HOTEL").length,
      ROAD: features.filter((f) => f.featureType === "ROAD").length,
      SCHOOL: features.filter((f) => f.featureType === "SCHOOL").length,
      PUBLIC_FACILITY: features.filter((f) => f.featureType === "PUBLIC_FACILITY").length,
      COMMERCIAL_AREA: features.filter((f) => f.featureType === "COMMERCIAL_AREA").length,
      TOURISM_AREA: features.filter((f) => f.featureType === "TOURISM_AREA").length,
    },
    features,
  };

  return { site, comparison, rtdData, bufferData, features };
}

export function getDemoIssuesForApp(id: string) {
  const app = getDemoApplication(id);
  if (app.id === "app-demo-002") {
    return [
      {
        issueId: `issue-${app.id}-setback`,
        applicationId: app.id,
        ruleId: "RTD-SETBACK-01",
        title: "Isu Anjakan Hadapan Bangunan Kurang Daripada 6.0 Meter",
        description: "Anjakan bangunan hadapan pada Pelan Susunatur hanya menyediakan 4.50m berbanding syarat 6.00m dari rizab jalan utama.",
        category: "SETBACK",
        severity: "HIGH",
        status: "OPEN",
        visibility: "INTERNAL",
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        identifiedBy: "SMARTCHECK_ENGINE",
      },
    ];
  }

  if (app.id === "app-demo-003") {
    return [
      {
        issueId: `issue-${app.id}-parking`,
        applicationId: app.id,
        ruleId: "RTD-PARKING-01",
        title: "Kekurangan 25 Petak Tempat Letak Kereta Komersial",
        description: "Penyediaan 85 petak tempat letak kereta tidak mencukupi kiraan minima 110 petak bagi kompleks perniagaan 3 tingkat.",
        category: "PARKING",
        severity: "MEDIUM",
        status: "PUBLISHED_TO_APPLICANT",
        visibility: "APPLICANT_VISIBLE",
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        identifiedBy: "OFFICER_REVIEW",
      },
    ];
  }

  return [];
}

