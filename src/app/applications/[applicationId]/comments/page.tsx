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
import { Application } from "@/types/application";
import {
  DEMO_10_APPLICATIONS,
  getDemoCommentDraftForApp,
  getDemoVerifiedCommentsForApp,
  getDemoCommentReadiness,
  getDemoCommentTemplates,
} from "@/lib/seed/demoData";
import {
  CommentDraft,
  VerifiedComment,
  CommentReadinessResult,
  CommentDiffResult,
  StandardPhraseTemplate,
} from "@/types/comments";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  FileCheck,
  BookOpen,
  Plus,
} from "lucide-react";

export default function CommentWorkspacePage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const initialDraft = demoApp ? getDemoCommentDraftForApp(applicationId) : null;
  const initialVerified = demoApp ? getDemoVerifiedCommentsForApp(applicationId) : [];
  const initialReadiness = demoApp ? getDemoCommentReadiness() : null;
  const initialTemplates = getDemoCommentTemplates();

  const [application, setApplication] = useState<Application | null>(demoApp);
  const [draft, setDraft] = useState<CommentDraft | null>(initialDraft);
  const [verifiedComments, setVerifiedComments] = useState<VerifiedComment[]>(initialVerified);
  const [readiness, setReadiness] = useState<CommentReadinessResult | null>(initialReadiness);
  const [templates, setTemplates] = useState<StandardPhraseTemplate[]>(initialTemplates);

  const [editorText, setEditorText] = useState(
    initialDraft?.officerEditedText || initialDraft?.aiGeneratedText || ""
  );
  const [loading, setLoading] = useState(!demoApp);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState<CommentDiffResult | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [officerConfirmation, setOfficerConfirmation] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const loadData = async () => {
    if (!user || !applicationId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      // 1. App
      const appRes = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplication(appData.application);
      }

      // 2. Draft
      const draftRes = await fetch(`/api/applications/${applicationId}/comments/draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (draftRes.ok) {
        const dData = await draftRes.json();
        if (dData.draft) {
          setDraft(dData.draft);
          setEditorText(dData.draft.officerEditedText || dData.draft.aiGeneratedText || "");
        }
      }

      // 3. Verified Comments
      const verRes = await fetch(`/api/applications/${applicationId}/comments/verified`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (verRes.ok) {
        const vData = await verRes.json();
        setVerifiedComments(vData.comments || []);
      }

      // 4. Readiness
      const rRes = await fetch(`/api/applications/${applicationId}/comments/readiness`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        setReadiness(rData);
      }

      // 5. Templates
      const tRes = await fetch(`/api/admin/comment-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplates(tData.templates || []);
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

  const handleGenerateAiDraft = async () => {
    if (!user || !applicationId) return;
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/comments/draft/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ style: "STANDARD" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menjana draf ulasan");
      }

      const data = await res.json();
      setDraft(data.draft);
      setEditorText(data.draft.officerEditedText || data.draft.aiGeneratedText || "");
      setSuccessMessage("Draf ulasan AI berjaya dijana.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penjanaan draf";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualDraft = async () => {
    if (!user || !applicationId) return;
    try {
      setIsGenerating(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/comments/draft/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          initialText: "## RINGKASAN EKSEKUTIF\nUlasan disediakan secara manual oleh pegawai penilai.\n\n## ULASAN MENGIKUT KATEGORI\n...",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencipta draf manual");
      }

      const data = await res.json();
      setDraft(data.draft);
      setEditorText(data.draft.officerEditedText);
      setSuccessMessage("Draf ulasan manual berjaya didaftarkan.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !applicationId || !draft) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/comments/draft/${draft.draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          officerEditedText: editorText,
          expectedRevisionNumber: draft.revisionNumber,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan draf");
      }

      setSuccessMessage("Draf ulasan pegawai berjaya disimpan.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat menyimpan draf";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDiff = async () => {
    if (!user || !applicationId || !draft) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/comments/draft/${draft.draftId}/diff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const dData = await res.json();
        setDiffData(dData);
        setShowDiffModal(true);
      }
    } catch (err: unknown) {
      console.warn("Failed to load diff:", err);
    }
  };

  const handleVerifyComment = async () => {
    if (!user || !applicationId || !draft || !officerConfirmation) return;
    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/comments/draft/${draft.draftId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          finalText: editorText,
          confirmedByOfficer: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengesahkan ulasan");
      }

      setShowVerifyModal(false);
      setSuccessMessage("Ulasan OSC telah berjaya disahkan dan dikunci.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pengesahan";
      alert(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePublishComment = async (commentId: string) => {
    if (!user || !applicationId) return;
    try {
      setIsPublishing(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/comments/verified/${commentId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicationNote: publishNote }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menerbitkan ulasan");
      }

      setShowPublishModal(false);
      setSuccessMessage("Ulasan rasmi berjaya diterbitkan kepada pemohon.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penerbitan";
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleInsertTemplate = (text: string) => {
    setEditorText((prev) => `${prev}\n\n${text}`);
    setSelectedTemplate("");
  };

  const latestVerified = verifiedComments[0] || null;

  return (
    <ProtectedRoute allowedRoles={["OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
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
                  <span className="text-gov-800">Draf Ulasan OSC</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    RUANG KERJA ULASAN TEKNIKAL OSC
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                    <Sparkles className="h-3 w-3" />
                    <span>Gemini Assistant v1.0.0</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1 font-mono">
                  <span>Projek: <strong>{application?.projectInfo?.projectName || application?.title || "-"}</strong></span>
                  <span>•</span>
                  <span>Draf: <strong>v{draft?.version || 1} (Rev {draft?.revisionNumber || 1})</strong></span>
                  <span>•</span>
                  <span>Status: <strong>{draft?.status || "TIADA DRAF"}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/applications/${applicationId}/smartcheck`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>SmartCheck Matriks</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                {draft && (
                  <Button variant="outline" size="sm" onClick={handleOpenDiff} className="text-xs text-purple-800 border-purple-200">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Lihat Perubahan</span>
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAiDraft}
                  disabled={Boolean(isGenerating || (readiness && !readiness.ready))}
                  className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  <span>{isGenerating ? "Menjana Draf..." : draft ? "Jana Semula Draf" : "Jana Draf AI"}</span>
                </Button>
              </div>
            </div>

            {/* Readiness Blocking Alerts */}
            {readiness && !readiness.ready && (
              <div className="rounded-sm border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <span>Penjanaan Draf Ulasan Disekat:</span>
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

            {/* Verified Snapshot Banner */}
            {latestVerified && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-sm border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950 gap-2">
                <div className="flex items-start gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">ULASAN DISAHKAN PEGAWAI (Versi {latestVerified.version})</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Disahkan oleh <strong>{latestVerified.verifiedBy}</strong> pada {String(latestVerified.verifiedAt)}.
                      Status Kebolehlihatan: <strong>{latestVerified.visibility}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {latestVerified.visibility === "INTERNAL" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowPublishModal(true)}
                      className="bg-emerald-800 text-xs hover:bg-emerald-900"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      <span>Terbitkan Kepada Pemohon</span>
                    </Button>
                  )}
                  <Link href={`/applications/${applicationId}/official-comments`}>
                    <Button variant="outline" size="sm" className="text-xs text-emerald-900 border-emerald-300">
                      <span>Paparan Pemohon</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Main Editor & Tooling Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
              {/* Left 3 Columns: Editor */}
              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-bold text-xs text-slate-800">
                        {draft?.status === "AI_DRAFT"
                          ? "DRAF AI (BELUM DISAHKAN)"
                          : draft?.status === "OFFICER_EDITING"
                          ? "DRAF PEGAWAI (DALAM EDIT)"
                          : draft?.status === "VERIFIED"
                          ? "ULASAN DISAHKAN"
                          : "TIADA DRAF"}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Model: {draft?.aiModel || "Gemini 1.5"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Phrase Template Dropdown */}
                      <select
                        value={selectedTemplate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleInsertTemplate(val);
                        }}
                        className="rounded-sm border border-slate-300 p-1 text-xs"
                      >
                        <option value="">+ Masukkan Frasa Piawai...</option>
                        {templates.map((t) => (
                          <option key={t.templateId} value={t.text}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={!draft || isSaving}
                        className="text-xs text-gov-800"
                      >
                        <span>{isSaving ? "Menyimpan..." : "Simpan Draf"}</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowVerifyModal(true)}
                        disabled={!draft || !editorText.trim()}
                        className="bg-gov-800 text-xs hover:bg-gov-900"
                      >
                        <FileCheck className="h-3.5 w-3.5 mr-1" />
                        <span>Sahkan Ulasan</span>
                      </Button>
                    </div>
                  </div>

                  {/* Textarea Editor */}
                  <div className="mt-3">
                    <textarea
                      rows={20}
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      placeholder="Draf ulasan teknikal OSC akan dijana di sini..."
                      className="w-full rounded-sm border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-gov-800 focus:outline-hidden"
                    />
                  </div>
                </Card>
              </div>

              {/* Right 1 Column: Context & Metadata Sidebar */}
              <div className="space-y-4">
                <Card headerTitle="Rujukan Sumber Data">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Versi LCP:</span>
                      <strong className="block text-slate-900 font-mono">
                        v{draft?.sourceVersions?.lcpVersion || 1}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">SmartCheck Run:</span>
                      <strong className="block text-slate-900 font-mono text-[11px]">
                        {draft?.smartCheckId || "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Rule Engine Version:</span>
                      <strong className="block text-slate-900 font-mono">1.0.0</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Prompt Version:</span>
                      <strong className="block text-purple-800 font-mono">
                        {draft?.promptVersion || "1.0.0"}
                      </strong>
                    </div>
                  </div>
                </Card>

                <Card headerTitle="Tindakan Pantas">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateManualDraft}
                      className="w-full justify-start text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1 text-slate-600" />
                      <span>Cipta Draf Manual</span>
                    </Button>

                    <Link href={`/admin/comment-templates`}>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs text-slate-700">
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        <span>Pustaka Frasa Piawai</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Diff Modal */}
        {showDiffModal && diffData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-4xl rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Perbandingan Teks (AI Draft vs Pindaan Pegawai)</h3>
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs max-h-[70vh] overflow-y-auto font-mono">
                <div className="rounded-sm bg-slate-50 p-3 border border-slate-200">
                  <strong className="block text-slate-700 border-b border-slate-200 pb-1 mb-2">Draf Asal AI</strong>
                  <pre className="whitespace-pre-wrap text-[11px] text-slate-700">{diffData.aiGeneratedText}</pre>
                </div>
                <div className="rounded-sm bg-purple-50/50 p-3 border border-purple-200">
                  <strong className="block text-purple-900 border-b border-purple-200 pb-1 mb-2">Pindaan Pegawai</strong>
                  <pre className="whitespace-pre-wrap text-[11px] text-purple-950">{diffData.officerEditedText}</pre>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowDiffModal(false)} className="text-xs">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-gov-800">
                <FileCheck className="h-4 w-4" />
                <h3 className="text-sm font-bold">Pengesahan Ulasan Teknikal OSC</h3>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-700">
                  Setelah ulasan disahkan, dokumen ini akan dikunci sebagai <strong>Snapshot Ulasan Rasmi yang tidak boleh diubah</strong>.
                </p>

                <div className="rounded-sm bg-amber-50 p-3 border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Pengisytiharan Pegawai:</strong>
                  <div className="mt-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="officerConfirm"
                      checked={officerConfirmation}
                      onChange={(e) => setOfficerConfirmation(e.target.checked)}
                      className="mt-0.5 rounded-sm border-slate-300"
                    />
                    <label htmlFor="officerConfirm" className="cursor-pointer">
                      Saya mengesahkan bahawa ulasan ini telah disemak, diselaraskan mengikut garis panduan, dan kandungannya merupakan ulasan yang dipersetujui untuk proses OSC.
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowVerifyModal(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleVerifyComment}
                    disabled={!officerConfirmation || isVerifying}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isVerifying ? "Mengesahkan..." : "Sahkan Ulasan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish Modal */}
        {showPublishModal && latestVerified && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-emerald-800">
                <Send className="h-4 w-4" />
                <h3 className="text-sm font-bold">Terbitkan Ulasan Kepada Pemohon</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-slate-600">
                  Ulasan yang telah disahkan (Versi {latestVerified.version}) akan dipaparkan secara rasmi kepada pemohon.
                </p>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Nota Penerbitan (Pilihan)</label>
                  <textarea
                    rows={2}
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    placeholder="Contoh: Sila rujuk ulasan teknikal untuk tindakan..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPublishModal(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePublishComment(latestVerified.commentId)}
                    disabled={isPublishing}
                    className="bg-emerald-800 text-white text-xs hover:bg-emerald-900"
                  >
                    {isPublishing ? "Menerbitkan..." : "Terbitkan Ulasan"}
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
