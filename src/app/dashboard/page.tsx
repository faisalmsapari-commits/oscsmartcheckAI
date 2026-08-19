"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Cpu,
  Clock,
  CheckCircle2,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { OfficerSlaCredibilityCard } from "@/components/dashboard/OfficerSlaCredibilityCard";

interface DemoAppItem {
  id: string;
  applicationNo: string;
  title: string;
  developmentType: string;
  developmentCategory: string;
  mukim: string;
  lotNo?: string;
  status: string;
  currentVersion: number;
  applicantName: string;
  estimatedCost?: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, profile, role, organizationId } = useAuth();
  const [applications, setApplications] = useState<DemoAppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const loadApplications = async () => {
    try {
      setLoading(true);
      const token = user ? await user.getIdToken() : "mock-token-for-APPLICANT";
      const res = await fetch("/api/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.warn("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !searchTerm ||
        app.applicationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.mukim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ||
        app.developmentCategory === categoryFilter ||
        app.developmentType === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [applications, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const total = applications.length;
    const smartCheck = applications.filter((a) =>
      ["AI_PROCESSING", "SMARTCHECK_COMPLETED", "SMARTCHECK_READY"].includes(a.status)
    ).length;
    const officerReview = applications.filter((a) =>
      ["OFFICER_REVIEW", "REQUEST_INFORMATION", "DOCUMENT_CHECK", "RESUBMITTED"].includes(a.status)
    ).length;
    const completed = applications.filter((a) =>
      ["VERIFIED", "COMPLETED", "REPORT_READY"].includes(a.status)
    ).length;

    return { total, smartCheck, officerReview, completed };
  }, [applications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">SELESAI (LULUS)</Badge>;
      case "VERIFIED":
        return <Badge variant="info">DISAHKAN PEGAWAI</Badge>;
      case "OFFICER_REVIEW":
        return <Badge variant="warning">SEMAKAN PEGAWAI</Badge>;
      case "REQUEST_INFORMATION":
        return <Badge variant="danger">PINDAAN (RFI)</Badge>;
      case "RESUBMITTED":
        return <Badge variant="info">PELAN PINDA V2</Badge>;
      case "SMARTCHECK_COMPLETED":
        return <Badge variant="success">SMARTCHECK LULUS</Badge>;
      case "AI_PROCESSING":
        return <Badge variant="info">PROSES AI & GIS</Badge>;
      case "DOCUMENT_CHECK":
        return <Badge variant="warning">SEMAKAN DOKUMEN</Badge>;
      case "SUBMITTED":
        return <Badge variant="neutral">BARU DIHANTAR</Badge>;
      default:
        return <Badge variant="neutral">DRAF PEMOHON</Badge>;
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "PELANCONGAN":
      case "HOTEL":
        return <span className="rounded-sm bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">PELANCONGAN</span>;
      case "PERUMAHAN":
      case "HOUSING":
        return <span className="rounded-sm bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">PERUMAHAN</span>;
      case "PERDAGANGAN":
      case "COMMERCIAL":
        return <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">PERDAGANGAN</span>;
      case "INDUSTRI":
      case "INDUSTRIAL":
        return <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">INDUSTRI</span>;
      case "PEMBANGUNAN_BERCAMPUR":
      case "MIXED_DEVELOPMENT":
        return <span className="rounded-sm bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-800">BERCAMPUR</span>;
      default:
        return <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">{cat || "INSTITUSI"}</span>;
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          {/* Navigation Sidebar */}
          <Sidebar currentTab="dashboard" />

          {/* Dashboard Main Content Body */}
          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Breadcrumb & Quick Actions Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>OSC MPLBP</span>
                  <span>/</span>
                  <span className="text-gov-800">Papan Pemuka Utama</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Pusat Kawalan Pematuhan Perancangan
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadApplications}
                  isLoading={loading}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Muat Semula</span>
                </Button>
                <Link href="/applications/new">
                  <Button variant="primary" size="sm" className="bg-gov-700 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Permohonan Baru</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Authenticated User Status Card */}
            <div className="rounded-sm border border-slate-300 bg-white p-4 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Selamat Kembali, {profile?.displayName || user?.displayName || user?.email}
                    </span>
                    <Badge variant="gold">{role || "PENGGUNA"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Organisasi: <strong className="text-slate-700">{organizationId || "MPLBP"}</strong> • Emel:{" "}
                    <span className="font-mono text-slate-600">{user?.email || "demo@mplbp.gov.my"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/officer">
                    <Button variant="outline" size="sm" className="border-gov-600 text-gov-800 text-xs">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Ruang Pegawai</span>
                    </Button>
                  </Link>

                  <Link href="/management/dashboard">
                    <Button variant="outline" size="sm" className="border-gold-600 text-gold-900 text-xs">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>Dashboard Pengurusan</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Key Metric Overview Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Jumlah Permohonan</span>
                  <FolderOpen className="h-4 w-4 text-gov-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="mt-1 text-[11px] text-slate-500">Permohonan KM didaftarkan</div>
              </Card>

              <Card className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Dalam Semakan SmartCheck</span>
                  <Cpu className="h-4 w-4 text-sky-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.smartCheck}</div>
                <div className="mt-1 text-[11px] text-slate-500">Document AI & GIS spatial</div>
              </Card>

              <Card className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Semakan Pegawai OSC</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.officerReview}</div>
                <div className="mt-1 text-[11px] text-slate-500">Penilaian teknikal & isu RFI</div>
              </Card>

              <Card className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Disahkan / Selesai</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.completed}</div>
                <div className="mt-1 text-[11px] text-slate-500">Laporan rasmi diterbitkan</div>
              </Card>
            </div>

            {/* Officer Credibility & Client Charter SLA Performance Section */}
            <OfficerSlaCredibilityCard />

            {/* Submissions Section */}
            <Card headerTitle="Senarai Permohonan Kebenaran Merancang (KM)">
              <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari no. rujukan, lot, mukim, pemaju..."
                      className="w-full rounded-sm border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-gov-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      aria-label="Tapis mengikut kategori pembangunan"
                      className="rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-gov-600 focus:outline-hidden"
                    >
                      <option value="ALL">Semua Kategori</option>
                      <option value="PELANCONGAN">Pelancongan / Hotel</option>
                      <option value="PERUMAHAN">Perumahan</option>
                      <option value="PERDAGANGAN">Perdagangan / Komersial</option>
                      <option value="INDUSTRI">Industri</option>
                      <option value="PEMBANGUNAN_BERCAMPUR">Bercampur</option>
                      <option value="INSTITUSI">Institusi</option>
                      <option value="LAIN_LAIN">Lain-lain / Pertanian</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Menunjukkan <span className="font-semibold text-slate-900">{filteredApplications.length}</span> daripada {applications.length} rekod
                </div>
              </div>

              <div className="overflow-x-auto rounded-sm border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">No. Rujukan OSC</th>
                      <th className="px-3.5 py-2.5">Tajuk Cadangan & Lokasi</th>
                      <th className="px-3.5 py-2.5">Kategori</th>
                      <th className="px-3.5 py-2.5">Status Proses</th>
                      <th className="px-3.5 py-2.5">Pemohon / Perunding</th>
                      <th className="px-3.5 py-2.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                          Tiada rekod penyerahan permohonan yang sepadan.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-3 font-mono font-bold text-gov-800 whitespace-nowrap">
                            {app.applicationNo}
                            <span className="block text-[10px] font-normal text-slate-400">
                              v{app.currentVersion || 1}.0
                            </span>
                          </td>
                          <td className="px-3.5 py-3 max-w-xs">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {app.title}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Mukim {app.mukim} • {app.lotNo || "Lot Kawasan"}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {getCategoryBadge(app.developmentCategory || app.developmentType)}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="px-3.5 py-3 max-w-[180px] truncate text-slate-700">
                            {app.applicantName}
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <Link href={`/applications/${app.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gov-600 text-gov-800 hover:bg-gov-50 text-[11px] px-2 py-1"
                              >
                                <span>Lihat Butiran</span>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
