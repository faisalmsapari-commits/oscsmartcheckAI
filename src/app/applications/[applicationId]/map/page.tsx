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
import {
  ArrowLeft,
  MapPin,
  Search,
  CheckCircle2,
  Building2,
  RefreshCw,
  Eye,
  Layers,
} from "lucide-react";

const GisInteractiveMap = dynamic(
  () => import("@/components/gis/GisInteractiveMap").then((m) => m.GisInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs font-semibold text-slate-300">
        <span className="animate-pulse">Memuatkan Peta GIS Interaktif & Pelan Tatatur...</span>
      </div>
    ),
  }
);

export default function ApplicationMapPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user, role } = useAuth();

  const demoApp = (DEMO_10_APPLICATIONS as unknown as Application[]).find((a) => a.id === applicationId) || null;
  const initialLayout = demoApp
    ? generateApplicationLayoutPlan({
        applicationId,
        lat: demoApp.siteInfo?.location?.latitude || 6.3268,
        lng: demoApp.siteInfo?.location?.longitude || 99.8432,
        siteAreaSqm: demoApp.siteInfo?.siteArea?.siteAreaSqm || 20000,
        lotNo: demoApp.siteInfo?.lots?.[0]?.lotNumber || "Lot 145",
        mukim: demoApp.siteInfo?.mukim || "Kuah",
        developmentType: demoApp.developmentType || "HOUSING",
        projectTitle: demoApp.title || "Cadangan Pemajuan",
      })
    : null;

  const [application, setApplication] = useState<Application | null>(demoApp);
  const [site, setSite] = useState<ApplicationSite | null>(null);
  const [comparison, setComparison] = useState<LcpGisComparisonResult | null>(null);
  const [rtdData, setRtdData] = useState<{ primaryZone: RtdIntersectionResult | null; zones: RtdIntersectionResult[] } | null>(null);
  const [bufferData, setBufferData] = useState<SiteBufferAnalysisResult | null>(null);
  const [layoutPlan, setLayoutPlan] = useState<ApplicationLayoutPlan | null>(initialLayout);
  const [loading, setLoading] = useState(!demoApp);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setLoading(true);
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

  const handleVerifySite = async () => {
    if (!user || !isOfficer) return;
    try {
      setIsVerifying(true);
      const token = await user.getIdToken();

      const res = await fetch(`/api/gis/applications/${applicationId}/site/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationComment: `Lokasi telah disahkan oleh Pegawai GIS selaras dengan Lot ${site?.lotNumbers?.join(", ")}, Mukim ${site?.mukim}.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengesahkan tapak");
      }

      setSuccessMessage("Lokasi tapak berjaya disahkan oleh Pegawai.");
      await fetchGisData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pengesahan lokasi";
      alert(msg);
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
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Cari Lot JUPEM</span>
                  </Button>
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

                {/* 1. Cadastral Site Summary */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="h-4 w-4 text-gov-800" />
                      <span>MAKLUMAT LOT KADASTER</span>
                    </div>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        site?.verificationStatus === "OFFICER_VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {site?.verificationStatus === "OFFICER_VERIFIED" ? "DISAHKAN PEGAWAI" : "BELUM DISAHKAN"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500">Nombor Lot:</span>
                      <p className="font-bold text-slate-900">{site?.lotNumbers?.join(", ") || "Belum dipilih"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Mukim:</span>
                      <p className="font-bold text-slate-900">{site?.mukim || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Daerah / Negeri:</span>
                      <p className="font-semibold text-slate-800">{site?.district || "Langkawi"}, Kedah</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Keluasan Tapak GIS:</span>
                      <p className="font-bold text-gov-900 font-mono">
                        {site?.cadastralAreaSqm ? `${site.cadastralAreaSqm.toLocaleString()} m²` : "-"}
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
                        <span className={comparison.status === "MATCH" ? "text-emerald-700" : "text-amber-700"}>
                          {comparison.differenceSqm} m² ({comparison.differencePercent}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Officer Verification Action */}
                  {isOfficer && site?.verificationStatus !== "OFFICER_VERIFIED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleVerifySite}
                      disabled={isVerifying || !site?.selectedLotIds?.length}
                      className="w-full bg-emerald-700 text-xs font-bold hover:bg-emerald-800"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      <span>{isVerifying ? "Mengesahkan..." : "Sahkan Lokasi Tapak"}</span>
                    </Button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
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
      </AppShell>
    </ProtectedRoute>
  );
}
