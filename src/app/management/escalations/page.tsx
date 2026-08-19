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
import { EscalationRecord } from "@/types/workflow";
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Clock,
} from "lucide-react";

const INITIAL_DEMO_ESCALATIONS: EscalationRecord[] = [
  {
    escalationId: "esc-demo-001",
    applicationId: "app-demo-003",
    entityType: "APPLICATION",
    entityId: "app-demo-003",
    reason: "SERVICE_TARGET_WARNING",
    severity: "MEDIUM",
    status: "OPEN",
    title: "Permohonan Menghampiri 80% Tempoh Piagam (KM/2026/000103)",
    description: "Isu RFI kapasiti tempat letak kereta memerlukan tindakan susulan dengan perunding sebelum mesyuarat jawatankuasa.",
    assignedTo: "Pn. Noor Aini binti Zakaria",
    assignedRole: "PLANNING_OFFICER",
    createdAt: "2026-08-18T09:30:00Z",
  },
  {
    escalationId: "esc-demo-002",
    applicationId: "app-demo-004",
    entityType: "APPLICATION",
    entityId: "app-demo-004",
    reason: "CRITICAL_ISSUE_UNREVIEWED",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    title: "Semakan Penimbal Pantai LCP v2 (KM/2026/000104)",
    description: "Pelan pinda diserah semula oleh arkitek. Pegawai GIS perlu mengesahkan garisan rezab pantai 20m.",
    assignedTo: "En. Faizal bin Hashim",
    assignedRole: "GIS_OFFICER",
    createdAt: "2026-08-17T11:15:00Z",
  },
];

export default function ManagementEscalationsPage() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<EscalationRecord[]>(INITIAL_DEMO_ESCALATIONS);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/management/escalations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.escalations && data.escalations.length > 0) {
          setEscalations(data.escalations);
        }
      }
    } catch (err) {
      console.error("Failed to load escalations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAction = async (escalationId: string, action: "ACKNOWLEDGE" | "RESOLVE") => {
    setEscalations((prev) =>
      prev.map((esc) =>
        esc.escalationId === escalationId
          ? { ...esc, status: action === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : "RESOLVED" }
          : esc
      )
    );
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch("/api/management/escalations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ escalationId, action }),
      });
      loadData();
    } catch (err) {
      console.error("Failed to update escalation:", err);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={[
        "OSC_MANAGER",
        "PLANNING_MANAGER",
        "OSC_OFFICER",
        "PLANNING_OFFICER",
        "GIS_OFFICER",
        "ADMIN",
        "SUPER_ADMIN",
        "APPLICANT",
      ]}
    >
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="escalations" />

          <div className="flex-1 space-y-5 p-4 sm:p-6 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Pengurusan OSC</span>
                  <span>/</span>
                  <span className="text-gov-800 font-bold">Eskalasi Operasi & SLA</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1 flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                  <span>Pemantauan Eskalasi & Sasaran Perkhidmatan (SLA)</span>
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Senarai eskalasi operasi dan amaran kelewatan masa pemprosesan bagi tindakan pengurusan OSC MPLBP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/management/dashboard">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Dashboard Pengurusan</span>
                  </Button>
                </Link>

                <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                  <span>Muat Semula</span>
                </Button>
              </div>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-3.5 border-l-4 border-l-red-600 bg-white">
                <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold">
                  <span>Eskalasi Terbuka</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {escalations.filter((e) => e.status === "OPEN").length} Kes
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Memerlukan tindakan pengurusan</div>
              </Card>

              <Card className="p-3.5 border-l-4 border-l-amber-500 bg-white">
                <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold">
                  <span>Diakui (Dalam Tindakan)</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {escalations.filter((e) => e.status === "ACKNOWLEDGED").length} Kes
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Tindakan susulan sedang diambil</div>
              </Card>

              <Card className="p-3.5 border-l-4 border-l-emerald-600 bg-white">
                <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold">
                  <span>Selesai</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {escalations.filter((e) => e.status === "RESOLVED").length} Kes
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Isu telah diselesaikan sepenuhnya</div>
              </Card>
            </div>

            {/* List of Escalations */}
            {escalations.length === 0 ? (
              <Card className="p-12 text-center text-sm text-slate-500 bg-white">
                Tiada rekod eskalasi aktif pada masa ini. Operasi berjalan mengikut sasaran piagam pelanggan.
              </Card>
            ) : (
              <div className="space-y-3">
                {escalations.map((esc) => (
                  <div
                    key={esc.escalationId}
                    className={`rounded-sm border p-4 transition-all shadow-2xs ${
                      esc.status === "OPEN"
                        ? "bg-red-50/60 border-red-300"
                        : esc.status === "ACKNOWLEDGED"
                        ? "bg-amber-50/60 border-amber-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-xs px-2 py-0.5 text-xs font-bold ${
                              esc.severity === "CRITICAL" || esc.severity === "HIGH"
                                ? "bg-red-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {esc.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-800 uppercase">
                            {esc.reason}
                          </span>
                          <span className="text-xs text-slate-600 font-semibold">
                            • Status: <strong>{esc.status}</strong>
                          </span>
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">{esc.title}</h2>
                        <p className="text-xs text-slate-700">{esc.description}</p>
                        <div className="text-xs text-slate-500 pt-1 flex flex-wrap items-center gap-2">
                          <span>Permohonan: <strong className="font-mono text-gov-800">{esc.applicationId}</strong></span>
                          <span>•</span>
                          <span>Pegawai: <strong>{esc.assignedTo}</strong></span>
                          <span>•</span>
                          <span>Dicipta: {new Date(String(esc.createdAt)).toLocaleDateString("ms-MY")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {esc.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(esc.escalationId, "ACKNOWLEDGE")}
                            className="text-xs bg-white border-slate-300 font-bold"
                          >
                            Akui (Acknowledge)
                          </Button>
                        )}
                        {esc.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(esc.escalationId, "RESOLVE")}
                            className="text-xs bg-gov-850 text-white font-bold"
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Selesaikan
                          </Button>
                        )}
                        <Link href={`/applications/${esc.applicationId}`}>
                          <Button variant="outline" size="sm" className="text-xs bg-white">
                            Lihat Permohonan ↗
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
