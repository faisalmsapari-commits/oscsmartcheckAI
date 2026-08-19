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
import { GoLiveReadinessReport } from "@/lib/golive/goLiveTypes";
import { INITIAL_GO_LIVE_REPORT } from "@/lib/golive/initialGoLiveReport";
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function GoLiveChecklistPage() {
  const { user } = useAuth();
  const [readiness, setReadiness] = useState<GoLiveReadinessReport>(INITIAL_GO_LIVE_REPORT);
  const [loading, setLoading] = useState(false);

  const loadReadiness = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/go-live", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items) {
          setReadiness(data);
        }
      }
    } catch (err) {
      console.error("Failed to load go-live readiness:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "OSC_MANAGER", "PLANNING_MANAGER", "OSC_OFFICER", "PLANNING_OFFICER", "GIS_OFFICER", "APPLICANT"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="go-live" />

          <div className="flex-1 space-y-5 p-4 sm:p-6 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Pentadbiran Sistem</span>
                  <span>/</span>
                  <span className="text-gov-800 font-bold">Kesediaan Go-Live</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1 flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-gov-800" />
                  <span>Senarai Semak Kesediaan Pelancaran (Go-Live Readiness)</span>
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Pengesahan 11 Kategori Tadbir Urus Pengeluaran & Audit Kesediaan Sistem OSC SmartCheck AI MPLBP.
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
                  onClick={loadReadiness}
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Segar Semula</span>
                </Button>
              </div>
            </div>

            {/* Readiness Summary Banner */}
            <div
              className={`p-6 rounded-md border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs ${
                readiness.readyForGoLive
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {readiness.readyForGoLive ? (
                    <ShieldCheck className="h-7 w-7 text-emerald-800" />
                  ) : (
                    <AlertTriangle className="h-7 w-7 text-amber-800" />
                  )}
                  <h2 className="text-base sm:text-lg font-bold">
                    {readiness.readyForGoLive
                      ? "Sedia Untuk Pelancaran Pengeluaran (Go-Live Approved)"
                      : "Semakan Kesediaan Belum Selesai (Pending Go-Live Requirements)"}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-700">
                  {readiness.passedChecks} daripada {readiness.totalChecks} kriteria tadbir urus telah disahkan ({readiness.readinessPercentage}% Pematuhan Penuh).
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                  {readiness.readinessPercentage}%
                </span>
                <p className="text-xs uppercase font-bold text-slate-500 mt-0.5">Skor Kesediaan</p>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {readiness.items.map((item) => (
                <Card key={item.id} className="p-4 bg-white hover:border-slate-300 transition-colors shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gov-800 bg-slate-100 px-2 py-0.5 rounded-xs">
                          {item.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          {item.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                      </div>
                      <p className="text-xs text-slate-700">{item.description}</p>
                      {item.evidence && (
                        <p className="text-xs text-slate-500 font-medium">
                          Bukti/Catatan: <span className="text-slate-700 italic">{item.evidence}</span> (Pemilik: <b>{item.owner}</b>)
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {item.status === "PASS" && (
                        <span className="inline-flex items-center gap-1 rounded-xs bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> LULUS
                        </span>
                      )}
                      {item.status === "FAIL" && (
                        <span className="inline-flex items-center gap-1 rounded-xs bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-300">
                          <XCircle className="h-3.5 w-3.5" /> GAGAL
                        </span>
                      )}
                      {item.status === "WAIVED" && (
                        <span className="inline-flex items-center gap-1 rounded-xs bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5" /> DIKECUALIKAN
                        </span>
                      )}
                      {item.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center gap-1 rounded-xs bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                          DALAM TINDAKAN
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
