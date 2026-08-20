"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  DocumentMetadata,
  DocumentType,
  DocumentCompletenessResult,
  ALLOWED_DOCUMENT_TYPES,
} from "@/types/document";
import { Application } from "@/types/application";
import { DEMO_10_APPLICATIONS, getDemoDocumentsForApp } from "@/lib/seed/demoData";
import {
  FileText,
  Upload as UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  ArrowLeft,
  X,
  ShieldAlert,
  Sparkles,
  Download,
  Loader2,
} from "lucide-react";

export default function ApplicationDocumentsPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const initialDocs = demoApp ? (getDemoDocumentsForApp(applicationId) as unknown as DocumentMetadata[]) : [];
  const [application, setApplication] = useState<Application | null>(demoApp);
  const [documents, setDocuments] = useState<DocumentMetadata[]>(initialDocs);
  const [completeness, setCompleteness] = useState<DocumentCompletenessResult | null>({
    complete: true,
    missingDocuments: [],
    uploadedDocuments: initialDocs.map((d) => d.documentType),
    totalUploaded: initialDocs.length,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingLcp, setProcessingLcp] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("LCP");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<DocumentMetadata | null>(null);

  // Rejection Modal State
  const [rejectingDoc, setRejectingDoc] = useState<DocumentMetadata | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Filter Tab
  const [filterMode, setFilterMode] = useState<"CURRENT" | "ALL">("ALL");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = async () => {
    if (!user || !applicationId) return;
    try {
      if (documents.length === 0) setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      // 1. Fetch application details
      const appRes = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplication(appData.application);
      }

      // 2. Fetch documents and completeness
      const docRes = await fetch(`/api/applications/${applicationId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!docRes.ok) {
        const err = await docRes.json();
        throw new Error(err.error || "Gagal memuatkan senarai dokumen");
      }

      const docData = await docRes.json();
      setDocuments(docData.documents || []);
      setCompleteness(docData.completeness || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Format fail tidak sah. Hanya fail format PDF (.pdf) dibenarkan.");
      setSelectedFile(null);
      return;
    }

    // Validate 50MB
    const MAX_BYTES = 52428800;
    if (file.size > MAX_BYTES) {
      setErrorMessage("Saiz fail melebihi had maksimum 50 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !selectedDocType) return;

    try {
      setUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", selectedDocType);

      const res = await fetch(`/api/applications/${applicationId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat naik fail.");
      }

      setSuccessMessage(`Dokumen ${selectedDocType} berjaya dimuat naik.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memuat naik dokumen";
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleProcessLcp = async () => {
    if (!user || !applicationId) return;
    try {
      setProcessingLcp(true);
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
        throw new Error(err.error || "Gagal memproses LCP");
      }

      setSuccessMessage("Pemprosesan LCP telah dimulakan.");
      setTimeout(() => {
        fetchData();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memproses LCP";
      setErrorMessage(msg);
    } finally {
      setProcessingLcp(false);
    }
  };

  const openPreview = (doc: DocumentMetadata) => {
    setPreviewDoc(doc);
  };

  const handleRejectDocument = async () => {
    if (!user || !rejectingDoc || !rejectionReason.trim()) return;

    try {
      setIsSubmittingReject(true);
      const token = await user.getIdToken();
      const docId = rejectingDoc.documentId || rejectingDoc.id;

      const res = await fetch(`/api/applications/${applicationId}/documents/${docId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menolak dokumen");
      }

      setRejectingDoc(null);
      setRejectionReason("");
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat menolak dokumen";
      alert(msg);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const displayedDocs = filterMode === "CURRENT" ? documents.filter((d) => d.isCurrent) : documents;
  const isLocked = application?.status === "VERIFIED" || application?.status === "COMPLETED";

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
                  <span className="text-gov-800">Pengurusan Dokumen & Versi</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Dokumen Kebenaran Merancang & Versi
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/applications/${applicationId}/extraction`}>
                  <Button variant="outline" size="sm" className="text-xs text-purple-800 border-purple-300 bg-purple-50 hover:bg-purple-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Lihat Pengekstrakan LCP</span>
                  </Button>
                </Link>

                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali ke Butiran Permohonan</span>
                  </Button>
                </Link>
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

            {/* Document Completeness Banner */}
            {completeness && (
              <Card
                className={`border-l-4 ${
                  completeness.complete
                    ? "border-l-emerald-500 bg-emerald-50/40"
                    : "border-l-amber-500 bg-amber-50/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {completeness.complete ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    )}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {completeness?.complete
                          ? "Status Dokumen Wajib: Lengkap (LCP Telah Dimuat Naik)"
                          : "Status Dokumen Wajib: Belum Lengkap"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Jumlah dokumen dimuat naik: <strong>{completeness?.totalUploaded || 0}</strong> dokumen.
                        {completeness?.missingDocuments && completeness.missingDocuments.length > 0 && (
                          <span className="text-amber-800 font-medium">
                            {" "}Dokumen wajib belum dimuat naik: {completeness.missingDocuments.join(", ")}.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Upload Section (Only shown if application not locked) */}
            {!isLocked ? (
              <Card headerTitle="Muat Naik Dokumen Kebenaran Merancang (PDF Sahaja)">
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Document Type Dropdown */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Jenis Dokumen <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                        className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none"
                      >
                        {ALLOWED_DOCUMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type === "LCP"
                              ? "LCP (Laporan Cadangan Pemajuan) - Wajib"
                              : type === "SITE_PLAN"
                              ? "SITE PLAN (Pelan Tapak)"
                              : type === "LOCATION_PLAN"
                              ? "LOCATION PLAN (Pelan Lokasi)"
                              : type === "LAYOUT_PLAN"
                              ? "LAYOUT PLAN (Pelan Susunatur)"
                              : type === "BUILDING_PLAN"
                              ? "BUILDING PLAN (Pelan Bangunan)"
                              : type === "SUPPORTING_DOCUMENT"
                              ? "DOKUMEN SOKONGAN"
                              : "LAIN-LAIN"}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Memuat naik jenis dokumen yang sama akan mencipta <strong>Versi Baharu</strong> secara automatik.
                      </p>
                    </div>

                    {/* File Input */}
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Pilih Fail Pelan / Laporan (Maks. 50 MB, PDF Sahaja) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileChange}
                          className="w-full rounded-sm border border-slate-300 bg-white p-1.5 text-xs text-slate-700 file:mr-3 file:rounded-sm file:border-0 file:bg-gov-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-gov-800 hover:file:bg-gov-100"
                        />

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={!selectedFile || uploading}
                          className="shrink-0 bg-gov-800 text-xs shadow-xs hover:bg-gov-900 disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Memuat Naik...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" />
                              <span>Muat Naik Dokumen</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {selectedFile && (
                        <p className="mt-1 text-[11px] font-medium text-emerald-700">
                          Fail dipilih: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </Card>
            ) : (
              <div className="rounded-sm border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Mod Baca Sahaja:</strong> Permohonan telah disahkan/selesai ({application?.status}). Muat naik dokumen baharu tidak dibenarkan.
              </div>
            )}

            {/* Document Table */}
            <Card>
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Senarai Fail & Log Versi</h3>
                  <p className="text-xs text-slate-500">
                    Semua rekod fail dan arkib versi terdahulu dipelihara bagi tujuan audit statutori.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setFilterMode("ALL")}
                    className={`rounded-sm px-2.5 py-1 font-medium transition-all ${
                      filterMode === "ALL"
                        ? "bg-gov-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Semua Versi ({documents.length})
                  </button>
                  <button
                    onClick={() => setFilterMode("CURRENT")}
                    className={`rounded-sm px-2.5 py-1 font-medium transition-all ${
                      filterMode === "CURRENT"
                        ? "bg-gov-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Versi Semasa Sahaja ({documents.filter((d) => d.isCurrent).length})
                  </button>
                </div>
              </div>

              {/* Table Data */}
              {loading ? (
                <div className="flex items-center justify-center p-10 text-xs text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-gov-700" />
                  <span className="ml-2">Memuatkan dokumen...</span>
                </div>
              ) : displayedDocs.length === 0 ? (
                <div className="rounded-sm border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  <FileText className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-semibold text-slate-700">Tiada dokumen dimuat naik lagi</p>
                  <p className="mt-0.5 text-slate-500">
                    Sila gunakan borang di atas untuk memuat naik LCP dan pelan-pelan cadangan pemajuan.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="p-3">Jenis Dokumen</th>
                        <th className="p-3">Nama Fail</th>
                        <th className="p-3">Versi</th>
                        <th className="p-3">Saiz Fail</th>
                        <th className="p-3">Tarikh Dimuat Naik</th>
                        <th className="p-3">Status Dokumen</th>
                        <th className="p-3">Status Pemprosesan</th>
                        <th className="p-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayedDocs.map((doc) => {
                        const isCurrent = doc.isCurrent;
                        const isRejected = doc.status === "REJECTED";
                        const isLcp = doc.documentType === "LCP";

                        return (
                          <tr key={doc.documentId || doc.id} className={!isCurrent ? "bg-slate-50/60 opacity-80" : "hover:bg-slate-50"}>
                            <td className="p-3 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-gov-700 shrink-0" />
                                <span>{doc.documentType}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-800">
                              {doc.originalFileName || doc.fileName}
                            </td>
                            <td className="p-3 font-bold">
                              <span className="inline-flex items-center gap-1 rounded-sm bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800">
                                v{doc.version || 1}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{formatFileSize(doc.fileSize)}</td>
                            <td className="p-3 text-slate-600">
                              {doc.uploadedAt ? new Date(doc.uploadedAt as string).toLocaleString("ms-MY") : "-"}
                            </td>
                            <td className="p-3">
                              {isRejected ? (
                                <span className="inline-flex items-center rounded-sm bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800">
                                  DITOLAK
                                </span>
                              ) : isCurrent ? (
                                <span className="inline-flex items-center rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                                  SEMASA (AKTIF)
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-sm bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                                  TERGANTI (v{doc.version})
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700">
                                {doc.processingStatus || "NOT_STARTED"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isLcp && isCurrent && (
                                  <>
                                    {doc.processingStatus === "COMPLETED" ? (
                                      <Link href={`/applications/${applicationId}/extraction`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[11px] text-purple-800 border-purple-300 bg-purple-50 hover:bg-purple-100"
                                          title="Lihat Data Diekstrak"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                          <span>Ekstraksi</span>
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleProcessLcp}
                                        disabled={processingLcp}
                                        className="h-7 bg-purple-700 px-2 text-[11px] hover:bg-purple-800"
                                        title="Proses LCP Sekarang"
                                      >
                                        <Sparkles className="h-3 w-3" />
                                        <span>{processingLcp ? "Memproses..." : "Proses LCP"}</span>
                                      </Button>
                                    )}
                                  </>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPreview(doc)}
                                  className="h-7 px-2 text-[11px]"
                                  title="Pratonton Dokumen"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Lihat</span>
                                </Button>

                                {/* Officer Reject Button */}
                                {["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role || "") && !isRejected && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setRejectingDoc(doc)}
                                    className="h-7 px-2 text-[11px]"
                                    title="Tolak Dokumen"
                                  >
                                    <ShieldAlert className="h-3 w-3" />
                                    <span>Tolak</span>
                                  </Button>
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

        {/* PDF Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-sm bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gov-800" />
                  <span className="text-xs font-bold text-slate-800">
                    Pratonton Dokumen: {previewDoc.documentType} (Versi {previewDoc.version}) - {previewDoc.originalFileName}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Viewer Body */}
              <div className="flex-1 bg-slate-100 p-4 text-center">
                <div className="flex h-full flex-col items-center justify-center rounded-sm border border-slate-300 bg-white p-6 shadow-inner">
                  <FileText className="h-16 w-16 text-gov-700" />
                  <h4 className="mt-3 text-sm font-bold text-slate-800">{previewDoc.originalFileName}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Jenis: <strong>{previewDoc.documentType}</strong> • Saiz: <strong>{formatFileSize(previewDoc.fileSize)}</strong> • Versi: <strong>v{previewDoc.version}</strong>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    Laluan Storan: {previewDoc.storagePath}
                  </p>

                  <div className="mt-6 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Memuat turun fail: ${previewDoc.storagePath}`)}
                      className="bg-gov-800 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Muat Turun Fail PDF</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDoc(null)}
                      className="text-xs"
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Officer Document Rejection Modal */}
        {rejectingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-sm font-bold">Penolakan Dokumen</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-slate-700">
                  Adakah anda pasti ingin menolak dokumen <strong>{rejectingDoc.documentType} (v{rejectingDoc.version})</strong>? Sila nyatakan ulasan penolakan:
                </p>

                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Format pelan tidak mengikut skala 1:100 yang ditetapkan..."
                  className="w-full rounded-sm border border-slate-300 p-2 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectingDoc(null)}
                    disabled={isSubmittingReject}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRejectDocument}
                    disabled={!rejectionReason.trim() || isSubmittingReject}
                    className="text-xs"
                  >
                    {isSubmittingReject ? "Memproses..." : "Sahkan Penolakan"}
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
