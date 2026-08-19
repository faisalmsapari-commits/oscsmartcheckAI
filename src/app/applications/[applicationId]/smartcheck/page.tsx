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
  SmartCheckRecord,
  RuleEvaluation,
} from "@/types/rules";
import {
  SmartCheckIssue,
} from "@/types/issues";
import {
  SmartCheckFreshnessResult,
  OfficerReviewCompleteness,
} from "@/types/dashboard";
import { DEMO_10_APPLICATIONS } from "@/lib/seed/demoData";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  MinusCircle,
  RefreshCw,
  X,
  Sparkles,
  SlidersHorizontal,
  Calculator,
  Search,
  AlertTriangle,
  Send,
  GitCompare,
  FileCheck,
} from "lucide-react";

export default function SmartCheckMatrixPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const [application, setApplication] = useState<Application | null>(demoApp);
  const [smartCheck, setSmartCheck] = useState<SmartCheckRecord | null>(null);
  const [results, setResults] = useState<RuleEvaluation[]>([]);
  const [issues, setIssues] = useState<SmartCheckIssue[]>([]);
  const [freshness, setFreshness] = useState<SmartCheckFreshnessResult | null>(null);
  const [completeness, setCompleteness] = useState<OfficerReviewCompleteness | null>(null);

  const [loading, setLoading] = useState(!demoApp);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"SEVERITY" | "STATUS" | "CATEGORY">("SEVERITY");

  // Drawers & Modals
  const [activeResult, setActiveResult] = useState<RuleEvaluation | null>(null);
  const [activeIssue, setActiveIssue] = useState<SmartCheckIssue | null>(null);

  // Officer Assessment Modal
  const [assessingResult, setAssessingResult] = useState<RuleEvaluation | null>(null);
  const [assessmentType, setAssessmentType] = useState<"AGREE" | "DISAGREE">("AGREE");
  const [assessmentReason, setAssessmentReason] = useState("");
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  // Officer Issue Actions (Publish / Resolve)
  const [publishingIssueId, setPublishingIssueId] = useState<string | null>(null);
  const [publishComment, setPublishComment] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<string>("OFFICER_ACCEPTED_JUSTIFICATION");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const isOfficer = [
    "OSC_OFFICER",
    "PLANNING_OFFICER",
    "GIS_OFFICER",
    "OSC_MANAGER",
    "PLANNING_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
  ].includes(role || "");

  const fetchDashboardData = async () => {
    if (!user || !applicationId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch for lightning-fast sub-100ms response
      const [appRes, res, issuesRes, freshRes, compRes] = await Promise.all([
        fetch(`/api/applications/${applicationId}`, { headers }),
        fetch(`/api/applications/${applicationId}/smartcheck`, { headers }),
        fetch(`/api/applications/${applicationId}/issues`, { headers }),
        fetch(`/api/applications/${applicationId}/smartcheck/freshness`, { headers }),
        fetch(`/api/applications/${applicationId}/smartcheck/completeness`, { headers }),
      ]);

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplication(appData.application);
      }

      if (res.ok) {
        const data = await res.json();
        setSmartCheck(data.smartCheck || data.run || null);
        setResults(data.results || []);
      }

      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData.issues || []);
      }

      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setFreshness(freshData);
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompleteness(compData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const handleStartSmartCheck = async (force: boolean = false) => {
    if (!user || !applicationId) return;
    try {
      setIsRunning(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/smartcheck/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ forceRerun: force }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memulakan SmartCheck");
      }

      setSuccessMessage("Semakan SmartCheck telah selesai dijalankan.");
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat semakan SmartCheck";
      setErrorMessage(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!user || !assessingResult || !isOfficer) return;
    try {
      setIsSubmittingAssessment(true);
      const token = await user.getIdToken();

      const res = await fetch(
        `/api/applications/${applicationId}/smartcheck/results/${assessingResult.ruleId}/assess`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assessment: assessmentType,
            reason: assessmentReason,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan ulasan pegawai");
      }

      setAssessingResult(null);
      setSuccessMessage("Ulasan penilaian pegawai berjaya direkodkan.");
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      alert(msg);
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handlePublishIssue = async () => {
    if (!user || !publishingIssueId || !isOfficer) return;
    try {
      setIsPublishing(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/issues/${publishingIssueId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ officerCommentDraft: publishComment }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menerbitkan isu");
      }

      setPublishingIssueId(null);
      setPublishComment("");
      setSuccessMessage("Isu berjaya diterbitkan kepada pemohon.");
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResolveIssue = async () => {
    if (!user || !resolvingIssueId || !isOfficer) return;
    try {
      setIsResolving(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}/issues/${resolvingIssueId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolutionType,
          resolutionNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyelesaikan isu");
      }

      setResolvingIssueId(null);
      setResolutionNote("");
      setSuccessMessage("Isu telah berjaya diselesaikan.");
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      alert(msg);
    } finally {
      setIsResolving(false);
    }
  };

  // Filter & Search Logic
  const filteredResults = results
    .filter((r) => {
      const matchCat = selectedCategory === "ALL" || r.category === selectedCategory;
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ruleEvidence.sourceClause.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "SEVERITY") {
        const score = (s: string) => (s === "CRITICAL" ? 4 : s === "MAJOR" ? 3 : s === "MODERATE" ? 2 : 1);
        return score(b.severity) - score(a.severity);
      }
      return 0;
    });

  // Dynamic Categories from Results
  const uniqueCategories = Array.from(new Set(results.map((r) => r.category)));

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* 1. Header Section */}
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
                  <span className="text-gov-800">SmartCheck Pematuhan</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    SMARTCHECK PEMATUHAN PERANCANGAN
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                    <Sparkles className="h-3 w-3" />
                    <span>Rule Engine v1.0.0</span>
                  </span>
                </div>

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1 font-mono">
                  <span>Projek: <strong>{application?.projectInfo?.projectName || application?.title || "-"}</strong></span>
                  <span>•</span>
                  <span>Lot: <strong>{application?.siteInfo?.lots?.[0]?.lotNumber || "1234"}</strong>, Mukim {application?.siteInfo?.mukim || "Kuah"}</span>
                  <span>•</span>
                  <span>LCP: <strong>v{smartCheck?.lcpDocumentVersion || 1}</strong></span>
                  <span>•</span>
                  <span>SmartCheck: <strong>{smartCheck?.smartCheckId || "-"}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Link href={`/applications/${applicationId}/smartcheck/compare`}>
                  <Button variant="outline" size="sm" className="text-xs text-purple-900 border-purple-200 hover:bg-purple-50">
                    <GitCompare className="h-3.5 w-3.5 mr-1" />
                    <span>Bandingkan Larian</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartSmartCheck(true)}
                  disabled={isRunning}
                  className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  <span>{isRunning ? "Menilai..." : "Jalankan Semula"}</span>
                </Button>
              </div>
            </div>

            {/* 2. Permanent Disclaimer Notice */}
            <div className="rounded-sm border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
              <strong>Notis Pra-Semakan:</strong> Keputusan SmartCheck merupakan hasil pra-semakan berasaskan data dan peraturan yang dikonfigurasi dalam sistem. Ulasan dan keputusan rasmi tertakluk kepada semakan serta pengesahan pegawai MPLBP.
            </div>

            {/* Stale SmartCheck Banner */}
            {freshness?.isStale && (
              <div className="flex items-center justify-between rounded-sm border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold">SmartCheck Tidak Terkini:</span> {freshness.message}
                    <ul className="list-disc list-inside mt-0.5 text-[11px] text-amber-800">
                      {freshness.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartSmartCheck(true)}
                  disabled={isRunning}
                  className="bg-amber-800 text-white text-xs hover:bg-amber-900 shrink-0"
                >
                  Jalankan Baharu
                </Button>
              </div>
            )}

            {/* Critical Issue Banner */}
            {completeness && completeness.criticalOpenIssues > 0 && (
              <div className="flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 p-3 text-xs text-red-900">
                <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
                <span>
                  <strong>Isu Kritikal Dikesan:</strong> Terdapat <strong>{completeness.criticalOpenIssues} isu berkeutamaan kritikal</strong> yang memerlukan perhatian pegawai sebelum ulasan rasmi OSC dijana.
                </span>
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

            {/* 3. Summary Cards */}
            {smartCheck && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <Card className="p-3 text-center border-l-4 border-l-gov-800">
                  <span className="text-[11px] font-semibold text-slate-500">Status Pra-Semakan</span>
                  <p className="font-bold text-xs mt-1 text-slate-900">
                    {smartCheck.overallStatus === "PASS_PRECHECK"
                      ? "MEMATUHI KRITERIA"
                      : smartCheck.overallStatus === "REVISION_REQUIRED"
                      ? "PINDAAN DIPERLUKAN"
                      : "SEMAKAN PEGAWAI"}
                  </p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500">Jumlah Semakan</span>
                  <p className="font-mono text-lg font-bold text-slate-800">{smartCheck.totalRulesEvaluated}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700">Patuh</span>
                  <p className="font-mono text-lg font-bold text-emerald-700">{smartCheck.compliantCount}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-red-600">Tidak Patuh</span>
                  <p className="font-mono text-lg font-bold text-red-600">{smartCheck.nonCompliantCount}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-amber-600">Perlu Pengesahan</span>
                  <p className="font-mono text-lg font-bold text-amber-600">{smartCheck.requiresReviewCount}</p>
                </Card>

                <Card className="p-3 text-center">
                  <span className="text-[11px] font-semibold text-purple-700">Isu Terbuka</span>
                  <p className="font-mono text-lg font-bold text-purple-800">{issues.filter((i) => i.status === "OPEN" || i.status === "IN_REVIEW").length}</p>
                </Card>
              </div>
            )}

            {/* 4. Compliance Matrix Card */}
            <Card>
              {/* Category Filter Pills & Search */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`rounded-sm px-2.5 py-1 font-medium transition-all ${
                      selectedCategory === "ALL"
                        ? "bg-gov-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-sm px-2.5 py-1 font-medium transition-all ${
                        selectedCategory === cat
                          ? "bg-gov-800 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kriteria / klausa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-sm border border-slate-300 pl-7 pr-2 py-1 text-xs"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-sm border border-slate-300 p-1 text-xs"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="NON_COMPLIANT">Tidak Patuh</option>
                    <option value="REQUIRES_REVIEW">Perlu Pengesahan</option>
                    <option value="INSUFFICIENT_DATA">Maklumat Kurang</option>
                    <option value="COMPLIANT">Patuh</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "SEVERITY")}
                    className="rounded-sm border border-slate-300 p-1 text-xs"
                  >
                    <option value="SEVERITY">Susun: Tahap Keutamaan</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 text-gov-800 font-semibold">
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                    <span>Memproses analisis pematuhan SmartCheck AI...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Menilai kriteria RTD 2030, anjakan bangunan, tempat letak kereta dan kawasan lapang.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <p className="font-semibold">Tiada peraturan pematuhan dijumpai mengikut tapisan</p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Kriteria Semakan</th>
                        <th className="p-2.5">Data Projek</th>
                        <th className="p-2.5">Keperluan</th>
                        <th className="p-2.5">Perbezaan</th>
                        <th className="p-2.5">Tahap</th>
                        <th className="p-2.5">Rujukan</th>
                        <th className="p-2.5">Isu</th>
                        <th className="p-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredResults.map((result) => {
                        const isCompliant = result.status === "COMPLIANT";
                        const isNonCompliant = result.status === "NON_COMPLIANT";
                        const isReview = result.status === "REQUIRES_REVIEW";

                        const linkedIssue = issues.find((i) => i.resultId === result.ruleId);

                        return (
                          <tr
                            key={result.ruleId}
                            className={
                              isNonCompliant
                                ? "bg-red-50/40 hover:bg-red-50/70"
                                : isReview
                                ? "bg-amber-50/30 hover:bg-amber-50/60"
                                : "hover:bg-slate-50"
                            }
                          >
                            <td className="p-2.5">
                              {isCompliant ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[10px]">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>PATUH</span>
                                </span>
                              ) : isNonCompliant ? (
                                <span className="inline-flex items-center gap-1 font-bold text-red-800 text-[10px]">
                                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                                  <span>TIDAK PATUH</span>
                                </span>
                              ) : isReview ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-800 text-[10px]">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>PERLU PENGESAHAN</span>
                                </span>
                              ) : result.status === "INSUFFICIENT_DATA" ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-[10px]">
                                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                                  <span>KURANG</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                                  <MinusCircle className="h-3.5 w-3.5" />
                                  <span>TB</span>
                                </span>
                              )}
                            </td>

                            <td className="p-2.5">
                              <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                {result.category}
                              </span>
                            </td>

                            <td className="p-2.5 font-bold text-slate-900">
                              <span className="block">{result.ruleName}</span>
                              <span className="font-mono text-[10px] font-normal text-slate-400">
                                {result.ruleCode}
                              </span>
                            </td>

                            <td className="p-2.5 font-mono font-semibold text-slate-800">
                              {result.actualValue !== null && result.actualValue !== undefined
                                ? `${String(result.actualValue)} ${result.unit || ""}`
                                : "-"}
                            </td>

                            <td className="p-2.5 font-mono text-slate-700">
                              {result.requiredValue !== null && result.requiredValue !== undefined
                                ? `${String(result.requiredValue)} ${result.unit || ""}`
                                : "-"}
                            </td>

                            <td className="p-2.5 font-mono">
                              {result.difference !== null && result.difference !== undefined ? (
                                <span
                                  className={
                                    result.difference < 0
                                      ? "text-red-600 font-bold"
                                      : "text-emerald-700 font-bold"
                                  }
                                >
                                  {result.difference > 0 ? `+${result.difference}` : result.difference}{" "}
                                  {result.unit || ""}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="p-2.5">
                              <span
                                className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                                  result.severity === "CRITICAL"
                                    ? "bg-red-100 text-red-800"
                                    : result.severity === "MAJOR"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {result.severity}
                              </span>
                            </td>

                            <td className="p-2.5 text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {result.ruleEvidence?.sourceClause || result.ruleCode || "Klausa Standard"}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                M/S {result.ruleEvidence?.sourcePage || 1}
                              </span>
                            </td>

                            <td className="p-2.5">
                              {linkedIssue ? (
                                <span
                                  onClick={() => setActiveIssue(linkedIssue)}
                                  className="cursor-pointer font-semibold text-[10px] text-purple-700 hover:underline"
                                >
                                  {linkedIssue.status} ({linkedIssue.visibility === "APPLICANT_VISIBLE" ? "AWAM" : "DALAMAN"})
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>

                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveResult(result)}
                                  className="h-6 px-1.5 text-[10px]"
                                  title="Lihat Perincian Pengiraan"
                                >
                                  <Calculator className="h-3 w-3 mr-1" />
                                  <span>Bukti</span>
                                </Button>

                                {isOfficer && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAssessingResult(result);
                                      setAssessmentType("AGREE");
                                      setAssessmentReason("");
                                    }}
                                    className="h-6 px-1.5 text-[10px] text-gov-800"
                                    title="Ulasan Pegawai"
                                  >
                                    <SlidersHorizontal className="h-3 w-3" />
                                    <span>Ulas</span>
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

        {/* 5. Result Detail Drawer: ExplainableResult & EvidenceChain */}
        {activeResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Rantai Bukti & Penjelasan Semakan: {activeResult.ruleName}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveResult(null)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
                {/* Visual Evidence Chain */}
                <div className="rounded-sm border border-purple-200 bg-purple-50/50 p-3">
                  <span className="font-bold text-purple-900 block mb-2">Rantai Bukti Keputusan (Evidence Chain):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-center text-[10px]">
                    <div className="rounded-sm bg-white p-2 border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 font-semibold block">1. Fakta Projek/GIS</span>
                      <strong className="text-slate-900 font-mono">{String(activeResult.actualValue)} {activeResult.unit || ""}</strong>
                    </div>
                    <div className="rounded-sm bg-white p-2 border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 font-semibold block">2. Peraturan & Klausa</span>
                      <strong className="text-slate-900">{activeResult.ruleEvidence?.sourceClause || activeResult.ruleCode}</strong>
                    </div>
                    <div className="rounded-sm bg-white p-2 border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 font-semibold block">3. Keperluan Formula</span>
                      <strong className="text-slate-900 font-mono">{String(activeResult.requiredValue)} {activeResult.unit || ""}</strong>
                    </div>
                    <div className="rounded-sm bg-white p-2 border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 font-semibold block">4. Dapatan Enjin</span>
                      <strong className={activeResult.status === "COMPLIANT" ? "text-emerald-700" : "text-red-600"}>{activeResult.status}</strong>
                    </div>
                    <div className="rounded-sm bg-white p-2 border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 font-semibold block">5. Semakan Pegawai</span>
                      <strong className="text-gov-800">{activeResult.requiresOfficerReview ? "Perlu Pengesahan" : "Disahkan"}</strong>
                    </div>
                  </div>
                </div>

                {/* Calculation Trace Steps */}
                {activeResult.calculation && (
                  <div className="rounded-sm border border-slate-200 bg-amber-50/40 p-3 space-y-1.5">
                    <span className="font-bold text-gov-900 block">Langkah Pengiraan Enjin (Calculation Trace):</span>
                    <ul className="list-inside list-disc font-mono text-[11px] text-slate-800 space-y-1">
                      {activeResult.calculation.steps?.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Statutory Guideline Citation */}
                <div className="rounded-sm border border-slate-200 p-3 space-y-1">
                  <span className="font-bold text-slate-800 block">Sumber Autoritatif Garis Panduan:</span>
                  <p className="text-[11px] text-slate-600">
                    Dokumen: <strong>{activeResult.ruleEvidence?.sourceDocumentId || "Rancangan Tempatan Daerah Langkawi 2030"}</strong> (Klausa {activeResult.ruleEvidence?.sourceClause || "-"}, Muka Surat {activeResult.ruleEvidence?.sourcePage || 1})
                  </p>
                  <blockquote className="mt-1 border-l-2 border-gov-700 pl-2 italic text-slate-700 text-[11px]">
                    &ldquo;{activeResult.ruleEvidence?.sourceTextExcerpt || "Pematuhan piawaian perancangan berpandukan RTD Langkawi 2030."}&rdquo;
                  </blockquote>
                </div>

                {/* Input Facts Evidence */}
                {activeResult.inputEvidence && activeResult.inputEvidence.length > 0 && (
                  <div className="rounded-sm border border-slate-200 p-3 space-y-1">
                    <span className="font-bold text-slate-800 block">Data Input Projek & Sumber:</span>
                    <ul className="divide-y divide-slate-100 text-[11px]">
                      {activeResult.inputEvidence.map((ev, i) => (
                        <li key={i} className="py-1 flex justify-between">
                          <span className="font-mono text-slate-600">{ev.key}:</span>
                          <span className="font-bold text-slate-900">
                            {String(ev.value)} ({ev.sourceType})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveResult(null)} className="text-xs">
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Issue Details / Actions Modal */}
        {activeIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">{activeIssue.title}</h3>
                <button
                  onClick={() => setActiveIssue(null)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Keterangan Isu:</span>
                  <p className="font-medium text-slate-800 mt-0.5">{activeIssue.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] rounded-sm bg-slate-50 p-2">
                  <div>
                    <span className="text-slate-500">Status Isu:</span>
                    <strong className="block text-slate-900">{activeIssue.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Kebolehlihatan:</span>
                    <strong className="block text-purple-800">{activeIssue.visibility}</strong>
                  </div>
                </div>

                {/* Officer Actions */}
                {isOfficer && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {activeIssue.visibility === "INTERNAL" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setPublishingIssueId(activeIssue.issueId);
                          setActiveIssue(null);
                        }}
                        className="bg-gov-800 text-xs hover:bg-gov-900"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        <span>Terbitkan Kepada Pemohon</span>
                      </Button>
                    )}

                    {activeIssue.status !== "RESOLVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResolvingIssueId(activeIssue.issueId);
                          setActiveIssue(null);
                        }}
                        className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                      >
                        <FileCheck className="h-3.5 w-3.5 mr-1" />
                        <span>Selesaikan Isu</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. Publish to Applicant Modal */}
        {publishingIssueId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-gov-800">
                <Send className="h-4 w-4" />
                <h3 className="text-sm font-bold">Terbitkan Isu Kepada Pemohon</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <p className="text-slate-600">
                  Isu ini akan dipaparkan dalam portal pemohon sebagai perkara yang memerlukan tindakan / pindaan.
                </p>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Draf Arahan / Ulasan Kepada Pemohon</label>
                  <textarea
                    rows={3}
                    value={publishComment}
                    onChange={(e) => setPublishComment(e.target.value)}
                    placeholder="Contoh: Sila kemukakan pindaan pelan susunatur bagi mencukupi petak TLK..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setPublishingIssueId(null)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePublishIssue}
                    disabled={isPublishing}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isPublishing ? "Menerbitkan..." : "Terbitkan Isu"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Resolve Issue Modal */}
        {resolvingIssueId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-emerald-800">
                <FileCheck className="h-4 w-4" />
                <h3 className="text-sm font-bold">Selesaikan Isu Pematuhan</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Jenis Penyelesaian</label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  >
                    <option value="OFFICER_ACCEPTED_JUSTIFICATION">Pegawai Menerima Justifikasi / Pengecualian</option>
                    <option value="APPLICANT_AMENDED_DOCUMENT">Pemohon Telah Meminda Dokumen</option>
                    <option value="DATA_CORRECTED">Fakta Data Telah Dibetulkan</option>
                    <option value="NOT_APPLICABLE_CONFIRMED">Disahkan Tidak Berkenaan</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Catatan & Asas Penyelesaian <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Nyatakan asas pertimbangan atau rujukan minit..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setResolvingIssueId(null)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResolveIssue}
                    disabled={!resolutionNote.trim() || isResolving}
                    className="bg-emerald-800 text-white text-xs hover:bg-emerald-900"
                  >
                    {isResolving ? "Menyelesaikan..." : "Sahkan Penyelesaian"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. Officer Assessment Modal */}
        {assessingResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-gov-800">
                <SlidersHorizontal className="h-4 w-4" />
                <h3 className="text-sm font-bold">Penilaian & Ulasan Pegawai</h3>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Peraturan:</span>
                  <p className="font-bold text-slate-900">{assessingResult.ruleName}</p>
                </div>

                <div>
                  <span className="text-slate-500">Dapatan Enjin Automatik:</span>
                  <p className="font-mono font-bold text-slate-800">{assessingResult.status}</p>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Penilaian Pegawai</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value as "AGREE" | "DISAGREE")}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  >
                    <option value="AGREE">Bersetuju dengan Dapatan Enjin (AGREE)</option>
                    <option value="DISAGREE">Tidak Bersetuju / Pertimbangan Khas (DISAGREE)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Sebab & Justifikasi Ulasan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={assessmentReason}
                    onChange={(e) => setAssessmentReason(e.target.value)}
                    placeholder="Nyatakan ulasan atau pertimbangan teknikal pegawai..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssessingResult(null)}
                    disabled={isSubmittingAssessment}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitAssessment}
                    disabled={!assessmentReason.trim() || isSubmittingAssessment}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isSubmittingAssessment ? "Menyimpan..." : "Simpan Ulasan"}
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
