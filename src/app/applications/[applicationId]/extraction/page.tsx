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
  PlanningFact,
  ExtractionCompleteness,
  ExtractionSummary,
} from "@/types/extraction";
import { Application } from "@/types/application";
import { DEMO_10_APPLICATIONS, getDemoFactsForApp } from "@/lib/seed/demoData";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
  FolderSearch,
  MinusCircle,
} from "lucide-react";

export default function LcpExtractionPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const initialFacts = applicationId ? (getDemoFactsForApp(applicationId) as unknown as PlanningFact[]) : [];

  const [application, setApplication] = useState<Application | null>(demoApp);
  const [facts, setFacts] = useState<PlanningFact[]>(initialFacts);
  const [summary, setSummary] = useState<ExtractionSummary | null>({
    documentVersion: 1,
    documentId: `doc-${applicationId}-lcp`,
    totalPages: 18,
    totalExtracted: initialFacts.length,
    highConfidenceCount: initialFacts.length,
    mediumConfidenceCount: 0,
    lowConfidenceCount: 0,
    conflictCount: initialFacts.filter((f) => f.status === "CONFLICT").length,
    notFoundCount: 0,
    confirmedCount: initialFacts.filter((f) => f.status === "MANUALLY_CONFIRMED").length,
    correctedCount: 0,
  });
  const [completeness, setCompleteness] = useState<ExtractionCompleteness | null>({
    documentVersion: 1,
    totalRequiredFacts: initialFacts.length,
    extractedFacts: initialFacts.length,
    confirmedFacts: initialFacts.filter((f) => f.status === "MANUALLY_CONFIRMED").length,
    missingFacts: [],
    conflicts: [],
    lowConfidenceFacts: [],
    completenessPercentage: 100,
    readyForSmartCheck: true,
  });
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // View Source Modal
  const [sourceFact, setSourceFact] = useState<PlanningFact | null>(null);

  // Correction Modal
  const [correctingFact, setCorrectingFact] = useState<PlanningFact | null>(null);
  const [correctedValueInput, setCorrectedValueInput] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role || "");

  const fetchExtractionData = async () => {
    if (!user || !applicationId) return;
    try {
      setErrorMessage(null);
      const token = await user.getIdToken();

      const safeJson = async (r: Response) => {
        try {
          const contentType = r.headers.get("content-type");
          if (r.ok && contentType && contentType.includes("application/json")) {
            return await r.json();
          }
          return null;
        } catch {
          return null;
        }
      };

      // Fetch Application & Extraction data safely
      const [appData, data] = await Promise.all([
        fetch(`/api/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(safeJson).catch(() => null),
        fetch(`/api/applications/${applicationId}/extraction`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(safeJson).catch(() => null),
      ]);

      if (appData?.application) {
        setApplication(appData.application);
      }

      if (data) {
        if (data.facts) setFacts(data.facts);
        if (data.summary) setSummary(data.summary);
        if (data.completeness) setCompleteness(data.completeness);
      }
    } catch {
      // Keep resilient fallback state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtractionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const handleTriggerReprocess = async () => {
    if (!user || !applicationId) return;
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/extraction/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ forceReprocess: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memproses semula LCP");
      }

      setSuccessMessage("Pemprosesan LCP telah dimulakan. Data sedang diekstrak...");
      setTimeout(() => {
        fetchExtractionData();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pemprosesan LCP";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFact = async (factId: string) => {
    if (!user || !isOfficer) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/extraction/facts/${factId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengesahkan fakta");
      }

      setSuccessMessage("Fakta berjaya disahkan oleh Pegawai.");
      await fetchExtractionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pengesahan fakta";
      alert(msg);
    }
  };

  const handleOpenCorrection = (fact: PlanningFact) => {
    setCorrectingFact(fact);
    setCorrectedValueInput(String(fact.confirmedValue ?? fact.value ?? ""));
    setCorrectionReason("");
  };

  const handleSubmitCorrection = async () => {
    if (!user || !correctingFact || !isOfficer) return;
    try {
      setIsSubmittingCorrection(true);
      const token = await user.getIdToken();

      const res = await fetch(
        `/api/applications/${applicationId}/extraction/facts/${correctingFact.factId}/correct`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            correctedValue: correctedValueInput,
            reason: correctionReason,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan pembetulan fakta");
      }

      setCorrectingFact(null);
      setSuccessMessage("Pembetulan nilai fakta berjaya disimpan.");
      await fetchExtractionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pembetulan fakta";
      alert(msg);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleMarkUnknown = async (factId: string) => {
    if (!user || !isOfficer) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/extraction/facts/${factId}/unknown`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menandakan fakta");
      }

      setSuccessMessage("Fakta telah ditandakan sebagai Tidak Ditemui.");
      await fetchExtractionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      alert(msg);
    }
  };

  const filteredFacts = facts.filter((fact) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "CONFLICT") return fact.status === "CONFLICT";
    return fact.category === selectedCategory;
  });

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/applications" className="hover:text-gov-800">
                    Permohonan KM
                  </Link>
                  <span>/</span>
                  <Link href={`/applications/${applicationId}`} className="font-mono text-gov-800 hover:underline">
                    {application?.applicationNo || applicationId}
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pengekstrakan Data LCP</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Pengekstrakan Laporan Cadangan Pemajuan (LCP)
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                    <Sparkles className="h-3 w-3" />
                    <span>LCP AI Intelligence</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExtractionData}
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                {isOfficer && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTriggerReprocess}
                    disabled={isProcessing}
                    className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isProcessing ? "Memproses..." : "Proses Semula LCP"}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Error / Success Alerts */}
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

            {/* Architecture Guardrail Notice */}
            <div className="flex items-start gap-2.5 rounded-sm border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <div>
                <strong>Prinsip Sokongan Keputusan:</strong> Data diekstrak secara automatik dari dokumen LCP rasmi bersama rujukan sumber muka surat. Pengekstrakan AI <strong>bukan</strong> keputusan statutori pematuhan (PATUH / TIDAK PATUH). Pegawai berkuasa boleh menyemak dan mengesahkan parameter sebelum analisis SmartCheck dijalankan.
              </div>
            </div>

            {/* Summary Statistics Cards */}
            {summary && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500">Versi LCP</span>
                  <p className="font-mono text-lg font-bold text-slate-800">v{summary.documentVersion}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500">Muka Surat</span>
                  <p className="font-mono text-lg font-bold text-slate-800">{summary.totalPages}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500">Fakta Diekstrak</span>
                  <p className="font-mono text-lg font-bold text-gov-800">{summary.totalExtracted}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700">Keyakinan Tinggi</span>
                  <p className="font-mono text-lg font-bold text-emerald-700">{summary.highConfidenceCount}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-amber-600">Keyakinan Rendah</span>
                  <p className="font-mono text-lg font-bold text-amber-600">{summary.lowConfidenceCount}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-red-600">Percanggahan</span>
                  <p className="font-mono text-lg font-bold text-red-600">{summary.conflictCount}</p>
                </Card>
              </div>
            )}

            {/* Completeness Card */}
            {completeness && (
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Status Kelengkapan Parameter: <strong>{completeness.extractedFacts || 0} / {completeness.totalRequiredFacts || 0}</strong> Fakta Diperlukan Diekstrak ({completeness.confirmedFacts || 0} Disahkan Pegawai).
                  </span>
                  {completeness.conflicts && completeness.conflicts.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{completeness.conflicts.length} Percanggahan dikesan</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <Card>
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 text-xs">
                {[
                  { key: "ALL", label: "Semua Kategori" },
                  { key: "PROJECT", label: "Projek" },
                  { key: "SITE", label: "Tapak" },
                  { key: "LAND_USE", label: "Guna Tanah" },
                  { key: "INTENSITY", label: "Intensiti & GFA" },
                  { key: "BUILDING", label: "Bangunan / Hotel" },
                  { key: "PARKING", label: "Tempat Letak Kereta" },
                  { key: "OPEN_SPACE", label: "Kawasan Lapang" },
                  { key: "ACCESS", label: "Akses / Jalan" },
                  { key: "CONFLICT", label: `Percanggahan (${summary?.conflictCount || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`rounded-sm px-2.5 py-1 font-medium transition-all ${
                      selectedCategory === tab.key
                        ? "bg-gov-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Facts Table */}
              {loading ? (
                <div className="flex items-center justify-center p-12 text-xs text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-gov-700" />
                  <span className="ml-2">Memuatkan data perancangan LCP...</span>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <FolderSearch className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-semibold">Tiada fakta dijumpai dalam kategori ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="p-2.5">Parameter Perancangan</th>
                        <th className="p-2.5">Nilai Diekstrak AI</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Keyakinan</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Rujukan Muka Surat</th>
                        <th className="p-2.5">Nilai Disahkan Pegawai</th>
                        <th className="p-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredFacts.map((fact) => {
                        const isConfirmed = fact.status === "MANUALLY_CONFIRMED";
                        const isCorrected = fact.status === "MANUALLY_CORRECTED";
                        const isNotFound = fact.status === "NOT_FOUND";
                        const isConflict = fact.status === "CONFLICT";

                        return (
                          <tr key={fact.factId} className={isConflict ? "bg-red-50/50" : "hover:bg-slate-50"}>
                            <td className="p-2.5 font-bold text-slate-900">
                              <span className="block">{fact.label}</span>
                              <span className="font-mono text-[10px] font-normal text-slate-400">{fact.key}</span>
                            </td>

                            <td className="p-2.5 font-semibold text-slate-800">
                              {isNotFound ? (
                                <span className="text-slate-400 italic">Tidak Ditemui</span>
                              ) : (
                                String(fact.value ?? "-")
                              )}
                              {fact.normalizedValue !== null && fact.normalizedValue !== fact.value && (
                                <span className="block font-mono text-[10px] text-gov-700">
                                  Standard: {String(fact.normalizedValue)}
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-slate-600">{fact.unit || "-"}</td>

                            <td className="p-2.5">
                              {fact.confidenceLevel === "HIGH" ? (
                                <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                                  {Math.round(fact.confidence * 100)}% (TINGGI)
                                </span>
                              ) : fact.confidenceLevel === "MEDIUM" ? (
                                <span className="inline-flex items-center rounded-sm bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                                  {Math.round(fact.confidence * 100)}% (SEDERHANA)
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                                  {Math.round(fact.confidence * 100)}% (RENDAH)
                                </span>
                              )}
                            </td>

                            <td className="p-2.5">
                              {isConflict ? (
                                <span className="inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                                  PERCANGGAHAN
                                </span>
                              ) : isCorrected ? (
                                <span className="inline-flex items-center rounded-sm bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                                  DIBETULKAN
                                </span>
                              ) : isConfirmed ? (
                                <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  DISAHKAN
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                  DIEKSTRAK
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {fact.sourceEvidence.length > 0 ? (
                                <button
                                  onClick={() => setSourceFact(fact)}
                                  className="inline-flex items-center gap-1 font-bold text-gov-700 underline hover:text-gov-900"
                                >
                                  <span>Muka Surat {fact.sourceEvidence.map((e) => e.pageNumber).join(", ")}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="p-2.5 font-bold text-gov-900">
                              {fact.confirmedValue !== null && fact.confirmedValue !== undefined ? (
                                <span className="text-emerald-800">{String(fact.confirmedValue)}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">Belum Disahkan</span>
                              )}
                            </td>

                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {fact.sourceEvidence.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSourceFact(fact)}
                                    className="h-6 px-1.5 text-[10px]"
                                    title="Lihat Bukti Sumber"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Sumber</span>
                                  </Button>
                                )}

                                {isOfficer && (
                                  <>
                                    {!isConfirmed && (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleConfirmFact(fact.factId)}
                                        className="h-6 bg-emerald-700 px-1.5 text-[10px] hover:bg-emerald-800"
                                        title="Sahkan Nilai AI"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Sahkan</span>
                                      </Button>
                                    )}

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenCorrection(fact)}
                                      className="h-6 px-1.5 text-[10px] text-gov-800"
                                      title="Betulkan Nilai"
                                    >
                                      <SlidersHorizontal className="h-3 w-3" />
                                      <span>Pinda</span>
                                    </Button>

                                    {!isNotFound && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMarkUnknown(fact.factId)}
                                        className="h-6 px-1 text-[10px] text-slate-500 hover:text-slate-700"
                                        title="Tandakan Tidak Ditemui"
                                      >
                                        <MinusCircle className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </>
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

        {/* View Source Evidence Modal */}
        {sourceFact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Bukti Sumber LCP: {sourceFact.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSourceFact(null)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-sm bg-slate-50 p-3">
                  <span className="font-semibold text-slate-500">Nilai Fakta Diekstrak:</span>
                  <p className="font-bold text-slate-900">{String(sourceFact.value ?? "Tidak Ditemui")}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-700">Petikan Ayat Dokumen (Citations):</span>
                  {sourceFact.sourceEvidence.map((ev, i) => (
                    <div key={i} className="rounded-sm border border-slate-200 bg-amber-50/40 p-3 text-slate-800">
                      <span className="font-mono text-[11px] font-bold text-gov-800">
                        Muka Surat {ev.pageNumber} (LCP Versi {ev.documentVersion}):
                      </span>
                      <blockquote className="mt-1 border-l-2 border-gov-700 pl-2 font-serif italic text-slate-700">
                        &ldquo;{ev.quotedText}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSourceFact(null)} className="text-xs">
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Correction Modal */}
        {correctingFact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-gov-800">
                <SlidersHorizontal className="h-4 w-4" />
                <h3 className="text-sm font-bold">Pindaan & Pembetulan Fakta oleh Pegawai</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Parameter:</span>
                  <p className="font-bold text-slate-900">{correctingFact.label}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500">Nilai Asal Diekstrak AI (Kekal dalam Log Audit):</span>
                  <p className="font-mono text-slate-700">{String(correctingFact.value ?? "-")}</p>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Nilai Rasmi Disahkan Pegawai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={correctedValueInput}
                    onChange={(e) => setCorrectedValueInput(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs text-slate-900 focus:border-gov-800 focus:outline-none"
                    placeholder="Contoh: 176"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Sebab / Ulasan Pindaan (Pilihan)</label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs text-slate-900 focus:border-gov-800 focus:outline-none"
                    placeholder="Contoh: Semakan pelan mendapati 4 petak tambahan di blok belakang..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCorrectingFact(null)}
                    disabled={isSubmittingCorrection}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitCorrection}
                    disabled={!correctedValueInput.trim() || isSubmittingCorrection}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isSubmittingCorrection ? "Menyimpan..." : "Simpan Pindaan"}
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
