"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/ui/ApplicationStatusBadge";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { Application } from "@/types/application";
import { DEMO_10_APPLICATIONS } from "@/lib/seed/demoData";
import {
  Plus,
  Search,
  FolderKanban,
  FileEdit,
  Eye,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";

type FilterTab = "ALL" | "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "COMPLETED";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>(
    DEMO_10_APPLICATIONS as unknown as Application[]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApplications = async () => {
    if (!user) return;
    try {
      setError(null);
      const token = await user.getIdToken();
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Gagal memuatkan senarai permohonan");
      }

      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat tidak diketahui";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab === "DRAFT" && app.status !== "DRAFT") return false;
      if (activeTab === "SUBMITTED" && app.status !== "SUBMITTED") return false;
      if (
        activeTab === "IN_PROGRESS" &&
        !["DOCUMENT_CHECK", "AI_PROCESSING", "SMARTCHECK_COMPLETED", "OFFICER_REVIEW", "REQUEST_INFORMATION", "RESUBMITTED"].includes(
          app.status
        )
      ) {
        return false;
      }
      if (
        activeTab === "COMPLETED" &&
        !["VERIFIED", "COMPLETED"].includes(app.status)
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const appNo = (app.applicationNo || "").toLowerCase();
        const title = (app.title || "").toLowerCase();
        const mukim = (app.mukim || "").toLowerCase();
        const devType = (app.developmentType || "").toLowerCase();
        return (
          appNo.includes(q) ||
          title.includes(q) ||
          mukim.includes(q) ||
          devType.includes(q)
        );
      }

      return true;
    });
  }, [applications, activeTab, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Portal Pemohon</span>
                  <span>/</span>
                  <span className="text-gov-800">Senarai Permohonan Kebenaran Merancang</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Permohonan Saya
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchApplications}
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                <Link href="/applications/new">
                  <Button variant="primary" size="sm" className="bg-gov-700 text-xs shadow-xs hover:bg-gov-800">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Daftar Permohonan Baharu</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <Card>
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-1 text-xs">
                  {(
                    [
                      { key: "ALL", label: "Semua" },
                      { key: "DRAFT", label: "Draf" },
                      { key: "SUBMITTED", label: "Dihantar" },
                      { key: "IN_PROGRESS", label: "Dalam Proses" },
                      { key: "COMPLETED", label: "Selesai / Disahkan" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-sm px-3 py-1.5 font-medium transition-all ${
                        activeTab === tab.key
                          ? "bg-gov-800 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari no. rujukan atau tajuk..."
                    className="w-full rounded-sm border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-gov-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="my-3 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Table / Empty State */}
              {loading ? (
                <div className="flex items-center justify-center p-12 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-gov-700" />
                  <span className="ml-2 text-xs font-medium">Memuatkan senarai permohonan...</span>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="rounded-sm border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
                  <FolderKanban className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-2 font-bold text-slate-700">Tiada permohonan dijumpai</p>
                  <p className="mt-1 text-slate-500">
                    {searchQuery
                      ? "Tiada padanan dengan kata kunci carian."
                      : "Anda belum mempunyai sebarang rekod permohonan dalam kategori ini."}
                  </p>
                  <Link href="/applications/new" className="mt-4 inline-block">
                    <Button variant="primary" size="sm" className="bg-gov-700 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Cipta Draf Baharu</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[11px] font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="p-3">No. Rujukan</th>
                        <th className="p-3">Tajuk Cadangan & Projek</th>
                        <th className="p-3">Jenis & Mukim</th>
                        <th className="p-3">Tarikh Kemas Kini</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredApplications.map((app) => {
                        const isDraft = app.status === "DRAFT";
                        const isRequestInfo = app.status === "REQUEST_INFORMATION";

                        return (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-xs font-bold text-slate-900">
                              {app.applicationNo || `DRAFT-${app.id?.slice(0, 8).toUpperCase()}`}
                            </td>
                            <td className="max-w-md p-3">
                              <p className="line-clamp-2 font-semibold text-slate-800">
                                {app.title || "Draf Permohonan Kebenaran Merancang"}
                              </p>
                              {app.lotNo && (
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Lot: {app.lotNo}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-slate-800">
                                {app.developmentType || "-"}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Mukim {app.mukim || "-"}
                              </p>
                            </td>
                            <td className="p-3 text-slate-600">
                              {app.updatedAt ? new Date(app.updatedAt as string).toLocaleDateString("ms-MY") : "-"}
                            </td>
                            <td className="p-3">
                              <ApplicationStatusBadge status={app.status} size="sm" />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/applications/${app.id}`}>
                                  <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" title="Lihat Perincian">
                                    <Eye className="h-3 w-3" />
                                    <span>Lihat</span>
                                  </Button>
                                </Link>

                                {isDraft && (
                                  <>
                                    <Link href={`/applications/${app.id}/edit`}>
                                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] text-gov-700" title="Pinda Draf">
                                        <FileEdit className="h-3 w-3" />
                                        <span>Pinda</span>
                                      </Button>
                                    </Link>

                                    <Link href={`/applications/${app.id}/review`}>
                                      <Button variant="primary" size="sm" className="h-7 bg-gov-700 px-2 text-[11px]" title="Semak & Hantar">
                                        <Send className="h-3 w-3" />
                                        <span>Semak</span>
                                      </Button>
                                    </Link>
                                  </>
                                )}

                                {isRequestInfo && (
                                  <Link href={`/applications/${app.id}/edit`}>
                                    <Button variant="danger" size="sm" className="h-7 px-2 text-[11px]" title="Maklumat Diperlukan">
                                      <FileEdit className="h-3 w-3" />
                                      <span>Pinda & Hantar Semula</span>
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
