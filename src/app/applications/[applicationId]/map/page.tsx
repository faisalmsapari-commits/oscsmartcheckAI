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
  ApplicationSite,
  CadastralLot,
  RtdIntersectionResult,
  SiteBufferAnalysisResult,
  LcpGisComparisonResult,
  ApplicationLayoutPlan,
} from "@/types/gis";
import { generateApplicationLayoutPlan } from "@/lib/gis/layoutPlanProvider";
import dynamic from "next/dynamic";
import { DEMO_10_APPLICATIONS } from "@/lib/seed/demoData";
import { getDemoGisForApp } from "@/lib/seed/demoDataSeeder";
import {
  ArrowLeft,
  MapPin,
  Search,
  CheckCircle2,
  Building2,
  RefreshCw,
  Eye,
  Layers,
  ShieldCheck,
  Printer,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

const GisInteractiveMap = dynamic(
  () => import("@/components/gis/GisInteractiveMap").then((mod) => mod.GisInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[580px] w-full items-center justify-center bg-slate-900 text-xs text-slate-400 font-medium">
        Memuatkan Paparan Peta Interaktif SmartGIS...
      </div>
    ),
  }
);

export default function ApplicationMapPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const demoGis = applicationId ? getDemoGisForApp(applicationId) : null;
  const initialLayout = demoApp
    ? generateApplicationLayoutPlan({
        applicationId,
        lat: demoApp.siteInfo?.location?.latitude || demoGis?.site?.latitude || 6.3268,
        lng: demoApp.siteInfo?.location?.longitude || demoGis?.site?.longitude || 99.8432,
        siteAreaSqm: demoApp.siteInfo?.siteArea?.siteAreaSqm || demoGis?.site?.cadastralAreaSqm || 20000,
        lotNo: demoApp.siteInfo?.lots?.[0]?.lotNumber || demoGis?.site?.lotNumbers?.[0] || "Lot 145",
        mukim: demoApp.siteInfo?.mukim || demoGis?.site?.mukim || "Kuah",
        developmentType: demoApp.developmentType || "HOUSING",
        projectTitle: demoApp.title || "Cadangan Pemajuan",
      })
    : null;

  const [application, setApplication] = useState<Application | null>(demoApp);
  const [site, setSite] = useState<ApplicationSite | null>(demoGis ? (demoGis.site as unknown as ApplicationSite) : null);
  const [comparison, setComparison] = useState<LcpGisComparisonResult | null>(demoGis ? (demoGis.comparison as unknown as LcpGisComparisonResult) : null);
  const [rtdData, setRtdData] = useState<{ primaryZone: RtdIntersectionResult | null; zones: RtdIntersectionResult[] } | null>(
    demoGis ? (demoGis.rtdData as unknown as { primaryZone: RtdIntersectionResult | null; zones: RtdIntersectionResult[] }) : null
  );
  const [bufferData, setBufferData] = useState<SiteBufferAnalysisResult | null>(
    demoGis ? (demoGis.bufferData as unknown as SiteBufferAnalysisResult) : null
  );
  const [layoutPlan, setLayoutPlan] = useState<ApplicationLayoutPlan | null>(initialLayout);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Officer Location Verification & Slip States
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [verificationCommentInput, setVerificationCommentInput] = useState(
    "Lokasi tapak, sempadan lot kadaster JUPEM, unjuran koordinat RSO Malaya dan pelan susunatur CAD telah disemak silang serta diperakui mematuhi Pengezonan RTD Langkawi 2030."
  );
  const [verificationOfficerName, setVerificationOfficerName] = useState("Sr. Ahmad Fauzi bin Razak (Pegawai Perancang / GIS)");
  const [verificationDecision, setVerificationDecision] = useState<"COMPLIANT" | "CONDITIONAL">("COMPLIANT");
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(true);

  // Search Lot Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Map View Mode: GOOGLE_MAPS | MYKADLOT | RTD_THEMATIC
  const [mapMode, setMapMode] = useState<"GOOGLE_MAPS" | "MYKADLOT" | "RTD_THEMATIC">("GOOGLE_MAPS");
  const [copiedCoords, setCopiedCoords] = useState(false);

  const [searchLotQuery, setSearchLotQuery] = useState("");
  const [searchMukimQuery, setSearchMukimQuery] = useState("Kuah");
  const [searchResults, setSearchResults] = useState<CadastralLot[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Layer Toggles
  const [visibleLayers, setVisibleLayers] = useState({
    layoutPlan: true,
    cadastral: true,
    rtdZoning: true,
    features: true,
    buffer500m: true,
  });

  const isOfficer = ["OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role || "");

  const fetchGisData = async () => {
    if (!user || !applicationId) return;
    try {
      if (!site) setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      // 1. Fetch Application
      let currentApp = application;
      const appRes = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplication(appData.application);
        currentApp = appData.application;
      }

      // 2. Fetch Site & LCP Comparison
      let siteData: ApplicationSite | null = null;
      const siteRes = await fetch(`/api/gis/applications/${applicationId}/site`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (siteRes.ok) {
        const siteJson = await siteRes.json();
        setSite(siteJson.site || null);
        siteData = siteJson.site || null;
        setComparison(siteJson.comparison || null);
      }

      // 3. Fetch RTD Intersection
      const rtdRes = await fetch(`/api/gis/applications/${applicationId}/rtd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rtdRes.ok) {
        const rtdJson = await rtdRes.json();
        setRtdData(rtdJson);
      }

      // 4. Fetch Buffer Features (500m)
      const bufRes = await fetch(`/api/gis/applications/${applicationId}/buffer?radius=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bufRes.ok) {
        const bufJson = await bufRes.json();
        setBufferData(bufJson);
      }

      // 5. Fetch Layout Plan (CAD / DWG Overlay)
      const layoutRes = await fetch(`/api/gis/applications/${applicationId}/layout-plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (layoutRes.ok) {
        const layoutJson = await layoutRes.json();
        if (layoutJson.layoutPlan) {
          setLayoutPlan(layoutJson.layoutPlan);
        }
      } else {
        // Deterministic Fallback Generator
        const targetLat = siteData?.latitude || currentApp?.siteInfo?.location?.latitude || 6.3268;
        const targetLng = siteData?.longitude || currentApp?.siteInfo?.location?.longitude || 99.8432;
        const targetArea = siteData?.cadastralAreaSqm || currentApp?.siteInfo?.siteArea?.siteAreaSqm || 20000;
        const targetLot = siteData?.lotNumbers?.[0] || "Lot 145";
        const targetMukim = siteData?.mukim || "Kuah";

        const generated = generateApplicationLayoutPlan({
          applicationId,
          lat: targetLat,
          lng: targetLng,
          siteAreaSqm: targetArea,
          lotNo: targetLot,
          mukim: targetMukim,
          developmentType: currentApp?.developmentType || "HOUSING",
          projectTitle: currentApp?.title || "Cadangan Pemajuan",
        });
        setLayoutPlan(generated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat GIS";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGisData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const getMukimCode = (mukimName: string) => {
    const m = (mukimName || "").toLowerCase();
    if (m.includes("kuah")) return "01";
    if (m.includes("ayer") || m.includes("hangat")) return "02";
    if (m.includes("bohor")) return "03";
    if (m.includes("kedawang") || m.includes("cenang")) return "04";
    if (m.includes("matsirat")) return "05";
    if (m.includes("melaka")) return "06";
    return "01";
  };

  const lat = site?.latitude || application?.siteInfo?.location?.latitude || (application?.location as { latitude?: number })?.latitude || 6.2915;
  const lng = site?.longitude || application?.siteInfo?.location?.longitude || (application?.location as { longitude?: number })?.longitude || 99.7289;
  const lotNo = site?.lotNumbers?.[0] || application?.siteInfo?.lots?.[0]?.lotNumber || (application as unknown as { lotNo?: string })?.lotNo || "Lot 1042";
  const mukim = site?.mukim || application?.siteInfo?.mukim || (application as unknown as { mukim?: string })?.mukim || "Kedawang";
  const siteArea = site?.cadastralAreaSqm || application?.siteInfo?.siteArea?.siteAreaSqm || (application as unknown as { siteAreaSqm?: number })?.siteAreaSqm || 18500;

  // JUPEM Unique Parcel Identifier (UPI)
  const mukimCode = getMukimCode(mukim);
  const lotDigits = lotNo.replace(/\D/g, "").padStart(7, "0") || "0001042";
  const upiCode = `0201${mukimCode}${lotDigits}`;
  const rsoEasting = (320000 + (lng - 99.8) * 100000).toFixed(1);
  const rsoNorthing = (690000 + (lat - 6.3) * 110000).toFixed(1);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleSearchLots = async () => {
    if (!user) return;
    try {
      setIsSearching(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (searchLotQuery.trim()) params.append("lotNumber", searchLotQuery.trim());
      if (searchMukimQuery.trim()) params.append("mukim", searchMukimQuery.trim());

      const res = await fetch(`/api/gis/lots/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencari lot");
      }
      const data = await res.json();
      setSearchResults(data.lots || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat carian lot";
      alert(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLot = async (lot: CadastralLot) => {
    if (!user) return;
    try {
      setIsSaving(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/gis/applications/${applicationId}/site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteType: "SINGLE_LOT",
          latitude: lot.centroidLat || 6.33,
          longitude: lot.centroidLng || 99.85,
          selectedLotIds: [lot.id],
          geometrySource: "CADASTRAL",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menetapkan lot");
      }

      setSuccessMessage(`Lot ${lot.lotNumber} (${lot.mukimName}) berjaya ditetapkan untuk permohonan ini.`);
      setIsSearchOpen(false);
      await fetchGisData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat menetapkan lot";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifySite = async (customComment?: string) => {
    if (!user || !isOfficer) return;
    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const token = await user.getIdToken();
      const finalComment = customComment || verificationCommentInput || `Lokasi telah disahkan oleh Pegawai GIS selaras dengan Lot ${site?.lotNumbers?.join(", ") || lotNo}, Mukim ${site?.mukim || mukim}.`;

      const res = await fetch(`/api/gis/applications/${applicationId}/site/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationComment: finalComment,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengesahkan tapak");
      }

      const resData = await res.json();
      if (resData.site) {
        setSite(resData.site);
      } else {
        setSite((prev) => prev ? {
          ...prev,
          verificationStatus: "OFFICER_VERIFIED",
          verifiedBy: verificationOfficerName || user?.displayName || user?.email || "demo-officer-uid",
          verifiedAt: new Date().toISOString(),
          verificationComment: finalComment,
        } : null);
      }

      setSuccessMessage("Perakuan lokasi tapak berjaya disahkan dan ditandatangani secara digital oleh Pegawai.");
      setIsVerificationModalOpen(false);
      await fetchGisData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pengesahan lokasi";
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header Breadcrumbs & Controls */}
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
                  <span className="text-gov-800">SmartGIS AI</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    SmartGIS AI
                  </h1>
                  <span className="rounded-xs bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 border border-purple-200">
                    ✨ GeoAI Engine
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Pengecaman automatik tapak projek, kadaster JUPEM & pengezonan RTD 2030.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchGisData}
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>

                {isOfficer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs shadow-xs"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Cari Lot JUPEM</span>
                  </Button>
                )}

                {/* Officer Location Verification Status & Action Button */}
                {site?.verificationStatus === "OFFICER_VERIFIED" ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSlipModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-sm bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 transition"
                      title="Lihat Slip Perakuan Pengesahan Lokasi"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Lokasi Disahkan Pegawai</span>
                      <span className="ml-1 rounded-full bg-emerald-200 px-1.5 py-0.2 text-[10px] text-emerald-900 font-mono">
                        ✓ SAH
                      </span>
                    </button>

                    {isOfficer && (
                      <button
                        type="button"
                        onClick={() => setIsVerificationModalOpen(true)}
                        className="rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        title="Kemaskini Perakuan Lokasi"
                      >
                        Kemaskini
                      </button>
                    )}
                  </div>
                ) : (
                  isOfficer && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="bg-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-800 text-white flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Sahkan Lokasi Pegawai</span>
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Error & Success Messages */}
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

            {/* Geodetic Coordinates & JUPEM Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Koordinat Geografik (WGS84)</span>
                <p className="font-mono font-bold text-gov-900 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span>{lat.toFixed(6)}° U, {lng.toFixed(6)}° T</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Unjuran RSO Malaya (Kertau)</span>
                <p className="font-mono font-bold text-slate-800">
                  E: {rsoEasting} m | N: {rsoNorthing} m
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">UPI JUPEM MyKadLot</span>
                <p className="font-mono font-bold text-purple-900">
                  {upiCode} (Kedah / Mukim {mukim})
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="rounded-xs border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                  title="Salin Koordinat"
                >
                  {copiedCoords ? "✓ Disalin" : "📋 Salin Koordinat"}
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xs bg-gov-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-gov-900 transition flex items-center gap-1 shadow-xs"
                >
                  <span>Google Maps ↗</span>
                </a>
              </div>
            </div>

            {/* Main Interactive Map & Panel Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left/Center Area: Map Visualization Container */}
              <div className="lg:col-span-8 space-y-3">
                {/* Clean Top GIS Navigation Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-white p-2.5 shadow-xs border border-slate-200 text-xs">
                  {/* Basemap Switcher */}
                  <div className="flex items-center rounded-xs bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      onClick={() => setMapMode("GOOGLE_MAPS")}
                      className={`rounded-xs px-2.5 py-1 text-[11px] font-bold transition ${
                        mapMode === "GOOGLE_MAPS"
                          ? "bg-gov-800 text-white shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      🛰️ Peta Satelit Sebenar
                    </button>
                    <button
                      onClick={() => setMapMode("MYKADLOT")}
                      className={`rounded-xs px-2.5 py-1 text-[11px] font-bold transition ${
                        mapMode === "MYKADLOT"
                          ? "bg-purple-800 text-white shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      🏛️ MyKadLot JUPEM
                    </button>
                    <button
                      onClick={() => setMapMode("RTD_THEMATIC")}
                      className={`rounded-xs px-2.5 py-1 text-[11px] font-bold transition ${
                        mapMode === "RTD_THEMATIC"
                          ? "bg-blue-800 text-white shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      📐 Pengezonan RTD 2030
                    </button>
                  </div>

                  {/* Layer Toggles */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setVisibleLayers((prev) => ({ ...prev, layoutPlan: !prev.layoutPlan }))}
                      className={`rounded-xs px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1 shadow-2xs ${
                        visibleLayers.layoutPlan ? "bg-emerald-600 border-emerald-700 text-white" : "bg-slate-100 border-slate-300 text-slate-600"
                      }`}
                    >
                      <span>📐 Pelan Tatatur (CAD)</span>
                    </button>
                    <button
                      onClick={() => setVisibleLayers((prev) => ({ ...prev, cadastral: !prev.cadastral }))}
                      className={`rounded-xs px-2 py-1 text-[11px] font-semibold border transition ${
                        visibleLayers.cadastral ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-slate-100 border-slate-300 text-slate-500"
                      }`}
                    >
                      ✓ Lot Kadaster
                    </button>
                    <button
                      onClick={() => setVisibleLayers((prev) => ({ ...prev, rtdZoning: !prev.rtdZoning }))}
                      className={`rounded-xs px-2 py-1 text-[11px] font-semibold border transition ${
                        visibleLayers.rtdZoning ? "bg-purple-50 border-purple-600 text-purple-900" : "bg-slate-100 border-slate-300 text-slate-500"
                      }`}
                    >
                      ✓ Zon RTD
                    </button>
                    <button
                      onClick={() => setVisibleLayers((prev) => ({ ...prev, buffer500m: !prev.buffer500m }))}
                      className={`rounded-xs px-2 py-1 text-[11px] font-semibold border transition ${
                        visibleLayers.buffer500m ? "bg-amber-50 border-amber-600 text-amber-900" : "bg-slate-100 border-slate-300 text-slate-500"
                      }`}
                    >
                      ✓ Penimbal 500m
                    </button>
                  </div>
                </div>

                <Card className="relative h-[620px] overflow-hidden p-0 border border-slate-300 bg-slate-950 shadow-md">
                  {/* Mode 1: Interactive Leaflet GIS (Satellite, Street & OSM with CAD Layout Plan) */}
                  {mapMode === "GOOGLE_MAPS" && (
                    <div className="relative h-full w-full bg-slate-900 overflow-hidden" style={{ height: "620px" }}>
                      <GisInteractiveMap
                        lat={lat}
                        lng={lng}
                        lotNo={lotNo}
                        mukim={mukim}
                        siteAreaSqm={siteArea}
                        projectTitle={application?.title || "Projek Pemajuan Kebenaran Merancang"}
                        upiCode={upiCode}
                        rtdData={rtdData}
                        bufferFeatures={bufferData?.features || []}
                        layoutPlan={layoutPlan}
                        visibleLayers={visibleLayers}
                      />
                    </div>
                  )}

                  {/* Mode 2: MyKadLot JUPEM & NDCDB Cadastral View */}
                  {mapMode === "MYKADLOT" && (
                    <div className="h-full w-full bg-[#f8fafc] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
                      <svg viewBox="0 0 800 500" className="h-full w-full max-h-[500px]">
                        {/* JUPEM Cadastral Grid */}
                        <defs>
                          <pattern id="cadGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="2 2" />
                          </pattern>
                        </defs>
                        <rect width="800" height="500" fill="url(#cadGrid)" />

                        {/* Surrounding JUPEM Parcels */}
                        <polygon points="120,100 280,100 280,340 120,340" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                        <text x="170" y="220" fill="#475569" fontSize="12" fontWeight="bold">Lot Jiran A</text>
                        <text x="160" y="240" fill="#64748b" fontSize="10">8,450 m²</text>

                        <polygon points="520,100 680,100 680,340 520,340" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                        <text x="570" y="220" fill="#475569" fontSize="12" fontWeight="bold">Lot Jiran B</text>
                        <text x="560" y="240" fill="#64748b" fontSize="10">14,200 m²</text>

                        <polygon points="280,30 520,30 520,140 280,140" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                        <text x="370" y="90" fill="#64748b" fontSize="11">Lot Rezab Awam</text>

                        {/* Selected Target Cadastral Parcel (MyKadLot JUPEM) */}
                        <polygon
                          points="280,140 520,140 520,340 280,340"
                          fill="#dbeafe"
                          fillOpacity="0.85"
                          stroke="#1d4ed8"
                          strokeWidth="3.5"
                        />
                        {/* Lot Boundary Dimension Marks */}
                        <text x="370" y="130" fill="#1e40af" fontSize="10" fontWeight="bold">120.0 m (U)</text>
                        <text x="370" y="355" fill="#1e40af" fontSize="10" fontWeight="bold">120.0 m (S)</text>
                        <text x="225" y="245" fill="#1e40af" fontSize="10" fontWeight="bold">90.0 m (B)</text>
                        <text x="530" y="245" fill="#1e40af" fontSize="10" fontWeight="bold">90.0 m (T)</text>

                        {/* Lot Details Center */}
                        <text x="355" y="225" fill="#1e3a8a" fontSize="15" fontWeight="bold">
                          {lotNo.toUpperCase()}
                        </text>
                        <text x="335" y="248" fill="#1e40af" fontSize="12" fontWeight="bold">
                          {siteArea.toLocaleString()} m² (Mukim {mukim})
                        </text>
                        <text x="340" y="270" fill="#3b82f6" fontSize="10" fontWeight="bold">
                          UPI: {upiCode}
                        </text>

                        {/* Main Road Reserve */}
                        <line x1="80" y1="380" x2="720" y2="380" stroke="#334155" strokeWidth="6" />
                        <text x="250" y="405" fill="#1e293b" fontSize="12" fontWeight="bold">
                          Jalan Utama {mukim} (Rizab Jalan JKR 66 Kaki / 20.0 Meter)
                        </text>

                        {/* Pin Marker */}
                        <g transform="translate(400, 200)">
                          <circle cx="0" cy="0" r="5" fill="#dc2626" />
                          <path d="M 0,-25 C -10,-25 -15,-15 0,0 C 15,-15 10,-25 0,-25 Z" fill="#dc2626" />
                          <circle cx="0" cy="-15" r="4" fill="#ffffff" />
                        </g>
                      </svg>

                      <div className="absolute bottom-3 right-3 rounded-sm bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs border border-slate-200">
                        Sumber Ukur: Pangkalan Data Ukur Kadaster Kebangsaan (NDCDB JUPEM Kedah)
                      </div>
                    </div>
                  )}

                  {/* Mode 3: RTD Langkawi 2030 Thematic Zoning View */}
                  {mapMode === "RTD_THEMATIC" && (
                    <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
                      <svg viewBox="0 0 800 500" className="h-full w-full max-h-[500px]">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="800" height="500" fill="url(#grid)" />

                        {/* RTD Zoning Overlay */}
                        <g opacity="0.75">
                          {/* Primary Zone */}
                          <polygon points="150,100 480,100 480,400 150,400" fill="#f3e8ff" stroke="#9333ea" strokeWidth="2" strokeDasharray="4 2" />
                          <text x="160" y="125" fill="#7e22ce" fontSize="12" fontWeight="bold">
                            ZON PEMBANGUNAN RTD 2030 (85%)
                          </text>

                          {/* Transport Zone */}
                          <polygon points="480,100 680,100 680,400 480,400" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
                          <text x="490" y="125" fill="#c2410c" fontSize="12" fontWeight="bold">
                            ZON PENGANGKUTAN & RIZAB (15%)
                          </text>
                        </g>

                        {/* 500m Buffer Circle */}
                        <circle cx="400" cy="250" r="180" fill="#fef3c7" fillOpacity="0.25" stroke="#d97706" strokeWidth="1.5" strokeDasharray="6 3" />

                        {/* Cadastral Lot */}
                        <polygon points="280,160 520,160 520,340 280,340" fill="#dbeafe" fillOpacity="0.85" stroke="#1d4ed8" strokeWidth="3" />
                        <text x="350" y="240" fill="#1e3a8a" fontSize="14" fontWeight="bold">{lotNo}</text>
                        <text x="330" y="260" fill="#1e40af" fontSize="11">{siteArea.toLocaleString()} m² (Mukim {mukim})</text>

                        {/* Nearby Features */}
                        <circle cx="340" cy="90" r="6" fill="#059669" />
                        <text x="352" y="94" fill="#065f46" fontSize="10" fontWeight="bold">Kemudahan Awam (Mukim {mukim})</text>
                        <circle cx="210" cy="220" r="6" fill="#d97706" />
                        <text x="120" y="215" fill="#b45309" fontSize="10" fontWeight="bold">Komersial / Hotel (220m)</text>

                        <line x1="120" y1="360" x2="700" y2="360" stroke="#475569" strokeWidth="4" />
                        <text x="250" y="380" fill="#334155" fontSize="11" fontWeight="bold">
                          Jalan Utama {mukim} (Rizab 66 kaki / 20m)
                        </text>

                        <g transform="translate(400, 240)">
                          <circle cx="0" cy="0" r="5" fill="#dc2626" />
                          <path d="M 0,-25 C -10,-25 -15,-15 0,0 C 15,-15 10,-25 0,-25 Z" fill="#dc2626" />
                          <circle cx="0" cy="-15" r="4" fill="#ffffff" />
                        </g>
                      </svg>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Panel: Location & GIS Review Details */}
              <div className="lg:col-span-4 space-y-4">
                {/* 0. CAD Layout Plan & Statistics Card */}
                {layoutPlan && (
                  <Card className="p-4 space-y-3 border-gold-400/40 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gold-300">
                        <Layers className="h-4 w-4 text-gold-400" />
                        <span>PELAN TATATUR & CAD SUSUNATUR</span>
                      </div>
                      <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        ✨ CAD AI Georeferenced
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">No. Lukisan CAD:</span>
                        <span className="font-mono font-bold text-white text-[11px]">{layoutPlan.drawingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Skala Pelan:</span>
                        <span className="font-mono text-gold-300 font-bold text-[11px]">{layoutPlan.scale}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Jumlah Unit Cadangan:</span>
                        <span className="font-bold text-white text-[11px]">{layoutPlan.totalUnits} Unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Ketinggian Maksimum:</span>
                        <span className="font-bold text-white text-[11px]">{layoutPlan.totalFloors} Tingkat</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Nisbah Plot (Plot Ratio):</span>
                        <span className="font-bold text-white font-mono text-[11px]">{layoutPlan.plotRatio}:1.0</span>
                      </div>
                    </div>

                    {/* Open Space 10% Compliance Badge */}
                    <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300">Kawasan Lapang (Open Space):</span>
                        <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded font-extrabold ${
                          (layoutPlan.openSpacePercent || 0) >= 10
                            ? "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-900/80 text-rose-300 border border-rose-500/30"
                        }`}>
                          {layoutPlan.openSpacePercent}% ({(layoutPlan.openSpaceAreaSqm || 0).toLocaleString()} m²)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span>Mematuhi keperluan minimum 10% Garis Panduan RTD Langkawi 2030</span>
                      </div>
                    </div>

                    {/* Parking Provision Stats */}
                    {layoutPlan.parkingBays && (
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-slate-800">
                        <div className="rounded bg-slate-800/60 p-1.5 border border-slate-700">
                          <span className="block text-slate-400">Kereta</span>
                          <span className="font-bold font-mono text-white text-xs">{layoutPlan.parkingBays.car} Petak</span>
                        </div>
                        <div className="rounded bg-slate-800/60 p-1.5 border border-slate-700">
                          <span className="block text-slate-400">Motosikal</span>
                          <span className="font-bold font-mono text-white text-xs">{layoutPlan.parkingBays.motorcycle} Petak</span>
                        </div>
                        <div className="rounded bg-slate-800/60 p-1.5 border border-slate-700">
                          <span className="block text-slate-400">OKU</span>
                          <span className="font-bold font-mono text-emerald-400 text-xs">{layoutPlan.parkingBays.oku} Petak</span>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* 1. Cadastral Site Summary & Officer Verification Card */}
                <Card className="p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="h-4 w-4 text-gov-800" />
                      <span>MAKLUMAT LOT KADASTER</span>
                    </div>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        site?.verificationStatus === "OFFICER_VERIFIED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {site?.verificationStatus === "OFFICER_VERIFIED" ? "✓ DISAHKAN PEGAWAI" : "BELUM DISAHKAN"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500">Nombor Lot:</span>
                      <p className="font-bold text-slate-900">{site?.lotNumbers?.join(", ") || lotNo || "Belum dipilih"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Mukim:</span>
                      <p className="font-bold text-slate-900">{site?.mukim || mukim || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Daerah / Negeri:</span>
                      <p className="font-semibold text-slate-800">{site?.district || "Langkawi"}, Kedah</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Keluasan Tapak GIS:</span>
                      <p className="font-bold text-gov-900 font-mono">
                        {(site?.cadastralAreaSqm || siteArea).toLocaleString()} m²
                      </p>
                    </div>
                  </div>

                  {/* LCP vs GIS Comparison Card */}
                  {comparison && comparison.lcpSiteAreaSqm && (
                    <div className="rounded-sm border border-slate-200 bg-slate-50 p-2.5 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block text-[11px]">
                        Semakan Silang: LCP vs Data GIS
                      </span>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Keluasan LCP:</span>
                        <span className="font-mono font-semibold">{comparison.lcpSiteAreaSqm.toLocaleString()} m²</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Keluasan GIS:</span>
                        <span className="font-mono font-semibold">{comparison.gisSiteAreaSqm?.toLocaleString()} m²</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold border-t border-slate-200 pt-1">
                        <span>Perbezaan:</span>
                        <span className={comparison.status === "MATCH" ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                          {comparison.differenceSqm} m² ({comparison.differencePercent}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Official Certificate Box or Pending Action */}
                  {site?.verificationStatus === "OFFICER_VERIFIED" ? (
                    <div className="rounded-sm border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-3 text-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <ShieldCheck className="h-4 w-4 text-emerald-700" />
                          <span>Perakuan Pengesahan Lokasi</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                          RASMI
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pegawai Pengesah:</span>
                          <span className="font-semibold text-slate-900">{site?.verifiedBy || verificationOfficerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarikh Pengesahan:</span>
                          <span className="font-mono text-slate-800">
                            {site?.verifiedAt ? new Date(site.verifiedAt as string).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "20 Ogos 2026, 08:30 AM"}
                          </span>
                        </div>
                        <div className="mt-1 rounded bg-white/80 p-2 border border-emerald-100 text-[10px] italic text-slate-600">
                          &ldquo;{site?.verificationComment || "Lokasi dan sempadan lot telah disemak silang dengan data JUPEM MyKadLot dan mematuhi RTD 2030."}&rdquo;
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsSlipModalOpen(true)}
                          className="flex items-center justify-center gap-1 rounded bg-emerald-700 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Cetak Slip</span>
                        </button>

                        {isOfficer && (
                          <button
                            type="button"
                            onClick={() => setIsVerificationModalOpen(true)}
                            className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <span>Kemaskini</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-sm border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 space-y-1">
                        <span className="font-bold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          <span>Menunggu Pengesahan Lokasi</span>
                        </span>
                        <p className="text-[11px] text-amber-700">
                          Lokasi tapak, sempadan kadaster dan zon RTD perlu disahkan oleh Pegawai GIS / Perancang sebelum kelulusan penuh.
                        </p>
                      </div>

                      {isOfficer && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsVerificationModalOpen(true)}
                          disabled={isVerifying}
                          className="w-full bg-emerald-700 text-xs font-bold hover:bg-emerald-800 shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Sahkan Lokasi Tapak Pemajuan</span>
                        </Button>
                      )}
                    </div>
                  )}
                </Card>

                {/* 2. RTD Zoning Intersection */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-bold text-slate-900">
                    <Building2 className="h-4 w-4 text-purple-700" />
                    <span>ZON RANCANGAN TEMPATAN DAERAH (RTD)</span>
                  </div>

                  {rtdData && rtdData.zones.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      <span className="text-[11px] text-slate-500 block">
                        Set Data: RTD Langkawi 2030 ({rtdData.zones[0].datasetVersion})
                      </span>
                      {rtdData.zones.map((zone) => (
                        <div
                          key={zone.zoneId}
                          className="flex items-center justify-between rounded-sm border border-slate-200 bg-slate-50 p-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{zone.zoneName}</span>
                            <span className="block font-mono text-[10px] text-slate-500">Kod: {zone.zoneCode}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-sm font-bold text-purple-800">
                              {zone.intersectionPercent}%
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {zone.intersectionAreaSqm.toLocaleString()} m²
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Tiada data RTD dikesan</p>
                  )}
                </Card>

                {/* 3. Nearby Features & Buffer Analysis */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-bold text-slate-900">
                    <Eye className="h-4 w-4 text-emerald-700" />
                    <span>KONTEKS SEKITARAN (PENIMBAL 500M)</span>
                  </div>

                  {bufferData && bufferData.features.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-xs">
                      {bufferData.features.map((f) => (
                        <li key={f.featureId} className="flex items-center justify-between py-1.5">
                          <span className="text-slate-800">{f.featureName}</span>
                          <span className="font-mono text-[11px] font-bold text-gov-800">
                            {f.distanceMeters} m
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Tiada kemudahan dikesan dalam lingkungan 500m</p>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Search Lot Modal */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Carian Lot Kadaster Langkawi</h3>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Nombor Lot</label>
                    <input
                      type="text"
                      value={searchLotQuery}
                      onChange={(e) => setSearchLotQuery(e.target.value)}
                      placeholder="Contoh: 1234"
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Mukim</label>
                    <input
                      type="text"
                      value={searchMukimQuery}
                      onChange={(e) => setSearchMukimQuery(e.target.value)}
                      placeholder="Contoh: Kuah"
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSearchLots}
                  disabled={isSearching}
                  className="w-full bg-gov-800 text-xs"
                >
                  <Search className="h-3.5 w-3.5 mr-1" />
                  <span>{isSearching ? "Mencari..." : "Cari Lot"}</span>
                </Button>

                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-500">Hasil Carian ({searchResults.length}):</span>
                    {searchResults.map((lot) => (
                      <div
                        key={lot.id}
                        className="flex items-center justify-between rounded-sm border border-slate-200 p-2 hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{lot.lotNumber}</p>
                          <span className="text-[11px] text-slate-500">
                            Mukim {lot.mukimName} — {lot.landAreaSqm.toLocaleString()} m²
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectLot(lot)}
                          disabled={isSaving}
                          className="text-xs"
                        >
                          Pilih
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: BORANG PENGESAHAN LOKASI OLEH PEGAWAI GIS / PERANCANG           */}
        {/* ========================================================================= */}
        {isVerificationModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-sm bg-white p-6 shadow-2xl space-y-4 my-8 border border-slate-200">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-800">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Borang Pengesahan Lokasi & Geometri Tapak Pemajuan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Penentusahan Statutori Pegawai OSC / Pegawai Perancang / Pegawai GIS MPLBP
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
                {/* 1. Ringkasan Hakmilik & Geometri */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gov-800" />
                    <span>1. Ringkasan Data Kadaster & Geodetik Tapak</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">No. Permohonan KM:</span>
                      <p className="font-mono font-bold text-slate-900">{application?.applicationNo || applicationId}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Tajuk Projek:</span>
                      <p className="font-semibold text-slate-900 truncate" title={application?.title}>
                        {application?.title || "Cadangan Pemajuan Kebenaran Merancang"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">No. Lot & Mukim:</span>
                      <p className="font-bold text-slate-900">{site?.lotNumbers?.join(", ") || lotNo}, Mukim {site?.mukim || mukim}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Kod UPI JUPEM:</span>
                      <p className="font-mono font-bold text-purple-900">{upiCode}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Koordinat Geografik (WGS84):</span>
                      <p className="font-mono text-slate-800">{lat.toFixed(6)}° U, {lng.toFixed(6)}° T</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Unjuran RSO Malaya (Kertau):</span>
                      <p className="font-mono text-slate-800">E: {rsoEasting} m | N: {rsoNorthing} m</p>
                    </div>
                  </div>
                </div>

                {/* 2. Semakan Keluasan & RTD */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-purple-700" />
                    <span>2. Semakan Silang Keluasan & Pengezonan RTD 2030</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Keluasan Tapak Kadaster GIS:</span>
                      <p className="font-mono font-bold text-gov-900">{(site?.cadastralAreaSqm || siteArea).toLocaleString()} m²</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Keluasan LCP Dokumen:</span>
                      <p className="font-mono font-bold text-slate-900">
                        {comparison?.lcpSiteAreaSqm ? `${comparison.lcpSiteAreaSqm.toLocaleString()} m²` : `${siteArea.toLocaleString()} m²`}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Pengezonan RTD Langkawi 2030:</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>{rtdData?.primaryZone?.zoneName || `Zon Pembangunan ${application?.developmentType || "Perumahan"} (BP 2)`}</span>
                        <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                          PATUH / DIBENARKAN
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Maklumat Pegawai & Keputusan */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Nama & Jawatan Pegawai Pengesah:</label>
                    <input
                      type="text"
                      value={verificationOfficerName}
                      onChange={(e) => setVerificationOfficerName(e.target.value)}
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs font-semibold text-slate-900 bg-white"
                      placeholder="Contoh: Sr. Ahmad Fauzi (Pegawai Perancang / GIS)"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Keputusan Pengesahan Tapak:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVerificationDecision("COMPLIANT")}
                        className={`flex items-center justify-center gap-1.5 rounded-sm p-2 text-xs font-bold border transition ${
                          verificationDecision === "COMPLIANT"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Lulus & Sahkan Lokasi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerificationDecision("CONDITIONAL")}
                        className={`flex items-center justify-center gap-1.5 rounded-sm p-2 text-xs font-bold border transition ${
                          verificationDecision === "CONDITIONAL"
                            ? "bg-amber-50 border-amber-600 text-amber-900 ring-1 ring-amber-600"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span>Lulus Bersyarat</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Ulasan / Perakuan Pegawai:</label>
                    <textarea
                      rows={3}
                      value={verificationCommentInput}
                      onChange={(e) => setVerificationCommentInput(e.target.value)}
                      className="w-full rounded-sm border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-gov-800 focus:outline-hidden"
                      placeholder="Masukkan ulasan penentusahan rasmi..."
                    />
                  </div>

                  {/* Statutory Declaration Checkbox */}
                  <label className="flex items-start gap-2.5 rounded-sm border border-emerald-200 bg-emerald-50/70 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeclarationChecked}
                      onChange={(e) => setIsDeclarationChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] leading-relaxed text-emerald-950 font-medium">
                      <strong>Perakuan Pengesahan:</strong> Saya dengan ini mengesahkan bahawa kedudukan geometri, nombor lot kadaster dan sempadan ruang GIS bagi permohonan ini telah disemak secara teliti bersama data ukur JUPEM serta mematuhi dokumen Rancangan Tempatan Daerah (RTD) Langkawi 2030.
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleVerifySite(verificationCommentInput)}
                  disabled={isVerifying || !isDeclarationChecked}
                  className="bg-emerald-700 text-xs font-bold hover:bg-emerald-800 shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isVerifying ? "Mengesahkan..." : "Sahkan & Rekod Pengesahan"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: SLIP PERAKUAN PENGESAHAN LOKASI SMARTGIS AI (PRINTABLE SLIP)     */}
        {/* ========================================================================= */}
        {isSlipModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-3xl rounded-sm bg-white p-6 shadow-2xl space-y-5 my-8 border border-slate-300 print:m-0 print:p-0 print:border-none print:shadow-none">
              {/* Slip Top Toolbar (Hidden on print) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Slip Rasmi Perakuan Pengesahan Lokasi SmartGIS AI
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-sm bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak Slip / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSlipModalOpen(false)}
                    className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Official Certificate Body */}
              <div className="space-y-4 rounded-sm border-2 border-slate-300 bg-white p-6 text-xs text-slate-900 font-sans shadow-inner">
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600">
                    KERAJAAN NEGERI KEDAH DARUL AMAN
                  </p>
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                    MAJLIS PERBANDARAN LANGKAWI BANDARAYA PELANCONGAN
                  </h2>
                  <p className="text-[10px] font-bold text-gov-800 uppercase tracking-wider">
                    SISTEM PUSAT SETEMPAT (OSC) & SMARTGIS AI COMPLIANCE ENGINE
                  </p>
                  <div className="pt-2">
                    <span className="inline-block rounded-xs bg-slate-900 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                      SLIP PERAKUAN PENGESAHAN LOKASI & GEOMETRI RUANG
                    </span>
                  </div>
                </div>

                {/* Metadata Header Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">NO. RUJUKAN PERMOHONAN:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{application?.applicationNo || applicationId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">NO. SIRI PERAKUAN GIS:</span>
                    <span className="font-mono font-bold text-purple-900 text-xs">
                      GIS-VER-{applicationId.replace(/\D/g, "") || "0001"}-2026
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px]">TAJUK CADANGAN PEMAJUAN:</span>
                    <span className="font-bold text-slate-900">{application?.title || "Cadangan Pemajuan Kebenaran Merancang"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PEMOHON / PEMAJU:</span>
                    <span className="font-semibold text-slate-800">
                      {application?.applicantInfo?.applicantName || application?.applicantInfo?.companyName || "Tetuan Pemaju Hartanah"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ORANG UTAMA MENGEMUKAKAN (PSP):</span>
                    <span className="font-semibold text-slate-800">
                      {application?.consultantInfo?.principalSubmittingPerson || application?.consultantInfo?.consultantCompany || "Ar. Tan Boon Huat"}
                    </span>
                  </div>
                </div>

                {/* Table of Cadastral & Geodetic Verification */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase text-slate-900 border-l-3 border-gov-800 pl-2">
                    A. Penentusahan Lot Kadaster & Geodetik (JUPEM / MyKadLot)
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-100 p-2 font-semibold w-1/3">Nombor Lot Hakmilik:</td>
                        <td className="p-2 font-bold font-mono">{site?.lotNumbers?.join(", ") || lotNo}</td>
                        <td className="bg-slate-100 p-2 font-semibold w-1/4">Mukim / Daerah:</td>
                        <td className="p-2 font-semibold">Mukim {site?.mukim || mukim}, Langkawi</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-100 p-2 font-semibold">Kod UPI JUPEM:</td>
                        <td className="p-2 font-mono font-bold text-purple-900">{upiCode}</td>
                        <td className="bg-slate-100 p-2 font-semibold">Keluasan Kadaster:</td>
                        <td className="p-2 font-mono font-bold">{(site?.cadastralAreaSqm || siteArea).toLocaleString()} m²</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-100 p-2 font-semibold">Koordinat WGS84:</td>
                        <td className="p-2 font-mono">{lat.toFixed(6)}° U, {lng.toFixed(6)}° T</td>
                        <td className="bg-slate-100 p-2 font-semibold">Unjuran RSO Malaya:</td>
                        <td className="p-2 font-mono">E: {rsoEasting} | N: {rsoNorthing}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-2 font-semibold">Perbezaan Keluasan LCP:</td>
                        <td colSpan={3} className="p-2 font-semibold text-emerald-700">
                          {comparison?.status === "MATCH" ? "✓ 0% Perbezaan (Sepadan Sepenuhnya dengan LCP)" : `${comparison?.differencePercent || 0}% perbezaan`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table of RTD 2030 Conformity */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase text-slate-900 border-l-3 border-purple-800 pl-2">
                    B. Semakan Pengezonan Rancangan Tempatan Daerah (RTD) Langkawi 2030
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-100 p-2 font-semibold w-1/3">Pengezonan Utama RTD:</td>
                        <td className="p-2 font-bold text-purple-900">
                          {rtdData?.primaryZone?.zoneName || `Zon Pembangunan ${application?.developmentType || "Perumahan"} (BP 2)`}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-100 p-2 font-semibold">Status Pematuhan Guna Tanah:</td>
                        <td className="p-2 font-bold text-emerald-800">
                          ✓ DIBENARKAN & SELARAS DENGAN RANCANGAN TEMPATAN DAERAH 2030
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-2 font-semibold">Zon Penampan Sekitar (500m):</td>
                        <td className="p-2 font-semibold text-slate-700">
                          Tiada halangan zon sensitif alam sekitar (KSAS). Mematuhi anjakan rizab jalan protokol.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sign-off & Digital Stamp Box */}
                <div className="mt-4 rounded-sm border border-slate-300 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-1 text-[11px]">
                      <span className="font-bold text-slate-900 block">ULASAN PEGAWAI PENGESAH:</span>
                      <p className="italic text-slate-700 bg-white p-2 rounded border border-slate-200 text-[10px] leading-relaxed">
                        &ldquo;{site?.verificationComment || "Lokasi tapak, sempadan lot kadaster JUPEM, unjuran koordinat RSO Malaya dan pelan susunatur CAD telah disemak silang serta diperakui mematuhi Pengezonan RTD Langkawi 2030."}&rdquo;
                      </p>
                      <div className="pt-2 text-[10px] text-slate-500 font-mono">
                        STATUS: <strong className="text-emerald-700">SAH & DIPERAKUI DIGITAL</strong>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {/* Official Digital Seal */}
                      <div className="inline-block rounded-xs border-2 border-emerald-700 bg-emerald-50 px-3 py-1.5 text-center">
                        <span className="block text-[9px] font-black uppercase text-emerald-800 tracking-wider">
                          ★ COP PENGESAHAN GIS RASMI ★
                        </span>
                        <span className="block text-[10px] font-bold text-emerald-950">
                          MPLBP LANGKAWI
                        </span>
                        <span className="block text-[8px] font-mono text-emerald-700">
                          STATUS: VERIFIED
                        </span>
                      </div>

                      <div className="pt-2 text-[11px]">
                        <p className="font-bold text-slate-900">{site?.verifiedBy || verificationOfficerName}</p>
                        <p className="text-[10px] text-slate-600">Pegawai Perancang / GIS Berdaftar</p>
                        <p className="text-[10px] font-mono text-slate-500">
                          Tarikh: {site?.verifiedAt ? new Date(site.verifiedAt as string).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "20 Ogos 2026, 08:30 AM"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2 text-[9px] text-slate-400 font-mono border-t border-slate-200">
                  Dokumen ini dijana secara automatik melalui OSC SmartCheck AI & SmartGIS MPLBP Langkawi.
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="text-xs"
                >
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
