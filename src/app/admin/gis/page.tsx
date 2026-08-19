"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { GisDataset } from "@/types/gis";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Database,
  Upload,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function GisAdminPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<GisDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Dataset Form Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [datasetCode, setDatasetCode] = useState("RTD_LANGKAWI_2030_P2");
  const [datasetName, setDatasetName] = useState("RTD Langkawi 2030 (Pengubahan 2)");
  const [datasetType, setDatasetType] = useState("RTD_ZONING");
  const [sourceAgency, setSourceAgency] = useState("PLANMalaysia Kedah");
  const [version, setVersion] = useState("V2026.02");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDatasets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/gis/datasets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memuatkan set data GIS");
      }

      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePublishDataset = async (datasetId: string) => {
    if (!user) return;
    try {
      setIsPublishing(datasetId);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/admin/gis/datasets/${datasetId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menerbitkan set data");
      }

      setSuccessMessage("Set data GIS berjaya diterbitkan (Status: AKTIF).");
      await fetchDatasets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penerbitan";
      setErrorMessage(msg);
    } finally {
      setIsPublishing(null);
    }
  };

  const handleCreateDataset = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/gis/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          datasetCode,
          datasetName,
          datasetType,
          sourceAgency,
          version,
          sourceCrs: "EPSG:4326",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mendaftar set data");
      }

      setIsCreateOpen(false);
      setSuccessMessage("Set data GIS berjaya didaftarkan.");
      await fetchDatasets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pendaftaran";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/admin" className="hover:text-gov-800">
                    Pentadbiran Sistem
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pengurusan Set Data GIS</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    PENTADBIRAN SET DATA GIS AUTORITATIF
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                    <Database className="h-3 w-3" />
                    <span>PostGIS Registry</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={fetchDatasets} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Daftar Set Data</span>
                </Button>
              </div>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Dataset Registry Table */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900">Senarai Set Data Spatial Autoritatif</h3>
                </div>
                <span className="font-mono text-xs text-slate-500">{datasets.length} Set Data Didaftarkan</span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Kod Set Data</th>
                      <th className="p-2.5">Nama & Agensi Sumber</th>
                      <th className="p-2.5">Jenis</th>
                      <th className="p-2.5">Versi</th>
                      <th className="p-2.5">Sistem Koordinat (CRS)</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datasets.map((ds) => (
                      <tr key={ds.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{ds.datasetCode}</td>
                        <td className="p-2.5">
                          <span className="block font-semibold text-slate-900">{ds.datasetName}</span>
                          <span className="text-[11px] text-slate-500">Agensi: {ds.sourceAgency}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {ds.datasetType}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-semibold text-gov-800">{ds.version}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{ds.sourceCrs}</td>
                        <td className="p-2.5">
                          {ds.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>AKTIF</span>
                            </span>
                          ) : ds.status === "SUPERSEDED" ? (
                            <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              DIGANTIKAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              DRAF
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          {ds.status === "DRAFT" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handlePublishDataset(ds.id)}
                              disabled={isPublishing === ds.id}
                              className="h-6 bg-emerald-700 px-2 text-[10px] hover:bg-emerald-800"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              <span>{isPublishing === ds.id ? "Menerbitkan..." : "Terbitkan (Aktif)"}</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Register Dataset */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Daftar Set Data GIS Baharu</h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Kod Set Data</label>
                  <input
                    type="text"
                    value={datasetCode}
                    onChange={(e) => setDatasetCode(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Nama Set Data</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Jenis</label>
                    <select
                      value={datasetType}
                      onChange={(e) => setDatasetType(e.target.value)}
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                    >
                      <option value="CADASTRAL">Lot Kadaster</option>
                      <option value="RTD_ZONING">Zon RTD</option>
                      <option value="ROAD">Rangkaian Jalan</option>
                      <option value="FACILITY">Kemudahan Awam</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Versi</label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Agensi Sumber</label>
                  <input
                    type="text"
                    value={sourceAgency}
                    onChange={(e) => setSourceAgency(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateDataset}
                    disabled={isSubmitting}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isSubmitting ? "Mendaftar..." : "Simpan Set Data"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
