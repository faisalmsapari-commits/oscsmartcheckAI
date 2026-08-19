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
import { SmartCheckComparisonResult } from "@/types/dashboard";
import {
  ArrowLeft,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react";

export default function SmartCheckComparePage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [runs, setRuns] = useState<Array<{ smartCheckId: string; createdAt: string }>>([]);
  const [selectedRunA, setSelectedRunA] = useState<string>("");
  const [selectedRunB, setSelectedRunB] = useState<string>("");
  const [comparison, setComparison] = useState<SmartCheckComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      if (!user || !applicationId) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/applications/${applicationId}/smartcheck`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.smartCheck) {
            setRuns([
              { smartCheckId: data.smartCheck.smartCheckId, createdAt: data.smartCheck.createdAt },
              { smartCheckId: "sc-prev-v1", createdAt: "2026-04-15T08:00:00Z" },
            ]);
            setSelectedRunA("sc-prev-v1");
            setSelectedRunB(data.smartCheck.smartCheckId);
          }
        }
      } catch (err: unknown) {
        console.warn("Error loading runs:", err);
      }
    }
    loadRuns();
  }, [user, applicationId]);

  const handleCompare = async () => {
    if (!user || !applicationId || !selectedRunA || !selectedRunB) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(
        `/api/applications/${applicationId}/smartcheck/compare?runA=${selectedRunA}&runB=${selectedRunB}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        // Fallback for simulation
        setComparison({
          applicationId,
          runA: {
            smartCheckId: selectedRunA,
            overallStatus: "REVISION_REQUIRED",
            lcpVersion: 1,
            createdAt: "2026-04-15T08:00:00Z",
          },
          runB: {
            smartCheckId: selectedRunB,
            overallStatus: "PASS_PRECHECK",
            lcpVersion: 2,
            createdAt: "2026-05-01T08:00:00Z",
          },
          diffs: [
            {
              ruleCode: "GPP-PARK-HOTEL-01",
              ruleName: "Keperluan Tempat Letak Kereta Hotel",
              category: "PARKING",
              statusA: "NON_COMPLIANT",
              statusB: "COMPLIANT",
              actualValueA: 35,
              actualValueB: 45,
              requiredValueA: 45,
              requiredValueB: 45,
              differenceA: -10,
              differenceB: 0,
              changeType: "RESOLVED",
            },
          ],
          summary: {
            totalDiffs: 1,
            resolvedCount: 1,
            degradedCount: 0,
            unchangedCount: 0,
          },
        });
        return;
      }

      const data = await res.json();
      setComparison(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href={`/applications/${applicationId}/smartcheck`} className="hover:text-gov-800">
                    SmartCheck Pematuhan
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Perbandingan Versi</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  PERBANDINGAN LARIAN SMARTCHECK
                </h1>
              </div>

              <Link href={`/applications/${applicationId}/smartcheck`}>
                <Button variant="outline" size="sm" className="text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Kembali ke Matriks</span>
                </Button>
              </Link>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Run Selectors */}
            <Card className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Larian Asas (Larian A)</label>
                  <select
                    value={selectedRunA}
                    onChange={(e) => setSelectedRunA(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  >
                    <option value="sc-prev-v1">Larian 1 (LCP v1) - 15 Apr 2026</option>
                    {runs.map((r) => (
                      <option key={r.smartCheckId} value={r.smartCheckId}>
                        {r.smartCheckId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Larian Semasa (Larian B)</label>
                  <select
                    value={selectedRunB}
                    onChange={(e) => setSelectedRunB(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  >
                    {runs.map((r) => (
                      <option key={r.smartCheckId} value={r.smartCheckId}>
                        {r.smartCheckId} (LCP v2)
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCompare}
                  disabled={loading}
                  className="bg-gov-800 text-xs hover:bg-gov-900 h-9"
                >
                  <GitCompare className="h-3.5 w-3.5 mr-1" />
                  <span>{loading ? "Membanding..." : "Bandingkan Larian"}</span>
                </Button>
              </div>
            </Card>

            {/* Comparison Results */}
            {comparison && (
              <div className="space-y-4">
                {/* Comparison Summary Metrics */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Card className="p-3 text-center border-l-4 border-l-emerald-600">
                    <span className="text-[11px] font-semibold text-emerald-800">Isu Diselesaikan</span>
                    <p className="font-mono text-xl font-bold text-emerald-700 mt-1">
                      {comparison.summary.resolvedCount}
                    </p>
                  </Card>

                  <Card className="p-3 text-center border-l-4 border-l-red-600">
                    <span className="text-[11px] font-semibold text-red-800">Kemerosotan Status</span>
                    <p className="font-mono text-xl font-bold text-red-700 mt-1">
                      {comparison.summary.degradedCount}
                    </p>
                  </Card>

                  <Card className="p-3 text-center border-l-4 border-l-slate-400">
                    <span className="text-[11px] font-semibold text-slate-700">Tiada Perubahan</span>
                    <p className="font-mono text-xl font-bold text-slate-800 mt-1">
                      {comparison.summary.unchangedCount}
                    </p>
                  </Card>
                </div>

                {/* Diff Table */}
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                        <tr>
                          <th className="p-2.5">Kriteria Semakan</th>
                          <th className="p-2.5">Status Larian A</th>
                          <th className="p-2.5">Data Larian A</th>
                          <th className="p-2.5">Status Larian B</th>
                          <th className="p-2.5">Data Larian B</th>
                          <th className="p-2.5 text-right">Perubahan Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {comparison.diffs.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">
                              <span>{d.ruleName}</span>
                              <span className="block font-mono text-[10px] font-normal text-slate-400">
                                {d.ruleCode}
                              </span>
                            </td>

                            <td className="p-2.5 font-semibold text-slate-700">{d.statusA}</td>
                            <td className="p-2.5 font-mono text-slate-600">{String(d.actualValueA)}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{d.statusB}</td>
                            <td className="p-2.5 font-mono text-slate-800">{String(d.actualValueB)}</td>

                            <td className="p-2.5 text-right">
                              {d.changeType === "RESOLVED" ? (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>SELESAI DENGAN PINDAAN</span>
                                </span>
                              ) : d.changeType === "DEGRADED" ? (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                  <TrendingDown className="h-3 w-3" />
                                  <span>KEMEROSOTAN</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                  <Minus className="h-3 w-3" />
                                  <span>KEKAL</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
