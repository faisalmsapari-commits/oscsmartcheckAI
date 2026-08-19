"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { DocumentCompletenessResult, DocumentMetadata } from "@/types/document";
import { ExtractionSummary } from "@/types/extraction";
import { formatArea } from "@/lib/utils/areaConverter";
import {
  ArrowLeft,
  FileEdit,
  Send,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Loader2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Compass,
  MapPin,
  FileText,
} from "lucide-react";

export default function ApplicationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params?.applicationId as string;
  const justSubmitted = searchParams?.get("submitted") === "true";
  const { user } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const [application, setApplication] = useState<Application | null>(demoApp);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [completeness, setCompleteness] = useState<DocumentCompletenessResult | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<ExtractionSummary | null>(null);
  const [loading, setLoading] = useState(!demoApp);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppAndDocs() {
      if (!user || !applicationId) return;
      try {
        setErrorMessage(null);
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch main application first for instant sub-50ms UI render
        const res = await fetch(`/api/applications/${applicationId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setApplication(data.application);
          setLoading(false); // Instantly dismiss spinner
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Gagal memuatkan permohonan");
        }

        // 2. Hydrate documents & extraction summary in background without blocking screen
        Promise.all([
          fetch(`/api/applications/${applicationId}/documents`, { headers }).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`/api/applications/${applicationId}/extraction`, { headers }).then((r) =>
            r.ok ? r.json() : null
          ),
        ])
          .then(([docData, extData]) => {
            if (docData) {
              setDocuments(docData.documents || []);
              setCompleteness(docData.completeness || null);
            }
            if (extData) {
              setExtractionSummary(extData.summary || null);
            }
          })
          .catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat";
        setErrorMessage(msg);
        setLoading(false);
      }
    }

    fetchAppAndDocs();
  }, [user, applicationId]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
        <AppShell>
          <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gov-700" />
            <span className="ml-2 text-xs font-medium text-slate-600">Memuatkan butiran permohonan...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!application) {
    return (
      <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
        <AppShell>
          <div className="p-6 text-center text-xs text-slate-600">
            Permohonan tidak dijumpai atau anda tiada kebenaran untuk melihatnya.
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isDraft = application.status === "DRAFT";
  const isRequestInfo = application.status === "REQUEST_INFORMATION";

  const hasLcp = documents.some((d) => d.documentType === "LCP" && d.isCurrent);
  const hasSitePlan = documents.some((d) => d.documentType === "SITE_PLAN" && d.isCurrent);
  const hasLayoutPlan = documents.some((d) => d.documentType === "LAYOUT_PLAN" && d.isCurrent);

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
                  <span className="text-gov-800">{application.applicationNo || "Draf"}</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {application.projectInfo?.projectName || application.title || "Permohonan Kebenaran Merancang Baharu"}
                </h1>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href="/applications">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Link href={`/applications/${applicationId}/extraction`}>
                  <Button variant="outline" size="sm" className="text-xs text-purple-800 border-purple-300 bg-purple-50 hover:bg-purple-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pengekstrakan LCP</span>
                  </Button>
                </Link>

                <Link href={`/applications/${applicationId}/documents`}>
                  <Button variant="outline" size="sm" className="text-xs text-gov-700">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Urus Dokumen</span>
                  </Button>
                </Link>

                {isDraft && (
                  <>
                    <Link href={`/applications/${applicationId}/edit`}>
                      <Button variant="outline" size="sm" className="text-xs text-gov-700">
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Pinda Draf</span>
                      </Button>
                    </Link>

                    <Link href={`/applications/${applicationId}/review`}>
                      <Button variant="primary" size="sm" className="bg-gov-700 text-xs shadow-xs hover:bg-gov-800">
                        <Send className="h-3.5 w-3.5" />
                        <span>Semak & Hantar</span>
                      </Button>
                    </Link>
                  </>
                )}

                {isRequestInfo && (
                  <Link href={`/applications/${applicationId}/edit`}>
                    <Button variant="danger" size="sm" className="text-xs">
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Kemukakan Maklumat Tambahan</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {justSubmitted && (
              <div className="flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Permohonan telah berjaya dihantar ke Pusat Setempat (OSC) MPLBP bagi semakan statutori.
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Overview Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Left 2 Cols: Details */}
              <div className="space-y-5 lg:col-span-2">
                {/* Maklumat Penyerahan & Status */}
                <Card headerTitle="Maklumat Penyerahan & Status">
                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-slate-500">No. Rujukan Rasmi:</span>
                      <p className="font-mono text-sm font-bold text-slate-900">
                        {application.applicationNo || `DRAFT-${application.id?.slice(0, 8).toUpperCase()}`}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Status Semasa:</span>
                      <div className="mt-1">
                        <ApplicationStatusBadge status={application.status} size="md" />
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Jenis Permohonan:</span>
                      <p className="font-medium text-slate-800">
                        {application.applicationType || "Kebenaran Merancang"} ({application.planningApplicationCategory || "PERDAGANGAN"})
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Versi Penyerahan:</span>
                      <p className="font-medium text-slate-800">Versi {application.currentVersion || 1}</p>
                    </div>
                  </div>
                </Card>

                {/* Ringkasan Dokumen & Kelengkapan */}
                <Card headerTitle="Dokumen Pemajuan & Pelan">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-medium text-slate-700">
                        Jumlah fail dimuat naik: <strong>{documents.length} fail</strong>{" "}
                        {completeness?.complete ? (
                          <span className="text-emerald-700 font-semibold">(Lengkap)</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">(Perlu LCP)</span>
                        )}
                      </span>
                      <Link href={`/applications/${applicationId}/documents`}>
                        <Button variant="outline" size="sm" className="h-6 text-[11px] text-gov-700">
                          <FolderOpen className="h-3 w-3" />
                          <span>Buka Ruang Dokumen</span>
                        </Button>
                      </Link>
                    </div>

                    {/* Status Dokumen Utama */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="flex items-center justify-between rounded-sm bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-700">LCP (Wajib):</span>
                        {hasLcp ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Dimuat Naik</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Belum Ada</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-sm bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-700">Pelan Tapak:</span>
                        {hasSitePlan ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Dimuat Naik</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Pilihan</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-sm bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-700">Pelan Susunatur:</span>
                        {hasLayoutPlan ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Dimuat Naik</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Pilihan</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Maklumat Pemohon */}
                <Card headerTitle="Maklumat Pemohon & Perunding">
                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-500">Pemohon / Pemaju:</span>
                        <p className="font-bold text-slate-800">{application.applicantInfo?.applicantName || "-"}</p>
                        {application.applicantInfo?.companyName && (
                          <p className="text-slate-600">{application.applicantInfo.companyName}</p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {application.applicantInfo?.email} • {application.applicantInfo?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Building className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-500">PSP / Perunding Perancang:</span>
                        <p className="font-bold text-slate-800">
                          {application.consultantInfo?.principalSubmittingPerson || "Tiada perunding dinyatakan"}
                        </p>
                        {application.consultantInfo?.consultantCompany && (
                          <p className="text-slate-600">{application.consultantInfo.consultantCompany}</p>
                        )}
                        {application.consultantInfo?.professionalRegistrationNo && (
                          <p className="text-[11px] text-slate-500">
                            No. Pendaftaran: {application.consultantInfo.professionalRegistrationNo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Maklumat Tapak & Lot */}
                <Card headerTitle="Maklumat Tapak & Lot Tanah">
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <span className="font-semibold text-slate-500">Mukim:</span>
                        <p className="font-medium text-slate-800">Mukim {application.siteInfo?.mukim || application.mukim || "-"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Daerah & Negeri:</span>
                        <p className="font-medium text-slate-800">
                          {application.siteInfo?.district || application.district || "Langkawi"}, {application.siteInfo?.state || application.state || "Kedah"}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Keluasan Tapak:</span>
                        <p className="font-bold text-gov-800">
                          {formatArea(application.siteInfo?.siteArea?.siteAreaSqm || application.siteAreaSqm, "SQM")}
                        </p>
                      </div>
                    </div>

                    {/* Lots Table */}
                    <div className="overflow-x-auto border-t border-slate-100 pt-2">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                          <tr>
                            <th className="p-2">Bil.</th>
                            <th className="p-2">No. Lot</th>
                            <th className="p-2">Mukim</th>
                            <th className="p-2">No. Hakmilik</th>
                            <th className="p-2">Status Tanah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(application.siteInfo?.lots || []).map((lot, idx) => (
                            <tr key={idx}>
                              <td className="p-2 text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-800">{lot.lotNumber}</td>
                              <td className="p-2">{lot.mukim}</td>
                              <td className="p-2 text-slate-600">{lot.titleNumber || "-"}</td>
                              <td className="p-2 text-slate-600">{lot.landStatus || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>

                {/* Parameter Pembangunan */}
                <Card headerTitle="Parameter Pembangunan">
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="font-semibold text-slate-500">Jumlah Unit:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.totalDevelopmentUnits ?? "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Bilik Hotel:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.hotelRooms ?? "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Nisbah Plot:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.plotRatio ?? "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Tingkat Maksimum:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.maximumFloors ? `${application.developmentParameters.maximumFloors} Tingkat` : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">GFA:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.grossFloorAreaSqm ? `${application.developmentParameters.grossFloorAreaSqm} m²` : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Liputan Plinth:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.siteCoveragePercent ? `${application.developmentParameters.siteCoveragePercent}%` : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Petak Kereta:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.parkingProvided ?? "-"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Kawasan Lapang:</span>
                      <p className="font-medium text-slate-800">
                        {application.developmentParameters?.openSpacePercent ? `${application.developmentParameters.openSpacePercent}%` : "-"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Col: Timeline & Metadata */}
              <div className="space-y-5">
                {/* LCP Intelligence Summary Card */}
                <Card headerTitle="LCP Intelligence & Fakta Perancangan">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Status Ekstraksi:</span>
                      {extractionSummary ? (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-2 py-0.5 font-bold text-purple-800">
                          <Sparkles className="h-3 w-3" />
                          <span>SELESAI (v{extractionSummary.documentVersion})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum Diproses</span>
                      )}
                    </div>

                    {extractionSummary && (
                      <div className="space-y-2 rounded-sm bg-slate-50 p-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fakta Diekstrak:</span>
                          <span className="font-bold text-slate-800">{extractionSummary.totalExtracted} parameter</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Keyakinan Tinggi:</span>
                          <span className="font-bold text-emerald-700">{extractionSummary.highConfidenceCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Keyakinan Rendah:</span>
                          <span className="font-bold text-amber-600">{extractionSummary.lowConfidenceCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Percanggahan:</span>
                          <span className="font-bold text-red-600">{extractionSummary.conflictCount}</span>
                        </div>
                      </div>
                    )}

                    <Link href={`/applications/${applicationId}/extraction`}>
                      <Button variant="outline" size="sm" className="w-full text-xs text-purple-900 border-purple-200 bg-purple-50 hover:bg-purple-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Semak & Sahkan Data LCP</span>
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* SmartGIS AI (MPLBP) */}
                <Card headerTitle="SmartGIS AI (Analisis Tapak & RTD)">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-gov-800" />
                        <span className="font-bold">Lot {application.siteInfo?.lots?.[0]?.lotNumber || "1234"}</span>
                      </div>
                      <span className="rounded-sm bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                        Mukim {application.siteInfo?.mukim || "Kuah"}
                      </span>
                    </div>

                    <div className="space-y-1 rounded-sm bg-slate-50 p-2.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Keluasan Tapak GIS:</span>
                        <span className="font-bold font-mono text-slate-800">12,730 m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Zon RTD 2030:</span>
                        <span className="font-bold text-purple-800">2 Zon Dikenal Pasti</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pengesahan Lokasi:</span>
                        <span className="font-bold text-amber-700">Perlu Pengesahan</span>
                      </div>
                    </div>

                    <Link href={`/applications/${applicationId}/map`}>
                      <Button variant="outline" size="sm" className="w-full text-xs text-purple-900 border-purple-200 bg-purple-50 hover:bg-purple-100">
                        <Compass className="h-3.5 w-3.5" />
                        <span>Buka SmartGIS AI ↗</span>
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* SmartCheck Pematuhan Perancangan */}
                <Card headerTitle="SmartCheck Pematuhan (Rule Engine)">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Sparkles className="h-4 w-4 text-purple-700" />
                        <span className="font-bold">Semakan Pra-Kelulusan</span>
                      </div>
                      <span className="rounded-sm bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        Enjin Peraturan v1.0
                      </span>
                    </div>

                    <div className="space-y-1 rounded-sm bg-slate-50 p-2.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pematuhan Piawai:</span>
                        <span className="font-bold text-slate-800">Deterministik 100%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status Semakan:</span>
                        <span className="font-bold text-slate-700">Sedia Dinilai</span>
                      </div>
                    </div>

                    <Link href={`/applications/${applicationId}/smartcheck`}>
                      <Button variant="primary" size="sm" className="w-full text-xs bg-purple-800 hover:bg-purple-900 shadow-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Buka Matriks Pematuhan</span>
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Draf & Ulasan OSC (AI Assisted) */}
                <Card headerTitle="Ulasan Teknikal OSC (Draf & Pengesahan)">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FileText className="h-4 w-4 text-gov-800" />
                        <span className="font-bold">Ulasan Pegawai OSC</span>
                      </div>
                      <span className="rounded-sm bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        AI Draft Assistant
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Sediakan, edit, sahkan dan terbitkan ulasan perancangan teknikal berasaskan dapatan SmartCheck.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/applications/${applicationId}/comments`}>
                        <Button variant="outline" size="sm" className="w-full text-[11px] text-gov-800 border-gov-300">
                          <span>Ruang Kerja Draf</span>
                        </Button>
                      </Link>

                      <Link href={`/applications/${applicationId}/official-comments`}>
                        <Button variant="outline" size="sm" className="w-full text-[11px] text-slate-700">
                          <span>Ulasan Rasmi</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* Laporan Rasmi SmartCheck & Audit */}
                <Card headerTitle="Laporan Rasmi SmartCheck (PDF)">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FileText className="h-4 w-4 text-gov-800" />
                        <span className="font-bold">Laporan & Audit PDF</span>
                      </div>
                      <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        SHA-256 Verified
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Jana, muat turun, semak integriti dan terbitkan laporan pra-semakan rasmi berformat PDF.
                    </p>

                    <Link href={`/applications/${applicationId}/reports`}>
                      <Button variant="primary" size="sm" className="w-full text-xs bg-gov-800 hover:bg-gov-900 shadow-xs">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        <span>Pusat Laporan & Rekod</span>
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Garis Masa & Status Aliran Kerja */}
                <Card headerTitle="Garis Masa & Status Aliran Kerja">
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-500">Tarikh Didaftar:</span>
                        <p className="font-medium text-slate-800">
                          {application.createdAt ? new Date(application.createdAt as string).toLocaleString("ms-MY") : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-500">Tarikh Dihantar:</span>
                        <p className="font-medium text-slate-800">
                          {application.submittedAt ? new Date(application.submittedAt as string).toLocaleString("ms-MY") : "Belum Dihantar (Draf)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-500">Akuan Pemohon:</span>
                        <p className="font-medium text-slate-800">
                          {application.declaration?.declarationAccepted ? "Telah Diperakui" : "Belum Disahkan"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-500">Pegawai OSC Bertanggungjawab:</span>
                      <p className="font-medium text-slate-800">
                        {application.assignedOfficerUid || "Dalam proses agihan OSC"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
