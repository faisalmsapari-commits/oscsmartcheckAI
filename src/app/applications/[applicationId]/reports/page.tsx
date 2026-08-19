"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ReportRecord,
  ReportType,
  ReportReadinessResult,
  ReportFreshnessResult,
  ReportIntegrityResult,
} from "@/types/reports";
import {
  ArrowLeft,
  FileText,
  Download,
  ShieldCheck,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  History,
} from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [readiness, setReadiness] = useState<ReportReadinessResult | null>(null);
  const [freshnessMap, setFreshnessMap] = useState<Record<string, ReportFreshnessResult>>({});

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [showPublishModal, setShowPublishModal] = useState<ReportRecord | null>(null);
  const [publishNote, setPublishNote] = useState("");
  const [showUnpublishModal, setShowUnpublishModal] = useState<ReportRecord | null>(null);
  const [unpublishReason, setUnpublishReason] = useState("");
  const [integrityResult, setIntegrityResult] = useState<ReportIntegrityResult | null>(null);

  const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role || "");

  const loadData = async () => {
    if (!user || !applicationId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      // 1. Reports
      const repRes = await fetch(`/api/applications/${applicationId}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (repRes.ok) {
        const rData = await repRes.json();
        setReports(rData.reports || []);

        // Fetch freshness for current reports
        const freshMap: Record<string, ReportFreshnessResult> = {};
        for (const rep of rData.reports || []) {
          try {
            const fRes = await fetch(`/api/applications/${applicationId}/reports/${rep.reportId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (fRes.ok) {
              const fData = await fRes.json();
              if (fData.freshness) {
                freshMap[rep.reportId] = fData.freshness;
              }
            }
          } catch {
            // Ignore individual freshness failure
          }
        }
        setFreshnessMap(freshMap);
      }

      // 3. Readiness
      const readRes = await fetch(`/api/applications/${applicationId}/reports/readiness`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (readRes.ok) {
        const rData = await readRes.json();
        setReadiness(rData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const handleGenerateReport = async (reportType: ReportType) => {
    if (!user || !applicationId) return;
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportType }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menjana laporan");
      }

      setSuccessMessage("Laporan PDF rasmi berjaya dijana dan disimpan.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penjanaan laporan";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishReport = async () => {
    if (!user || !applicationId || !showPublishModal) return;
    try {
      setIsPublishing(true);
      const token = await user.getIdToken();

      const res = await fetch(
        `/api/applications/${applicationId}/reports/${showPublishModal.reportId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publicationNote: publishNote }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menerbitkan laporan");
      }

      setShowPublishModal(null);
      setPublishNote("");
      setSuccessMessage("Laporan rasmi berjaya diterbitkan kepada pemohon.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penerbitan";
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishReport = async () => {
    if (!user || !applicationId || !showUnpublishModal || !unpublishReason.trim()) return;
    try {
      setIsPublishing(true);
      const token = await user.getIdToken();

      const res = await fetch(
        `/api/applications/${applicationId}/reports/${showUnpublishModal.reportId}/unpublish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: unpublishReason }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menarik balik laporan");
      }

      setShowUnpublishModal(null);
      setUnpublishReason("");
      setSuccessMessage("Laporan berjaya ditarik balik daripada paparan pemohon.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penarikan balik";
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCheckIntegrity = async (reportId: string) => {
    if (!user || !applicationId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/reports/${reportId}/integrity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrityResult(data);
      }
    } catch (err: unknown) {
      console.warn("Integrity check failed:", err);
    }
  };

  const handleDownload = async (report: ReportRecord) => {
    if (!user || !applicationId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/applications/${applicationId}/reports/${report.reportId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        throw new Error("Gagal memuat turun laporan");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat muat turun";
      alert(msg);
    }
  };

  const activeReports = reports.filter((r) => r.status !== "SUPERSEDED");
  const historicalReports = reports.filter((r) => r.status === "SUPERSEDED");

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href={`/applications/${applicationId}`} className="hover:text-gov-800">
                    Maklumat Permohonan
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pusat Laporan SmartCheck</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  LAPORAN RASMI & REKOD DIGITAL SMARTCHECK
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Dokumen rekod pra-semakan pematuhan rasmi berformat PDF dengan jaminan integriti kriptografi SHA-256.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                {isOfficer && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGenerateReport("SMARTCHECK_INTERNAL")}
                      disabled={isGenerating || Boolean(readiness && !readiness.ready)}
                      className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      <span>{isGenerating ? "Menjana..." : "Jana Lap. Dalaman"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport("SMARTCHECK_APPLICANT")}
                      disabled={isGenerating || Boolean(readiness && !readiness.verifiedCommentReady)}
                      className="text-xs text-gov-800 border-gov-300"
                    >
                      <span>Jana Lap. Pemohon</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Readiness Warnings */}
            {readiness && !readiness.ready && (
              <div className="rounded-sm border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <span>Penjanaan Laporan Disekat:</span>
                </div>
                <ul className="list-disc list-inside mt-1 text-[11px] text-amber-800">
                  {readiness.blockingIssues.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alerts */}
            {errorMessage && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Active Reports List */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase text-slate-800 tracking-wider">
                Laporan Semasa & Terkini ({activeReports.length})
              </h2>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Memuatkan senarai laporan...</div>
              ) : activeReports.length === 0 ? (
                <Card className="p-8 text-center text-xs text-slate-500">
                  <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="font-bold text-sm text-slate-800">Tiada Laporan Dijana</p>
                  <p className="mt-1">
                    {isOfficer
                      ? "Sila klik butang 'Jana Lap. Dalaman' di atas untuk menjana dokumen PDF rasmi."
                      : "Laporan rasmi akan dipaparkan di sini setelah diterbitkan oleh pihak Majlis."}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {activeReports.map((rep) => {
                    const fresh = freshnessMap[rep.reportId];
                    return (
                      <Card key={rep.reportId} className="p-4 border-l-4 border-l-gov-800 space-y-3">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {rep.reportType === "SMARTCHECK_INTERNAL"
                                  ? "LAPORAN DALAMAN OSC"
                                  : rep.reportType === "SMARTCHECK_APPLICANT"
                                  ? "SALINAN PEMOHON"
                                  : "PAKEJ AUDIT LENGKAP"}
                              </span>
                              <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                v{rep.version}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {rep.fileName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                                rep.visibility === "APPLICANT_VISIBLE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {rep.visibility === "APPLICANT_VISIBLE" ? "DITERBITKAN" : "DALAMAN"}
                            </span>
                          </div>
                        </div>

                        {/* Stale Warning */}
                        {fresh && fresh.isStale && (
                          <div className="rounded-sm bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                            <strong>Status: Tidak Terkini.</strong> {fresh.message}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400">SmartCheck:</span>{" "}
                            <strong className="font-mono text-slate-800">{rep.smartCheckId.slice(0, 14)}...</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Saiz Fail:</span>{" "}
                            <strong>{(rep.fileSize / 1024).toFixed(1)} KB</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Dijana Oleh:</span>{" "}
                            <strong>{rep.generatedBy}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Checksum (SHA-256):</span>{" "}
                            <strong className="font-mono text-[10px]">{rep.checksum.slice(0, 10)}...</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckIntegrity(rep.reportId)}
                              className="text-[11px] text-slate-700"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1 text-slate-500" />
                              <span>Semak Integriti</span>
                            </Button>

                            {isOfficer && rep.reportType === "SMARTCHECK_AUDIT_PACKAGE" && (
                              <Link href={`/api/applications/${applicationId}/reports/${rep.reportId}/audit-manifest`} target="_blank">
                                <Button variant="outline" size="sm" className="text-[11px] text-slate-600">
                                  <span>Manifest JSON</span>
                                </Button>
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isOfficer && rep.visibility === "INTERNAL" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPublishModal(rep)}
                                className="text-[11px] text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                <span>Terbitkan</span>
                              </Button>
                            )}

                            {isOfficer && rep.visibility === "APPLICANT_VISIBLE" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUnpublishModal(rep)}
                                className="text-[11px] text-amber-800 border-amber-300 hover:bg-amber-50"
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                <span>Tarik Balik</span>
                              </Button>
                            )}

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDownload(rep)}
                              className="bg-gov-800 text-[11px] hover:bg-gov-900"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span>Muat Turun</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historical Reports */}
            {isOfficer && historicalReports.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600">
                  <History className="h-4 w-4" />
                  <span>Arkib Laporan Terdahulu (Superseded) ({historicalReports.length})</span>
                </div>

                <div className="space-y-2">
                  {historicalReports.map((hRep) => (
                    <div
                      key={hRep.reportId}
                      className="flex items-center justify-between rounded-sm bg-slate-50 p-3 text-xs border border-slate-200"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {hRep.reportType} (Versi {hRep.version})
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {hRep.fileName} • Checksum: {hRep.checksum.slice(0, 10)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-sm bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          SUPERSEDED
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(hRep)}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span>Muat Turun</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Publish Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-emerald-800">
                <Send className="h-4 w-4" />
                <h3 className="text-sm font-bold">Terbitkan Laporan Kepada Pemohon</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-slate-600">
                  Laporan rasmi (Versi {showPublishModal.version}) akan dipaparkan secara rasmi kepada pemohon.
                </p>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Nota Penerbitan (Pilihan)</label>
                  <textarea
                    rows={2}
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    placeholder="Contoh: Sila rujuk laporan SmartCheck rasmi bagi permohonan ini..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPublishModal(null)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePublishReport}
                    disabled={isPublishing}
                    className="bg-emerald-800 text-white text-xs hover:bg-emerald-900"
                  >
                    {isPublishing ? "Menerbitkan..." : "Terbitkan Laporan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unpublish Modal */}
        {showUnpublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-amber-800">
                <Lock className="h-4 w-4" />
                <h3 className="text-sm font-bold">Tarik Balik Penerbitan Laporan</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-slate-600">
                  Laporan ini akan dikembalikan ke status <strong>DALAMAN</strong> dan tidak lagi boleh diakses oleh pemohon.
                </p>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Alasan Penarikan Balik (Wajib)</label>
                  <textarea
                    rows={3}
                    value={unpublishReason}
                    onChange={(e) => setUnpublishReason(e.target.value)}
                    placeholder="Contoh: Pembetulan data pelan pemajuan selepas perbincangan teknikal..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUnpublishModal(null)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUnpublishReport}
                    disabled={!unpublishReason.trim() || isPublishing}
                    className="bg-amber-800 text-white text-xs hover:bg-amber-900"
                  >
                    {isPublishing ? "Menarik Balik..." : "Tarik Balik Laporan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrity Modal */}
        {integrityResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-gov-800">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Keputusan Semakan Integriti Digital</h3>
                </div>
                <button
                  onClick={() => setIntegrityResult(null)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Status Integriti:</span>
                  <span
                    className={`rounded-sm px-2 py-0.5 font-bold ${
                      integrityResult.status === "VALID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {integrityResult.status === "VALID" ? "SAH (VALID)" : "TIDAK SAH / PINDAAN DIKESAN"}
                  </span>
                </div>

                <div className="rounded-sm bg-slate-50 p-2.5 font-mono text-[11px] space-y-1 border border-slate-200">
                  <div>
                    <span className="text-slate-500">Algoritma:</span> {integrityResult.algorithm}
                  </div>
                  <div>
                    <span className="text-slate-500">Checksum Sah:</span> {integrityResult.expectedChecksum}
                  </div>
                  <div>
                    <span className="text-slate-500">Tarikh Semakan:</span> {integrityResult.checkedAt}
                  </div>
                </div>

                <p className="text-slate-700">{integrityResult.message}</p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIntegrityResult(null)} className="text-xs">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
