"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ArrowRight,
  Filter,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";

export interface OfficerSlaApplication {
  id: string;
  applicationNo: string;
  title: string;
  mukim: string;
  lotNo: string;
  developmentCategory: string;
  assignedOfficer: {
    name: string;
    role: string;
    department: string;
    avatarInitials: string;
  };
  receivedDate: string;
  completedDate?: string;
  status: string;
  slaTargetDays: number; // Piagam Pelanggan KM: 14 hari
  daysUsed: number;
  stageBreakdown: {
    documentCheckDays: number; // Sasaran <= 3 hari
    smartCheckAiDays: number; // Sasaran <= 1 hari
    officerReviewDays: number; // Sasaran <= 7 hari
    finalVerificationDays: number; // Sasaran <= 3 hari
  };
  slaComplianceStatus: "ON_TIME" | "NEAR_BREACH" | "BREACHED" | "DRAFT";
  performanceRemarks: string;
}

export const DEMO_SLA_APPLICATIONS: OfficerSlaApplication[] = [
  {
    id: "app-demo-001",
    applicationNo: "KM/2026/000101",
    title: "Cadangan Pembangunan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
    mukim: "Kedawang",
    lotNo: "Lot 1042",
    developmentCategory: "PELANCONGAN",
    assignedOfficer: {
      name: "Pn. Noor Aini binti Zakaria",
      role: "Pegawai Perancang Bandar",
      department: "Jabatan Perancangan Pembangunan",
      avatarInitials: "NA",
    },
    receivedDate: "2026-06-01",
    completedDate: "2026-06-06",
    status: "COMPLETED",
    slaTargetDays: 14,
    daysUsed: 4.5,
    stageBreakdown: {
      documentCheckDays: 0.5,
      smartCheckAiDays: 0.1,
      officerReviewDays: 3.2,
      finalVerificationDays: 0.7,
    },
    slaComplianceStatus: "ON_TIME",
    performanceRemarks: "Proses selesai 9.5 hari lebih awal daripada sasaran Piagam Pelanggan.",
  },
  {
    id: "app-demo-002",
    applicationNo: "KM/2026/000102",
    title: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
    mukim: "Kuah",
    lotNo: "Lot 3241",
    developmentCategory: "PERUMAHAN",
    assignedOfficer: {
      name: "En. Azman bin Kassim",
      role: "Pegawai Kanan OSC",
      department: "Bahagian Pusat Setempat (OSC)",
      avatarInitials: "AK",
    },
    receivedDate: "2026-07-15",
    status: "OFFICER_REVIEW",
    slaTargetDays: 14,
    daysUsed: 6.0,
    stageBreakdown: {
      documentCheckDays: 1.0,
      smartCheckAiDays: 0.2,
      officerReviewDays: 4.8,
      finalVerificationDays: 0.0,
    },
    slaComplianceStatus: "ON_TIME",
    performanceRemarks: "Sedang dalam ulasan teknikal anjakan hadapan. Berada pada 42.8% had masa SLA.",
  },
  {
    id: "app-demo-003",
    applicationNo: "KM/2026/000103",
    title: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
    mukim: "Kuah",
    lotNo: "Lot 512",
    developmentCategory: "PERDAGANGAN",
    assignedOfficer: {
      name: "Pn. Noor Aini binti Zakaria",
      role: "Pegawai Perancang Bandar",
      department: "Jabatan Perancangan Pembangunan",
      avatarInitials: "NA",
    },
    receivedDate: "2026-07-20",
    status: "REQUEST_INFORMATION",
    slaTargetDays: 14,
    daysUsed: 3.5,
    stageBreakdown: {
      documentCheckDays: 0.8,
      smartCheckAiDays: 0.1,
      officerReviewDays: 2.6,
      finalVerificationDays: 0.0,
    },
    slaComplianceStatus: "ON_TIME",
    performanceRemarks: "Notis RFI tempat letak kereta dikeluarkan pantas pada hari ke-3 (Masa rasmi dibekukan).",
  },
  {
    id: "app-demo-004",
    applicationNo: "KM/2026/000104",
    title: "Cadangan Pembangunan Bercampur (Pangsapuri Servis & Ruang Niaga Maritim)",
    mukim: "Padang Matsirat",
    lotNo: "Lot 889",
    developmentCategory: "PEMBANGUNAN_BERCAMPUR",
    assignedOfficer: {
      name: "En. Faizal bin Hashim",
      role: "Pegawai Geospatial & GIS",
      department: "Unit GIS & Kawalan Spatial",
      avatarInitials: "FH",
    },
    receivedDate: "2026-06-25",
    status: "RESUBMITTED",
    slaTargetDays: 14,
    daysUsed: 5.2,
    stageBreakdown: {
      documentCheckDays: 1.2,
      smartCheckAiDays: 0.2,
      officerReviewDays: 3.8,
      finalVerificationDays: 0.0,
    },
    slaComplianceStatus: "ON_TIME",
    performanceRemarks: "Pelan pinda v2 diterima. Pegawai GIS sedang menyemak semula penimbal zon pantai.",
  },
  {
    id: "app-demo-005",
    applicationNo: "KM/2026/000105",
    title: "Cadangan Pusat Pemprosesan Makanan Laut & Gudang Logistik Sejuk Beku",
    mukim: "Ayer Hangat",
    lotNo: "Lot 1503",
    developmentCategory: "INDUSTRI",
    assignedOfficer: {
      name: "En. Azman bin Kassim",
      role: "Pegawai Kanan OSC",
      department: "Bahagian Pusat Setempat (OSC)",
      avatarInitials: "AK",
    },
    receivedDate: "2026-08-01",
    status: "VERIFIED",
    slaTargetDays: 14,
    daysUsed: 2.1,
    stageBreakdown: {
      documentCheckDays: 1.0,
      smartCheckAiDays: 0.1,
      officerReviewDays: 1.0,
      finalVerificationDays: 0.0,
    },
    slaComplianceStatus: "ON_TIME",
    performanceRemarks: "SmartCheck AI lulus automatik 100%. Disahkan pegawai dalam masa 2.1 hari.",
  },
];

export function OfficerSlaCredibilityCard() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>("ALL");
  const [activeModalApp, setActiveModalApp] = useState<OfficerSlaApplication | null>(null);

  const filteredApps = DEMO_SLA_APPLICATIONS.filter((app) => {
    if (selectedStatusFilter !== "ALL" && app.slaComplianceStatus !== selectedStatusFilter) {
      return false;
    }
    if (selectedOfficerFilter !== "ALL" && !app.assignedOfficer.name.includes(selectedOfficerFilter)) {
      return false;
    }
    return true;
  });

  const activeApps = DEMO_SLA_APPLICATIONS.filter((a) => a.status !== "DRAFT");
  const onTimeCount = activeApps.filter((a) => a.slaComplianceStatus === "ON_TIME").length;
  const complianceRate = ((onTimeCount / activeApps.length) * 100).toFixed(1);
  const avgDaysUsed = (activeApps.reduce((acc, a) => acc + a.daysUsed, 0) / activeApps.length).toFixed(1);

  const getSlaBadge = (status: OfficerSlaApplication["slaComplianceStatus"], daysUsed: number, targetDays: number) => {
    switch (status) {
      case "ON_TIME":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>DALAM PIAGAM ({((daysUsed / targetDays) * 100).toFixed(0)}%)</span>
          </span>
        );
      case "NEAR_BREACH":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
            <span>AMARAN SLA ({((daysUsed / targetDays) * 100).toFixed(0)}%)</span>
          </span>
        );
      case "BREACHED":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-300">
            <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
            <span>MELEBIHI SASARAN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-xs bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            DRAF PEMOHON
          </span>
        );
    }
  };

  return (
    <Card className="p-0 border border-slate-300 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gov-900 via-gov-800 to-indigo-950 p-4 sm:p-5 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 border border-gold-400/30">
                ⭐ Kredibiliti & Integriti Pegawai
              </span>
              <span className="text-xs text-slate-300">Piagam Pelanggan Kebenaran Merancang (KM)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1 text-white flex items-center gap-2">
              <span>Pemantauan Masa Proses & Pematuhan Piagam Pelanggan</span>
              <span className="text-xs font-normal text-slate-300 font-mono">
                (Sasaran Rasmi MPLBP: ≤ 14 Hari Bekerja)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/management/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs backdrop-blur-xs"
              >
                <span>Laporan Eksekutif Penuh</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 SLA KPI Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/15">
          <div className="bg-white/10 rounded-sm p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-200">
              <span>Pematuhan Piagam</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1 font-mono">{complianceRate}%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">{onTimeCount}/{activeApps.length} Permohonan Dalam Had</div>
          </div>

          <div className="bg-white/10 rounded-sm p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-200">
              <span>Purata Masa Proses</span>
              <Clock className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-sky-300 mt-1 font-mono">{avgDaysUsed} Hari</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Penjimatan 9.8 Hari drpd Sasaran</div>
          </div>

          <div className="bg-white/10 rounded-sm p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-200">
              <span>Semakan SmartCheck AI</span>
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gold-300 mt-1 font-mono">&lt; 0.2 Hari</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Penilaian automatik serta-merta</div>
          </div>

          <div className="bg-white/10 rounded-sm p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-200">
              <span>Kredibiliti Pegawai</span>
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1">100% Pantas</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Semua pegawai patuh SLA</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Tapis Status:</span>
          </span>
          {[
            { key: "ALL", label: `Semua (${DEMO_SLA_APPLICATIONS.length})` },
            { key: "ON_TIME", label: `🟢 Dalam Piagam (${onTimeCount})` },
            { key: "DRAFT", label: "Draf Pemohon (1)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-xs font-bold transition text-xs ${
                selectedStatusFilter === tab.key
                  ? "bg-gov-800 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Pegawai Pemproses:</span>
          <select
            value={selectedOfficerFilter}
            onChange={(e) => setSelectedOfficerFilter(e.target.value)}
            className="rounded-xs border border-slate-300 bg-white p-1 text-xs text-slate-800 focus:outline-hidden"
          >
            <option value="ALL">Semua Pegawai Bertanggungjawab</option>
            <option value="Noor Aini">Pn. Noor Aini (Perancang Bandar)</option>
            <option value="Azman">En. Azman (Pegawai OSC)</option>
            <option value="Faizal">En. Faizal (Pegawai GIS)</option>
          </select>
        </div>
      </div>

      {/* Applications Process Time Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
            <tr>
              <th className="p-3">No. Permohonan & Projek</th>
              <th className="p-3">Pegawai Bertanggungjawab</th>
              <th className="p-3">Pecahan Masa Proses (Hari Bekerja)</th>
              <th className="p-3">Jumlah / Sasaran Piagam</th>
              <th className="p-3">Status Pematuhan</th>
              <th className="p-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredApps.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/90 transition">
                  {/* Application Column */}
                  <td className="p-3 max-w-xs">
                    <div className="font-mono font-bold text-gov-800">{app.applicationNo}</div>
                    <div className="font-semibold text-slate-900 line-clamp-1 text-[11px] mt-0.5">{app.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Mukim {app.mukim} • {app.lotNo} • Diterima: {app.receivedDate}
                    </div>
                  </td>

                  {/* Officer Column */}
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gov-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {app.assignedOfficer.avatarInitials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-[11px]">{app.assignedOfficer.name}</div>
                        <div className="text-[10px] text-slate-500">{app.assignedOfficer.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Processing Stage Breakdown Visual */}
                  <td className="p-3 min-w-[200px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
                        <span>Dokumen: <b>{app.stageBreakdown.documentCheckDays}h</b></span>
                        <span>AI: <b>{app.stageBreakdown.smartCheckAiDays}h</b></span>
                        <span>Ulasan: <b>{app.stageBreakdown.officerReviewDays}h</b></span>
                      </div>
                      {/* Segmented Timeline Bar */}
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
                        <div
                          style={{ width: `${(app.stageBreakdown.documentCheckDays / 14) * 100}%` }}
                          className="bg-amber-400"
                          title={`Semakan Dokumen: ${app.stageBreakdown.documentCheckDays} hari`}
                        />
                        <div
                          style={{ width: `${(app.stageBreakdown.smartCheckAiDays / 14) * 100}%` }}
                          className="bg-purple-500"
                          title={`SmartCheck AI: ${app.stageBreakdown.smartCheckAiDays} hari`}
                        />
                        <div
                          style={{ width: `${(app.stageBreakdown.officerReviewDays / 14) * 100}%` }}
                          className="bg-blue-600"
                          title={`Ulasan Pegawai: ${app.stageBreakdown.officerReviewDays} hari`}
                        />
                        <div
                          style={{ width: `${(app.stageBreakdown.finalVerificationDays / 14) * 100}%` }}
                          className="bg-emerald-500"
                          title={`Pengesahan Akhir: ${app.stageBreakdown.finalVerificationDays} hari`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Total Days vs Target SLA */}
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {app.daysUsed.toFixed(1)} / {app.slaTargetDays} Hari
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {app.slaComplianceStatus === "ON_TIME"
                        ? `Baki ${(app.slaTargetDays - app.daysUsed).toFixed(1)} Hari`
                        : "Selesai / Draf"}
                    </div>
                  </td>

                  {/* SLA Badge & Remarks */}
                  <td className="p-3">
                    <div>{getSlaBadge(app.slaComplianceStatus, app.daysUsed, app.slaTargetDays)}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-1">{app.performanceRemarks}</div>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveModalApp(app)}
                        className="rounded-xs border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                      >
                        <Info className="h-3 w-3 text-blue-600" />
                        <span>Log Masa</span>
                      </button>
                      <Link href={`/applications/${app.id}/smartcheck`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gov-600 text-gov-800 text-[11px] px-2 py-1 hover:bg-gov-50"
                        >
                          <span>SmartCheck</span>
                          <ArrowRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Card Footer Legend & Guidelines */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Petunjuk Garis Masa:</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> Semakan Dokumen (&le;3H)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" /> Enjin SmartCheck AI (&le;1H)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" /> Ulasan Pegawai (&le;7H)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Pengesahan (&le;3H)
          </span>
        </div>

        <div className="font-semibold text-gov-800">
          Standard Sasaran Piagam: OSC 3.0 Plus (Kementerian Perumahan & Kerajaan Tempatan)
        </div>
      </div>

      {/* Detail Modal for Selected Application SLA Time Logs */}
      {activeModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-gov-800">{activeModalApp.applicationNo}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Audit Log Masa & Kredibiliti Pemprosesan</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalApp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="rounded-sm bg-slate-50 p-3 border border-slate-200">
                <div className="font-bold text-slate-900">{activeModalApp.title}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Pegawai Bertanggungjawab: <b>{activeModalApp.assignedOfficer.name}</b> ({activeModalApp.assignedOfficer.role})
                </div>
              </div>

              {/* Stage by stage detailed logs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-xs bg-amber-50 border border-amber-200">
                  <span>1. Semakan Dokumen & Format Wajib:</span>
                  <span className="font-bold font-mono text-amber-900">
                    {activeModalApp.stageBreakdown.documentCheckDays} Hari (Sasaran: &le;3H)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xs bg-purple-50 border border-purple-200">
                  <span>2. Pengekstrakan LCP & SmartCheck AI:</span>
                  <span className="font-bold font-mono text-purple-900">
                    {activeModalApp.stageBreakdown.smartCheckAiDays} Hari (Sasaran: &le;1H)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xs bg-blue-50 border border-blue-200">
                  <span>3. Penilaian Teknikal & Isu Pegawai:</span>
                  <span className="font-bold font-mono text-blue-900">
                    {activeModalApp.stageBreakdown.officerReviewDays} Hari (Sasaran: &le;7H)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xs bg-emerald-50 border border-emerald-200">
                  <span>4. Pengesahan Akhir & Laporan PDF:</span>
                  <span className="font-bold font-mono text-emerald-900">
                    {activeModalApp.stageBreakdown.finalVerificationDays} Hari (Sasaran: &le;3H)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-sm bg-slate-900 text-white font-mono font-bold">
                <span>JUMLAH MASA DIPROSES:</span>
                <span className="text-emerald-300">{activeModalApp.daysUsed.toFixed(1)} / {activeModalApp.slaTargetDays} Hari</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModalApp(null)}
                className="text-xs"
              >
                Tutup
              </Button>
              <Link href={`/applications/${activeModalApp.id}`}>
                <Button variant="primary" size="sm" className="bg-gov-800 text-xs">
                  Buka Permohonan Penuh ↗
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
