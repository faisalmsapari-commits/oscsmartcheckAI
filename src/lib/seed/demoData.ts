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
