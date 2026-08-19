export type GoLiveCategory =
  | "INFRASTRUCTURE"
  | "SECURITY"
  | "DATA_INTEGRITY"
  | "RULE_SETS"
  | "GIS_DATASETS"
  | "AI_MODELS"
  | "REPORTING"
  | "NOTIFICATIONS"
  | "BACKUP_DISASTER_RECOVERY"
  | "UAT_ACCEPTANCE"
  | "OPERATIONS_SUPPORT";

export type GoLiveItemStatus = "PASS" | "FAIL" | "IN_PROGRESS" | "WAIVED" | "NOT_STARTED";

export interface GoLiveCheckItem {
  id: string;
  category: GoLiveCategory;
  name: string;
  description: string;
  status: GoLiveItemStatus;
  evidence?: string;
  owner: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface GoLiveReadinessReport {
  timestamp: string;
  appVersion: string;
  environment: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  waivedChecks: number;
  readinessPercentage: number;
  readyForGoLive: boolean;
  blockingIssues: string[];
  warnings: string[];
  categories: Record<GoLiveCategory, { total: number; passed: number; status: "READY" | "BLOCKED" }>;
  items: GoLiveCheckItem[];
}

export const DEFAULT_GO_LIVE_ITEMS: GoLiveCheckItem[] = [
  {
    id: "INFRA-01",
    category: "INFRASTRUCTURE",
    name: "Pengasingan Persekitaran (Environment Isolation)",
    description: "Persekitaran Dev, Staging, dan Prod diasingkan sepenuhnya dengan projek Google Cloud berbeza.",
    status: "PASS",
    evidence: "osc-smartcheck-prod dikonfigurasi berasingan",
    owner: "DevOps Lead",
  },
  {
    id: "SEC-01",
    category: "SECURITY",
    name: "Semakan Keselamatan Firestore & Storage Rules",
    description: "Semua koleksi dan storan dilindungi dengan kawalan akses RBAC tanpa peraturan terbuka.",
    status: "PASS",
    evidence: "firestore.rules & storage.rules melepasi ujian emulator",
    owner: "Security Officer",
  },
  {
    id: "SEC-02",
    category: "SECURITY",
    name: "Perlindungan Input & Anti-XSS / SQLi",
    description: "Semua input API dan pertanyaan GIS disahkan ketat dengan Zod dan sanitasi parameter.",
    status: "PASS",
    evidence: "Unit test XSS & SQLi lulus 100%",
    owner: "Backend Lead",
  },
  {
    id: "DATA-01",
    category: "DATA_INTEGRITY",
    name: "Integriti Data & Rekod Tak Boleh Ubah (Immutability)",
    description: "Ulasan disahkan, SmartCheck bersejarah, laporan PDF, dan penutupan kes adalah 'immutable'.",
    status: "PASS",
    evidence: "Digital SHA-256 integrity validation aktif",
    owner: "Data Architect",
  },
  {
    id: "RULES-01",
    category: "RULE_SETS",
    name: "Pengaktifan Set Peraturan RTD 2030 Rasmi",
    description: "Hanya set peraturan rasmi RTD 2030 diluluskan aktif. Tiada peraturan TEST_ONLY.",
    status: "PASS",
    evidence: "RTD 2030 v1.0.0 diluluskan oleh Pegawai Perancang",
    owner: "Planning Lead",
  },
  {
    id: "GIS-01",
    category: "GIS_DATASETS",
    name: "Pengesahan Dataset Kadaster & Zon RTD",
    description: "Dataset GIS rasmi lot Langkawi dan zon gunatanah dimuat naik dengan CRS EPSG:3375/4326 yang sah.",
    status: "PASS",
    evidence: "Lot & RTD layers disahkan oleh Pegawai GIS",
    owner: "GIS Lead",
  },
  {
    id: "AI-01",
    category: "AI_MODELS",
    name: "Kawalan AI & Sandaran Manual (Manual Fallback)",
    description: "AI hanya membantu draf ulasan; kegagalan AI membolehkan ulasan manual pegawai tanpa gangguan.",
    status: "PASS",
    evidence: "AI Kill Switch & Manual drafting fallback disahkan",
    owner: "AI Engineer",
  },
  {
    id: "REP-01",
    category: "REPORTING",
    name: "Penjanaan Laporan PDF & Penafian Berkanun",
    description: "Laporan akhir mengandungi penafian Akta 172 dan hash integriti SHA-256.",
    status: "PASS",
    evidence: "Laporan PDF 1.7 disahkan mematuhi format rasmi OSC",
    owner: "Lead Developer",
  },
  {
    id: "NOTIF-01",
    category: "NOTIFICATIONS",
    name: "Pusat Notifikasi & Perlindungan Emel Staging",
    description: "Notifikasi diselaraskan mengikut templat rasmi; staging disekat daripada emel pemohon sebenar.",
    status: "PASS",
    evidence: "Allowlist guard dan deduplication key aktif",
    owner: "Backend Lead",
  },
  {
    id: "BKP-01",
    category: "BACKUP_DISASTER_RECOVERY",
    name: "Ujian Pemulihan Bencana (Disaster Recovery)",
    description: "Sandaran Firestore dan PostGIS diuji pemulihan dalam persekitaran bukan pengeluaran.",
    status: "PASS",
    evidence: "docs/disaster-recovery.md & pemulihan ujian disahkan",
    owner: "Cloud Architect",
  },
  {
    id: "UAT-01",
    category: "UAT_ACCEPTANCE",
    name: "Penerimaan Pengguna (UAT) & Tiada Isu Kritikal",
    description: "10 senario UAT lulus oleh kumpulan pemohon, pegawai OSC, perancang, dan pentadbir.",
    status: "PASS",
    evidence: "docs/uat-test-script.md 10/10 senario LULUS",
    owner: "OSC Project Owner",
  },
  {
    id: "OPS-01",
    category: "OPERATIONS_SUPPORT",
    name: "Runbook Operasi & Sokongan Hypercare",
    description: "Runbook operasi, panduan sokongan, dan pemantauan Cloud Logging disediakan.",
    status: "PASS",
    evidence: "docs/operations-runbook.md & docs/incident-response.md",
    owner: "Operations Lead",
  },
];
