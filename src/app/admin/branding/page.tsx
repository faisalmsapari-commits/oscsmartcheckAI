"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useBranding } from "@/lib/branding/BrandingContext";
import { AgencyLogo } from "@/components/ui/AgencyLogo";
import {
  AgencyBrandingConfig,
  AgencyEmblemPreset,
  DEFAULT_AGENCY_BRANDING,
} from "@/types/branding";
import {
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  RotateCcw,
  Landmark,
  Compass,
  MapPin,
  Shield,
  Palette,
  Phone,
} from "lucide-react";

export default function AgencyBrandingCmsPage() {
  const { branding, updateBranding, resetToDefault } = useBranding();

  const [formState, setFormState] = useState<AgencyBrandingConfig>(branding);
  const [activeTab, setActiveTab] = useState<"LOGO" | "AGENCY" | "PORTAL" | "CONTACT">("LOGO");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormState(branding);
  }, [branding]);

  const handleFieldChange = (fields: Partial<AgencyBrandingConfig>) => {
    setFormState((prev) => ({ ...prev, ...fields }));
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Sila muat naik fail imej yang sah (PNG, JPG, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Saiz imej logo tidak boleh melebihi 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleFieldChange({
          agencyLogoType: "CUSTOM_UPLOAD",
          agencyLogoUrl: base64,
        });
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateBranding(formState);
      // Sync to backend API
      await fetch("/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      }).catch(() => {});

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat menyimpan konfigurasi";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Adakah anda pasti ingin menetapkan semula semua identiti visual dan teks ke lalai MPLBP?")) {
      await resetToDefault();
      setFormState(DEFAULT_AGENCY_BRANDING);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const PRESET_OPTIONS: Array<{
    id: AgencyEmblemPreset;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "MPLBP",
      title: "Majlis Perbandaran Langkawi (MPLBP)",
      description: "Lambang rasmi PBT Langkawi Bandaraya Pelancongan",
      icon: Building2,
    },
    {
      id: "KEDAH_STATE",
      title: "Jata Negeri Kedah Darul Aman",
      description: "Jata rasmi Kerajaan Negeri Kedah Darul Aman",
      icon: Landmark,
    },
    {
      id: "PLANMALAYSIA",
      title: "PLANMalaysia",
      description: "Jabatan Perancangan Bandar dan Desa Semenanjung Malaysia",
      icon: Compass,
    },
    {
      id: "JUPEM",
      title: "JUPEM (Ukur & Pemetaan)",
      description: "Jabatan Ukur dan Pemetaan Malaysia",
      icon: MapPin,
    },
    {
      id: "KPKT",
      title: "KPKT Malaysia",
      description: "Kementerian Perumahan dan Kerajaan Tempatan",
      icon: Shield,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header Breadcrumb */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <Link href="/admin" className="hover:text-gov-800">
                    Pentadbiran
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">CMS Logo & Identiti Agensi</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2.5">
                  <Palette className="h-6 w-6 text-gold-600" />
                  <span>Sistem Pengurusan Kandungan (CMS) Logo & Agensi</span>
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Kemaskini logo agensi, nama PBT, jalur jenama header rasmi, dan maklumat perhubungan urus setia secara masa nyata.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs text-slate-700"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Tetapkan Semula (Lalai)</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="bg-gov-800 text-xs text-white hover:bg-gov-900 font-bold px-4 shadow-sm"
                >
                  <Save className="h-3.5 w-3.5 mr-1 text-gold-300" />
                  <span>Simpan Perubahan CMS</span>
                </Button>
              </div>
            </div>

            {/* Notifications */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900 shadow-xs animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Perubahan identiti agensi dan logo header telah berjaya dikemas kini dan dipaparkan secara langsung ke seluruh sistem!
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3.5 text-xs font-medium text-rose-900 shadow-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Live Interactive Header Mockup Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-gov-700" />
                  <span>Pratonton Langsung Header (*Live Header Preview*)</span>
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  Kemas Kini Masa Nyata
                </span>
              </div>

              {/* Mockup Canvas */}
              <div className="overflow-hidden rounded-xl border border-gov-900/30 bg-gov-800 text-white shadow-xl">
                {/* Mock Top Strip */}
                <div className="border-b border-gov-700/60 bg-gov-950 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-100">
                      {formState.topStripText || "PORTAL RASMI KERAJAAN TEMPATAN NEGERI KEDAH DARUL AMAN"}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Sistem Pintar Pematuhan {formState.agencyAcronym || "MPLBP"}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-gold-400">{formState.referencePlanText || "RTD Langkawi 2030"}</span>
                  </div>
                </div>

                {/* Mock Main Header */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3.5">
                    <AgencyLogo branding={formState} size="md" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black tracking-tight text-white sm:text-xl">
                          {formState.portalTitle || "OSC SmartCheck AI"}
                        </span>
                        <span className="rounded-md bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-300 border border-gold-400/30">
                          {formState.agencyAcronym || "MPLBP"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-300">
                        {formState.agencyName || "Majlis Perbandaran Langkawi Bandaraya Pelancongan"}
                      </span>
                    </div>
                  </div>

                  {/* Dummy Right Profile Pill */}
                  <div className="hidden md:flex items-center gap-2 rounded-lg bg-gov-900/80 border border-gold-400/40 px-3 py-1.5 text-xs text-gold-300 font-bold">
                    <span>🛡️ Pentadbir Sistem • {formState.agencyAcronym || "MPLBP"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CMS Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("LOGO")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "LOGO"
                    ? "bg-gov-800 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>1. Logo & Identiti Visual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("AGENCY")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "AGENCY"
                    ? "bg-gov-800 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Landmark className="h-4 w-4" />
                <span>2. Maklumat PBT & Agensi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("PORTAL")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "PORTAL"
                    ? "bg-gov-800 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>3. Tajuk Portal & Tagline</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("CONTACT")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "CONTACT"
                    ? "bg-gov-800 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>4. Meja Bantuan & Statutori</span>
              </button>
            </div>

            {/* 3. Tab Form Contents */}
            <Card className="p-5 sm:p-6 border-slate-300 shadow-sm bg-white">
              {/* TAB 1: LOGO & VISUAL IDENTITY */}
              {activeTab === "LOGO" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <span>Pilihan Mod Logo Agensi</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih sama ada menggunakan Lambang Rasmi Kerajaan sedia ada, memuat naik fail imej tersuai, atau memasukkan pautan URL logo.
                    </p>
                  </div>

                  {/* Mode Selector Radio Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange({ agencyLogoType: "PRESET_EMBLEM" })}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                        formState.agencyLogoType === "PRESET_EMBLEM"
                          ? "border-gov-700 bg-gov-50/70 ring-2 ring-gov-700/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-slate-900">🏛️ Lambang Rasmi Preset</span>
                        {formState.agencyLogoType === "PRESET_EMBLEM" && (
                          <CheckCircle2 className="h-4 w-4 text-gov-700" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Pilih lambang kerajaan sedia ada (MPLBP, Kedah, dsb.)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange({ agencyLogoType: "CUSTOM_UPLOAD" })}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                        formState.agencyLogoType === "CUSTOM_UPLOAD"
                          ? "border-gov-700 bg-gov-50/70 ring-2 ring-gov-700/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-slate-900">📤 Muat Naik Imej Logo</span>
                        {formState.agencyLogoType === "CUSTOM_UPLOAD" && (
                          <CheckCircle2 className="h-4 w-4 text-gov-700" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Muat naik fail logo PNG / SVG daripada peranti anda
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange({ agencyLogoType: "IMAGE_URL" })}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                        formState.agencyLogoType === "IMAGE_URL"
                          ? "border-gov-700 bg-gov-50/70 ring-2 ring-gov-700/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-slate-900">🔗 Pautan URL Imej Logo</span>
                        {formState.agencyLogoType === "IMAGE_URL" && (
                          <CheckCircle2 className="h-4 w-4 text-gov-700" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Gunakan pautan web imej logo terus dari pelayan
                      </span>
                    </button>
                  </div>

                  {/* Mode 1: Preset Emblem Grid */}
                  {formState.agencyLogoType === "PRESET_EMBLEM" && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Pilih Lambang Kerajaan / PBT Rujukan
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PRESET_OPTIONS.map((opt) => {
                          const isSelected = formState.agencyEmblemPreset === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleFieldChange({ agencyEmblemPreset: opt.id })}
                              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                                isSelected
                                  ? "border-gold-500 bg-gold-50/50 ring-2 ring-gold-400/30"
                                  : "border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <AgencyLogo
                                branding={{
                                  ...formState,
                                  agencyLogoType: "PRESET_EMBLEM",
                                  agencyEmblemPreset: opt.id,
                                }}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">
                                  {opt.title}
                                </div>
                                <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                  {opt.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Custom File Upload */}
                  {formState.agencyLogoType === "CUSTOM_UPLOAD" && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Muat Naik Fail Logo Rasmi PBT (PNG / JPG / SVG)
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:text-left">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs">
                          {formState.agencyLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={formState.agencyLogoUrl}
                              alt="Logo Agensi"
                              className="h-12 w-12 object-contain"
                            />
                          ) : (
                            <UploadCloud className="h-8 w-8 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="text-xs font-bold text-slate-800">
                            Pilih fail logo daripada komputer anda
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Format disyorkan: PNG berlatar belakang lutsinar (*transparent*) atau SVG vektor beresolusi tinggi (Maks: 2MB).
                          </p>
                          <div className="pt-2">
                            <label className="inline-flex items-center gap-1.5 rounded-lg bg-gov-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-gov-900 cursor-pointer shadow-xs transition">
                              <UploadCloud className="h-3.5 w-3.5 text-gold-300" />
                              <span>Pilih Fail Imej...</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Image URL */}
                  {formState.agencyLogoType === "IMAGE_URL" && (
                    <div className="space-y-3 pt-2">
                      <label htmlFor="agencyLogoUrl" className="block text-xs font-bold text-slate-700 uppercase">
                        Pautan Web URL Logo Agensi (HTTPS)
                      </label>
                      <input
                        id="agencyLogoUrl"
                        type="url"
                        value={formState.agencyLogoUrl}
                        onChange={(e) => handleFieldChange({ agencyLogoUrl: e.target.value })}
                        placeholder="https://www.mplbp.gov.my/sites/default/files/logo-mplbp.png"
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 font-mono"
                      />
                      <p className="text-[11px] text-slate-500">
                        Pastikan pautan bermula dengan <code>https://</code> dan boleh diakses secara terbuka.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AGENCY & PBT DETAILS */}
              {activeTab === "AGENCY" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Maklumat Pihak Berkuasa Tempatan (PBT) & Agensi
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nama dan akronim ini digunakan dalam tajuk rasmi, laporan kelulusan KM, dan sijil pengesahan digital.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="agencyName" className="block text-xs font-bold text-slate-700 uppercase">
                        Nama Penuh PBT / Agensi
                      </label>
                      <input
                        id="agencyName"
                        type="text"
                        required
                        value={formState.agencyName}
                        onChange={(e) => handleFieldChange({ agencyName: e.target.value })}
                        placeholder="Majlis Perbandaran Langkawi Bandaraya Pelancongan"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="agencyAcronym" className="block text-xs font-bold text-slate-700 uppercase">
                        Singkatan / Akronim PBT
                      </label>
                      <input
                        id="agencyAcronym"
                        type="text"
                        required
                        value={formState.agencyAcronym}
                        onChange={(e) => handleFieldChange({ agencyAcronym: e.target.value })}
                        placeholder="MPLBP"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 font-bold"
                      />
                    </div>

                    <div>
                      <label htmlFor="agencyDepartment" className="block text-xs font-bold text-slate-700 uppercase">
                        Unit / Jabatan Pengendali
                      </label>
                      <input
                        id="agencyDepartment"
                        type="text"
                        value={formState.agencyDepartment}
                        onChange={(e) => handleFieldChange({ agencyDepartment: e.target.value })}
                        placeholder="Unit Pusat Setempat (OSC)"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="stateName" className="block text-xs font-bold text-slate-700 uppercase">
                        Negeri
                      </label>
                      <input
                        id="stateName"
                        type="text"
                        value={formState.stateName}
                        onChange={(e) => handleFieldChange({ stateName: e.target.value })}
                        placeholder="Kedah Darul Aman"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PORTAL TITLE & HEADER STRIP */}
              {activeTab === "PORTAL" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Tajuk Portal, Tagline & Jalur Atas Rasmi
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tetapkan penamaan sistem, cogan kata rasmi, dan rujukan dokumen Rancangan Tempatan (RTD).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="portalTitle" className="block text-xs font-bold text-slate-700 uppercase">
                        Nama Utama Portal / Sistem
                      </label>
                      <input
                        id="portalTitle"
                        type="text"
                        value={formState.portalTitle}
                        onChange={(e) => handleFieldChange({ portalTitle: e.target.value })}
                        placeholder="OSC SmartCheck AI"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 font-bold"
                      />
                    </div>

                    <div>
                      <label htmlFor="referencePlanText" className="block text-xs font-bold text-slate-700 uppercase">
                        Dokumen Rancangan Tempatan Rujukan (RTD)
                      </label>
                      <input
                        id="referencePlanText"
                        type="text"
                        value={formState.referencePlanText}
                        onChange={(e) => handleFieldChange({ referencePlanText: e.target.value })}
                        placeholder="RTD Langkawi 2030"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="topStripText" className="block text-xs font-bold text-slate-700 uppercase">
                        Teks Jalur Jenama Atas (*Top Brand Strip*)
                      </label>
                      <input
                        id="topStripText"
                        type="text"
                        value={formState.topStripText}
                        onChange={(e) => handleFieldChange({ topStripText: e.target.value })}
                        placeholder="PORTAL RASMI KERAJAAN TEMPATAN NEGERI KEDAH DARUL AMAN"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="portalTagline" className="block text-xs font-bold text-slate-700 uppercase">
                        Tagline / Cogan Kata Rasmi Sistem
                      </label>
                      <input
                        id="portalTagline"
                        type="text"
                        value={formState.portalTagline}
                        onChange={(e) => handleFieldChange({ portalTagline: e.target.value })}
                        placeholder="Semak Pintar • Lokasi Tepat • Keputusan Diyakini"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 text-gold-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT & STATUTORY NOTICES */}
              {activeTab === "CONTACT" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Meja Bantuan OSC & Penafian Statutori
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Maklumat perhubungan untuk pemohon serta notis perundangan di bawah Akta 172.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="helpdeskEmail" className="block text-xs font-bold text-slate-700 uppercase">
                        Emel Rasmi Urus Setia OSC
                      </label>
                      <input
                        id="helpdeskEmail"
                        type="email"
                        value={formState.helpdeskEmail}
                        onChange={(e) => handleFieldChange({ helpdeskEmail: e.target.value })}
                        placeholder="osc@mplbp.gov.my"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="helpdeskPhone" className="block text-xs font-bold text-slate-700 uppercase">
                        No. Telefon Meja Bantuan
                      </label>
                      <input
                        id="helpdeskPhone"
                        type="text"
                        value={formState.helpdeskPhone}
                        onChange={(e) => handleFieldChange({ helpdeskPhone: e.target.value })}
                        placeholder="+604-966 6590"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="agencyAddress" className="block text-xs font-bold text-slate-700 uppercase">
                        Alamat Rasmi Kompleks Agensi
                      </label>
                      <textarea
                        id="agencyAddress"
                        rows={2}
                        value={formState.agencyAddress}
                        onChange={(e) => handleFieldChange({ agencyAddress: e.target.value })}
                        placeholder="Kompleks MPLBP, Persiaran Putra, Kuah, 07000 Langkawi, Kedah Darul Aman"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="statutoryActNotice" className="block text-xs font-bold text-slate-700 uppercase">
                        Klausa Penafian Statutori & Notis Audit
                      </label>
                      <textarea
                        id="statutoryActNotice"
                        rows={2}
                        value={formState.statutoryActNotice}
                        onChange={(e) => handleFieldChange({ statutoryActNotice: e.target.value })}
                        placeholder="Akses tertakluk kepada Akta Perancangan Bandar dan Desa 1976 (Akta 172). Semua aktiviti diaudit."
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600 text-slate-700 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
