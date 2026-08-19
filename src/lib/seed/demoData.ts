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
