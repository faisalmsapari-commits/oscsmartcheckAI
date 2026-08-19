"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { OfficerQueueItem } from "@/types/dashboard";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Search,
  Building2,
  Home,
  Factory,
  Landmark,
  UserCheck,
  FileSearch,
  MessageSquareText,
  Filter,
  RefreshCw,
  Eye,
  Scale,
  MapPin,
  Calendar,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export interface ExtendedQueueItem extends OfficerQueueItem {
  title?: string;
  status?: string;
}

const INITIAL_OFFICER_QUEUE: ExtendedQueueItem[] = [
  {
    applicationId: "app-demo-002",
    applicationNo: "KM/2026/000102",
    projectName: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
    developmentType: "HOUSING",
    applicantName: "Pembinaan Seri Kedah Sdn Bhd",
    smartCheckId: "sc-demo-002",
    overallStatus: "OFFICER_REVIEW_REQUIRED",
    totalIssues: 2,
    criticalIssues: 1,
    assignedOfficer: "En. Faisal (Perancang)",
    lastUpdated: "2026-08-15T09:00:00Z",
  },
  {
    applicationId: "app-demo-003",
    applicationNo: "KM/2026/000103",
    projectName: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
    developmentType: "COMMERCIAL",
    applicantName: "Syarikat Niaga Mahsuri Sdn Bhd",
    smartCheckId: "sc-demo-003",
    overallStatus: "OFFICER_REVIEW_REQUIRED",
    totalIssues: 2,
    criticalIssues: 1,
    assignedOfficer: "Pn. Siti Nurhaliza (OSC)",
    lastUpdated: "2026-08-16T10:15:00Z",
  },
  {
    applicationId: "app-demo-005",
    applicationNo: "KM/2026/000105",
    projectName: "Cadangan Pusat Pemprosesan Makanan Laut & Gudang Logistik Sejuk Beku",
    developmentType: "INDUSTRIAL",
    applicantName: "Langkawi Fisheries Logistics Sdn Bhd",
    smartCheckId: "sc-demo-005",
    overallStatus: "PASS_PRECHECK",
    totalIssues: 0,
    criticalIssues: 0,
    assignedOfficer: "En. Faisal (Perancang)",
    lastUpdated: "2026-08-18T14:00:00Z",
  },
  {
    applicationId: "app-demo-006",
    applicationNo: "KM/2026/000106",
    projectName: "Cadangan Pembinaan Pusat Kebudayaan & Galeri Geopark Langkawi",
    developmentType: "INSTITUTIONAL",
    applicantName: "Lembaga Pembangunan Geopark Negara",
    smartCheckId: "sc-demo-006",
    overallStatus: "PASS_PRECHECK",
    totalIssues: 0,
    criticalIssues: 0,
    assignedOfficer: "En. Khairul (GIS)",
    lastUpdated: "2026-08-17T08:45:00Z",
  },
];

export default function OfficerPage() {
  const { role, user } = useAuth();
  const [queue, setQueue] = useState<ExtendedQueueItem[]>(INITIAL_OFFICER_QUEUE);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueue = useCallback(async () => {
    if (!user) return;
    try {
      setIsRefreshing(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/officer/smartcheck/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue && data.queue.length > 0) {
          setQueue(data.queue);
        }
      }
    } catch (err: unknown) {
      console.warn("Failed to load queue:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Filtered queue items with robust null-safety
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      if (!item) return false;
      const appNo = String(item.applicationNo || "").toLowerCase();
      const projName = String(item.projectName || item.title || "").toLowerCase();
      const applicant = String(item.applicantName || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        query === "" ||
        appNo.includes(query) ||
        projName.includes(query) ||
        applicant.includes(query);

      const itemType = String(item.developmentType || "Pembangunan").toUpperCase();
      const matchesCategory =
        categoryFilter === "ALL" ||
        itemType === categoryFilter.toUpperCase();

      const overallStat = String(item.overallStatus || item.status || "");
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "NEEDS_REVIEW" && overallStat !== "PASS_PRECHECK") ||
        (statusFilter === "PASS" && overallStat === "PASS_PRECHECK");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [queue, searchQuery, categoryFilter, statusFilter]);

  const criticalCount = queue.reduce((acc, curr) => acc + ((curr?.criticalIssues || 0) > 0 ? 1 : 0), 0);
  const passedCount = queue.reduce(
    (acc, curr) =>
      acc +
      ((curr?.overallStatus || curr?.status) === "PASS_PRECHECK" ? 1 : 0),
    0
  );

  const getCategoryIcon = (type?: string) => {
    const t = String(type || "").toUpperCase();
    switch (t) {
      case "HOUSING":
      case "PERUMAHAN":
        return <Home className="h-3.5 w-3.5 text-blue-600" />;
      case "COMMERCIAL":
      case "PERDAGANGAN":
        return <Building2 className="h-3.5 w-3.5 text-amber-600" />;
      case "INDUSTRIAL":
      case "PERINDUSTRIAN":
        return <Factory className="h-3.5 w-3.5 text-purple-600" />;
      case "INSTITUTIONAL":
      case "INSTITUSI":
        return <Landmark className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return <Building2 className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getCategoryLabel = (type?: string) => {
    const t = String(type || "").toUpperCase();
    switch (t) {
      case "HOUSING":
        return "Perumahan";
      case "COMMERCIAL":
        return "Perdagangan";
      case "INDUSTRIAL":
        return "Perindustrian";
      case "INSTITUTIONAL":
        return "Institusi & Awam";
      default:
        return type || "Pembangunan";
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={[
        "OSC_OFFICER",
        "PLANNING_OFFICER",
        "GIS_OFFICER",
        "OSC_MANAGER",
        "PLANNING_MANAGER",
        "ADMIN",
        "SUPER_ADMIN",
        "APPLICANT",
      ]}
    >
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row bg-slate-50/50">
          <Sidebar currentTab="officer" />

          <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileSearch className="h-4 w-4 text-gov-800" />
                  <span>Modul Pegawai Teknikal</span>
                  <span>/</span>
                  <span className="text-gov-800">Ruang Semakan & Pengesyoran OSC</span>
                </div>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Ruang Kerja Pegawai Perancang OSC
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Pusat semakan pematuhan teknikal berasaskan Rancangan Tempatan Daerah (RTD) Langkawi 2030 dan penjanaan ulasan rasmi OSC.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchQueue}
                  disabled={isRefreshing}
                  className="h-9 gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs">
                  <UserCheck className="h-4 w-4 text-amber-700" />
                  <span>{role === "PLANNING_OFFICER" ? "Pegawai Perancang" : role === "OSC_OFFICER" ? "Pegawai OSC" : role || "Pegawai Penilai"}</span>
                </div>
              </div>
            </div>

            {/* Statutory Advisory Notice */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 shadow-xs">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <strong className="font-bold text-amber-950">PANDUAN PENILAIAN TEKNIKAL OSC MPLBP:</strong>
                <span className="ml-1 text-amber-900">
                  Keputusan analisis AI merupakan sokongan semakan awalan berpandukan dokumen LCP dan Pelan DWG. Pegawai Perancang bertanggungjawab mengesahkan keselarasan pengezonan RTD Langkawi 2030, anjakan bangunan, dan syarat teknikal sebelum diterbitkan ke Kertas Pertimbangan Mesyuarat Jawatankuasa OSC.
                </span>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Menunggu Semakan
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-slate-900">{queue.length}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <FileSearch className="h-3.5 w-3.5 text-slate-400" />
                  <span>Permohonan dalam giliran penilaian</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500" />
              </Card>

              <Card className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Isu Kritikal Pematuhan
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-red-700">{criticalCount}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Perlu perhatian & ulasan pembetulan</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-red-500" />
              </Card>

              <Card className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Lulus Pra-Semakan AI
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-emerald-800">{passedCount}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mematuhi parameter asas RTD</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500" />
              </Card>

              <Card className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gov-800">
                    Pematuhan SLA OSC
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-gov-800">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-gov-900">100%</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Semua kes dalam tempoh masa</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gov-800" />
              </Card>
            </div>

            {/* Smart Toolbar & Filter Controls */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari No. Permohonan KM, Nama Projek, atau Pemohon..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-gov-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800/10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Badges & Dropdown */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mr-1">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>Kategori:</span>
                  </div>

                  {["ALL", "HOUSING", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        categoryFilter === cat
                          ? "bg-gov-800 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {cat === "ALL"
                        ? "Semua"
                        : cat === "HOUSING"
                        ? "Perumahan"
                        : cat === "COMMERCIAL"
                        ? "Perdagangan"
                        : cat === "INDUSTRIAL"
                        ? "Perindustrian"
                        : "Institusi"}
                    </button>
                  ))}

                  <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Tapis mengikut status pematuhan"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-gov-800 focus:bg-white focus:outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="NEEDS_REVIEW">Perlu Semakan Pegawai</option>
                    <option value="PASS">Lulus Pra-Semakan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SmartCheck Work Queue Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gov-800 text-white shadow-xs">
                    <FileSearch className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Giliran Semakan Teknikal Kebenaran Merancang (SmartCheck Work Queue)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Menunjukkan {filteredQueue.length} daripada {queue.length} permohonan dalam giliran aktif
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Klik <strong className="text-gov-800">&quot;Semak SmartCheck&quot;</strong> atau <strong className="text-amber-800">&quot;Beri Ulasan&quot;</strong> untuk memulakan penilaian.
                </div>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Tiada Permohonan Dijumpai</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
                      ? "Tiada permohonan menepati kriteria carian anda. Sila ubah atau tetapkan semula penapis."
                      : "Semua semakan SmartCheck telah selesai disahkan oleh pegawai penilai."}
                  </p>
                  {(searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("ALL");
                        setStatusFilter("ALL");
                      }}
                      className="mt-4 text-xs font-semibold"
                    >
                      Tetapkan Semula Penapis
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-3.5 px-4 sm:px-5">Maklumat Permohonan & Projek</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Kategori & Pemohon</th>
                        <th className="py-3.5 px-4 text-center">Keputusan AI</th>
                        <th className="py-3.5 px-4 text-center">Isu Pematuhan</th>
                        <th className="py-3.5 px-4 hidden lg:table-cell">Pegawai Ditugaskan</th>
                        <th className="py-3.5 px-4 sm:px-5 text-right">Tindakan Pegawai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white text-sm">
                      {filteredQueue.map((item) => {
                        const overallStat = item.overallStatus || item.status;
                        const isReviewRequired = overallStat !== "PASS_PRECHECK";
                        const projectName = item.projectName || item.title || "Permohonan Kebenaran Merancang";
                        const devType = item.developmentType || "Pembangunan";
                        const applicantName = item.applicantName || "Pemohon Berdaftar";

                        return (
                          <tr
                            key={item.applicationId}
                            className="transition-colors hover:bg-slate-50/80"
                          >
                            {/* Application No & Project Title */}
                            <td className="py-4 px-4 sm:px-5 align-top max-w-[340px]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-gov-800 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                                  {item.applicationNo}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                  {getCategoryIcon(devType)}
                                  <span>{getCategoryLabel(devType)}</span>
                                </span>
                              </div>
                              <h3 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                {projectName}
                              </h3>
                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  <span>Langkawi, Kedah</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString("ms-MY") : "2026-08-18"}</span>
                                </span>
                              </div>
                            </td>

                            {/* Applicant Info */}
                            <td className="py-4 px-4 align-top hidden md:table-cell max-w-[220px]">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{applicantName}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500 font-medium">
                                Principal Submitting Person (PSP)
                              </div>
                            </td>

                            {/* AI Precheck Status */}
                            <td className="py-4 px-4 align-top text-center">
                              {isReviewRequired ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                                    <Eye className="h-3.5 w-3.5 text-amber-700" />
                                    <span>Perlu Semakan</span>
                                  </span>
                                  <span className="text-[11px] text-amber-700 font-medium">Ulasan Pegawai</span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-2xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                    <span>Lulus AI</span>
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-medium">Patuh RTD</span>
                                </div>
                              )}
                            </td>

                            {/* Compliance Issues */}
                            <td className="py-4 px-4 align-top text-center">
                              {item.criticalIssues > 0 ? (
                                <div className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700">
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                  <span>{item.totalIssues} Isu ({item.criticalIssues} Kritikal)</span>
                                </div>
                              ) : item.totalIssues > 0 ? (
                                <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>{item.totalIssues} Isu Ringan</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>0 Isu</span>
                                </div>
                              )}
                            </td>

                            {/* Assigned Officer */}
                            <td className="py-4 px-4 align-top hidden lg:table-cell">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700">
                                  {item.assignedOfficer ? item.assignedOfficer.charAt(0) : "P"}
                                </div>
                                <span>{item.assignedOfficer || "Belum Ditugaskan"}</span>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-4 px-4 sm:px-5 align-top text-right">
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                                <Link href={`/applications/${item.applicationId}/comments`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1 px-2.5 text-xs font-bold text-amber-800 border-amber-300 bg-amber-50/50 hover:bg-amber-100 hover:text-amber-900"
                                  >
                                    <MessageSquareText className="h-3.5 w-3.5 text-amber-700" />
                                    <span>Beri Ulasan</span>
                                  </Button>
                                </Link>

                                <Link href={`/applications/${item.applicationId}/smartcheck`}>
                                  <Button
                                    size="sm"
                                    className="h-8 gap-1 px-3 text-xs font-bold bg-gov-800 hover:bg-gov-900 text-white shadow-xs"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Semak SmartCheck</span>
                                    <ArrowRight className="h-3 w-3 ml-0.5" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Links Footer Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gov-800" />
                <span>Rujukan Piawaian: <strong>Rancangan Tempatan Daerah Langkawi 2030 (Penggantian)</strong> & Garis Panduan Perancangan Negeri Kedah.</span>
              </div>

              <div className="flex items-center gap-3 font-semibold">
                <Link href="/management/dashboard" className="hover:text-gov-800 hover:underline">
                  Dashboard Analitik
                </Link>
                <span>•</span>
                <Link href="/management/escalations" className="hover:text-gov-800 hover:underline">
                  Status SLA & Eskalasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
