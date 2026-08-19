"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { PlanningRuleSet } from "@/types/rules";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

export default function PlanningRulesAdminPage() {
  const { user } = useAuth();
  const [ruleSets, setRuleSets] = useState<PlanningRuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(null);

  const fetchRuleSets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/rules/sets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memuatkan set peraturan");
      }

      const data = await res.json();
      setRuleSets(data.ruleSets || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuleSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/admin" className="hover:text-gov-800">
                    Pentadbiran Sistem
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Garis Panduan & Peraturan Perancangan</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    PENTADBIRAN PERATURAN PERANCANGAN (RULE ENGINE)
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                    <Sparkles className="h-3 w-3" />
                    <span>Deterministic Core</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={fetchRuleSets} disabled={loading} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>
              </div>
            </div>

            {/* Alerts */}
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

            {/* Rule Sets Table */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900">Senarai Set Peraturan Perancangan Aktif</h3>
                </div>
                <span className="font-mono text-xs text-slate-500">{ruleSets.length} Set Peraturan</span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Kod Set Peraturan</th>
                      <th className="p-2.5">Nama & Bidang Kuasa</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Versi</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ruleSets.map((rs) => (
                      <tr key={rs.ruleSetId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{rs.code}</td>
                        <td className="p-2.5">
                          <span className="block font-semibold text-slate-900">{rs.name}</span>
                          <span className="text-[11px] text-slate-500">Pihak Berkuasa: {rs.authority} ({rs.jurisdiction})</span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {rs.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-semibold text-gov-800">v{rs.version}</td>
                        <td className="p-2.5">
                          {rs.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>AKTIF</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              {rs.status}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]">
                            <SlidersHorizontal className="h-3 w-3 mr-1" />
                            <span>Lihat Klausa</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
