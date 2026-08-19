/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { ArrowLeft, RefreshCw, Search, ExternalLink } from "lucide-react";

export default function ManagementApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.warn("Load applications failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = applications.filter((app) => {
    const term = search.toLowerCase();
    return (
      (app.applicationNo || "").toLowerCase().includes(term) ||
      (app.projectInfo?.projectName || app.title || "").toLowerCase().includes(term) ||
      (app.siteInfo?.mukim || "").toLowerCase().includes(term)
    );
  });

  return (
    <ProtectedRoute
      allowedRoles={[
        "OSC_MANAGER",
        "PLANNING_MANAGER",
        "OSC_OFFICER",
        "PLANNING_OFFICER",
        "ADMIN",
        "SUPER_ADMIN",
      ]}
    >
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="management" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/management/dashboard" className="hover:text-gov-800">
                    Dashboard Pengurusan
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Senarai Terperinci Permohonan</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  SENARAI PERMOHONAN KEBENARAN MERANCANG (KM)
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Paparan audit dan pengawasan pengurusan untuk semua permohonan dalam sistem.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/management/dashboard">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Kembali ke Dashboard</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nombor permohonan, tajuk atau mukim..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No. Permohonan</th>
                      <th className="py-2.5 px-3">Tajuk Projek</th>
                      <th className="py-2.5 px-3">Mukim</th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Memuatkan data...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Tiada permohonan dijumpai.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-gov-800">
                            {app.applicationNo || app.id}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {app.projectInfo?.projectName || app.title || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{app.siteInfo?.mukim || app.mukim || "-"}</td>
                          <td className="py-2.5 px-3 text-slate-600">{app.developmentType || "-"}</td>
                          <td className="py-2.5 px-3">
                            <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link href={`/applications/${app.id}`}>
                              <Button variant="outline" size="sm" className="text-[11px] h-7 px-2">
                                <span>Buka</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
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
