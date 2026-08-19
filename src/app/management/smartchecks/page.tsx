"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ManagementSmartChecksPage() {
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
                  <span className="text-gov-800">Rekod Penilaian SmartCheck</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  REKOD PENILAIAN ENJIN PERATURAN SMARTCHECK
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Log pelaksanaan penilaian deterministik dan pematuhan versi peraturan perancangan.
                </p>
              </div>

              <Link href="/management/dashboard">
                <Button variant="outline" size="sm" className="text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>

            <Card className="p-8 text-center text-xs text-slate-500">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-800">Arkib & Penilaian SmartCheck</p>
              <p className="mt-1">
                Semua penilaian enjin SmartCheck direkodkan secara tidak boleh diubah (immutable) bagi tujuan audit integriti.
              </p>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
