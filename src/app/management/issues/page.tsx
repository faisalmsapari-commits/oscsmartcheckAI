"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { ArrowLeft, AlertTriangle, Search } from "lucide-react";

export default function ManagementIssuesPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  return (
    <ProtectedRoute
      allowedRoles={[
        "OSC_MANAGER",
        "PLANNING_MANAGER",
        "OSC_OFFICER",
        "PLANNING_OFFICER",
        "ADMIN",
        "SUPER_ADMIN",
      ]}
    >
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="management" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/management/dashboard" className="hover:text-gov-800">
                    Dashboard Pengurusan
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pengawasan Isu Perancangan</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  PENGAWASAN ISU KETIDAKPATUHAN & SEMAKAN
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Analisis pematuhan dan pemantauan tindakan pembetulan pemohon.
                </p>
              </div>

              <Link href="/management/dashboard">
                <Button variant="outline" size="sm" className="text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {["ALL", "OPEN", "IN_REVIEW", "WAITING_APPLICANT", "RESOLVED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${
                      filterStatus === st
                        ? "bg-gov-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "Semua" : st}
                  </button>
                ))}
              </div>

              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tajuk isu atau klausa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <Card className="p-8 text-center text-xs text-slate-500">
              <AlertTriangle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-800">Senarai Terperinci Isu Pengurusan</p>
              <p className="mt-1">
                Semua isu perancangan yang dijana secara automatik oleh enjin peraturan atau dicatat oleh pegawai direkodkan dengan telus.
              </p>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
