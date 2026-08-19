/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Info,
  ArrowLeft,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  FileText,
  Compass,
} from "lucide-react";

const INITIAL_SYSTEM_INFO = {
  systemName: "OSC SmartCheck AI — Majlis Perbandaran Langkawi Bandaraya Pelancongan",
  appVersion: "1.0.0",
  buildCommit: "production-build-2026.08.19",
  environment: "PRODUCTION_READY",
  firebaseProject: "osc-smartcheck-mplbp",
  ruleEngineVersion: "1.0.0 (DSL Deterministic Engine)",
  aiPromptVersion: "1.0.0 (Gemini 2.5 Pro / Vertex AI)",
  reportTemplateVersion: "1.0.0 (PDF 1.7 SHA-256 Digital Hash)",
  gisProjection: "EPSG:3375 (Cassini Kedah / RSO Malaya)",
  legalFramework: "Akta Perancangan Bandar dan Desa 1976 (Akta 172)",
  authority: "Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)",
  serverTime: new Date().toISOString(),
};

export default function SystemInfoPage() {
  const { user } = useAuth();
  const [info, setInfo] = useState<any>(INITIAL_SYSTEM_INFO);
  const [loading, setLoading] = useState(false);

  const loadInfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/system-info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch (err) {
      console.error("Failed to load system info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "OSC_MANAGER", "PLANNING_MANAGER", "GIS_OFFICER", "OSC_OFFICER", "PLANNING_OFFICER", "APPLICANT"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="system-info" />

          <div className="flex-1 space-y-5 p-4 sm:p-6 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Pentadbiran Sistem</span>
                  <span>/</span>
                  <span className="text-gov-800 font-bold">Maklumat Sistem</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1 flex items-center gap-2">
                  <Info className="h-6 w-6 text-gov-800" />
                  <span>Maklumat Sistem & Versi Komponen (System Info)</span>
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Parameter Pengeluaran, Enjin Peraturan & Versi Model OSC SmartCheck AI MPLBP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    <span>Panel Pentadbiran</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadInfo}
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Segar Semula</span>
                </Button>
              </div>
            </div>

            {info && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Application & Environment */}
                <Card headerTitle="Persekitaran & Aplikasi" className="p-5 space-y-4 bg-white shadow-2xs">
                  <div className="flex items-center gap-3 text-gov-800">
                    <div className="h-10 w-10 rounded-sm bg-gov-100 flex items-center justify-center">
                      <Server className="h-5 w-5 text-gov-800" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{info.systemName}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{info.authority}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-600 font-medium">Versi Aplikasi:</span>
                      <span className="font-mono font-bold text-slate-900">{info.appVersion}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-600 font-medium">Persekitaran:</span>
                      <span className="rounded-xs bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-bold uppercase text-emerald-850 text-xs">
                        {info.environment}
                      </span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-600 font-medium">Projek Pengeluaran:</span>
                      <span className="font-mono font-semibold text-slate-800">{info.firebaseProject}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-600 font-medium">Commit SHA / Build:</span>
                      <span className="font-mono font-semibold text-slate-700 text-xs">{info.buildCommit}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-600 font-medium">Punca Kuasa Perundangan:</span>
                      <span className="font-bold text-slate-900">{info.legalFramework}</span>
                    </div>
                  </div>
                </Card>

                {/* Subsystem & Rule Engine Versions */}
                <Card headerTitle="Versi Sub-Sistem & Enjin Peraturan" className="p-5 space-y-4 bg-white shadow-2xs">
                  <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-gov-800 shrink-0" />
                        <span className="text-slate-700 font-medium">Enjin Peraturan (Rule Engine):</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{info.ruleEngineVersion}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-gold-600 shrink-0" />
                        <span className="text-slate-700 font-medium">Model AI & Document AI:</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{info.aiPromptVersion}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                        <span className="text-slate-700 font-medium">Format Laporan Rasmi:</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{info.reportTemplateVersion}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-purple-700 shrink-0" />
                        <span className="text-slate-700 font-medium">Unjuran GIS & Kadaster:</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{info.gisProjection}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
                    Masa Pelayan Sistem (UTC): {info.serverTime}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
