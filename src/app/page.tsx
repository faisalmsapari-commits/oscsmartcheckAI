import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import {
  Cpu,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <AppShell showDisclaimer={false}>
      {/* Official Government Hero Banner */}
      <section className="border-b border-gov-800 bg-gov-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold-400/40 bg-gov-800/80 px-3 py-1 text-xs font-semibold text-gold-300">
                <span>PORTAL RASMI ONE STOP CENTRE (OSC)</span>
                <span className="text-slate-400">•</span>
                <span>MPLBP KEDAH</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                OSC SmartCheck AI
              </h1>
              <p className="text-base font-medium text-slate-200 sm:text-lg">
                Intelligent Planning Compliance & Decision Support System
              </p>

              {/* Required Official Tagline */}
              <div className="pt-1 text-sm font-semibold tracking-wider text-gold-300 sm:text-base">
                Semak Pintar • Lokasi Tepat • Keputusan Diyakini
              </div>

              <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                Sistem sokongan semakan kepatuhan perancangan bersepadu bagi permohonan Kebenaran
                Merancang di bawah bidang kuasa Majlis Perbandaran Langkawi Bandaraya Pelancongan.
                Menilai kepatuhan zon, nisbah plot, anjakan bangunan, dan syarat teknikal secara
                objektif dan berintegriti.
              </p>
            </div>

            {/* Quick Action Box */}
            <div className="w-full shrink-0 rounded-sm border border-gov-700 bg-gov-800/90 p-5 shadow-lg lg:w-80">
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">Akses Pantas</h2>
              <p className="mt-1 text-xs text-slate-300">
                Log masuk untuk memulakan semakan pra-permohonan atau pengesahan teknikal.
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-lg bg-gold-500 py-2.5 text-xs font-bold text-gov-950 shadow-sm transition hover:bg-gold-400"
                >
                  Log Masuk Portal
                </Link>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-lg border border-slate-600 bg-gov-900 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-gov-700 hover:text-white"
                >
                  Papan Pemuka OSC
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="h-3.5 w-3.5 text-gold-300" />
                <span>Pengesahan dwi-faktor & peranan terhad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Prominent Statutory Disclaimer */}
        <DisclaimerBanner variant="warning" />

        {/* Feature Grid / Architectural Pillars */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
              Teras Sistem & Ciri Utama
            </h2>
            <p className="text-xs text-slate-500">
              Prinsip teras pematuhan perancangan berasaskan peraturan deterministik dan kawalan pengesahan manusia.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Semakan Pra-Pematuhan */}
            <Card headerTitle="Semakan Pra-Pematuhan (SmartCheck)">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gov-100 text-gov-800">
                  <Cpu className="h-5 w-5" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Enjin peraturan deterministik menilai parameter permohonan terhadap kehendak RTD
                  Langkawi 2030, anjakan hadapan/tepi/belakang, nisbah plot, dan kepadatan.
                </p>
                <div className="flex items-center text-xs font-semibold text-gov-700">
                  <span>Enjin Peraturan Pelayan</span>
                </div>
              </div>
            </Card>

            {/* Card 2: Penentusahan Spatial & GIS */}
            <Card headerTitle="Penentusahan Spatial & Zon GIS">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gov-100 text-gov-800">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Semakan automatik sempadan lot, zon guna tanah semasa, Kawasan Sensitif Alam
                  Sekitar (KSAS), rizab jalan, dan zon penampan persisiran pantai Langkawi.
                </p>
                <div className="flex items-center text-xs font-semibold text-gov-700">
                  <span>Lapisan Georuang RTD</span>
                </div>
              </div>
            </Card>

            {/* Card 3: Human-in-the-Loop Verification */}
            <Card headerTitle="Pengesahan Pegawai OSC (HITL)">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gov-100 text-gov-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  AI bertindak sebagai pembantu pengekstrakan dokumen. Keputusan rasmi dan ulasan
                  statutori wajib disahkan oleh Pegawai Teknikal OSC MPLBP.
                </p>
                <div className="flex items-center text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  <span>Jaminan Integriti Statutori</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Workflow Overview Table / Section */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
              Aliran Proses Semakan Bersepadu
            </h2>
            <p className="text-xs text-slate-500">
              Tahap pelaksanaan pematuhan perancangan OSC SmartCheck AI.
            </p>
          </div>

          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Peringkat</th>
                    <th className="px-4 py-3">Tindakan Sistem / Pengguna</th>
                    <th className="px-4 py-3">Status Logik</th>
                    <th className="px-4 py-3">Integriti Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="px-4 py-3 font-semibold">1. Penyerahan Dokumen</td>
                    <td className="px-4 py-3">Pemohon memuat naik pelan tapak, CAD & dokumen statutori.</td>
                    <td className="px-4 py-3"><Badge variant="neutral">Draf / Diserah</Badge></td>
                    <td className="px-4 py-3 text-slate-500">Hash SHA-256 dijana</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">2. Pengekstrakan & Pre-Check</td>
                    <td className="px-4 py-3">Enjin mengekstrak jadual keluasan dan menilai peraturan deterministik.</td>
                    <td className="px-4 py-3"><Badge variant="info">Sedang Disemak</Badge></td>
                    <td className="px-4 py-3 text-slate-500">Log Pengiraan Pelayan</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">3. Semakan Pegawai OSC</td>
                    <td className="px-4 py-3">Pegawai OSC meneliti dapatan semakan dan memasukkan ulasan rasmi.</td>
                    <td className="px-4 py-3"><Badge variant="warning">Semakan Pegawai</Badge></td>
                    <td className="px-4 py-3 text-slate-500">Tandatangan Pegawai</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">4. Pengesyoran Mesyuarat</td>
                    <td className="px-4 py-3">Keputusan dikunci dan dibentangkan kepada Jawatankuasa OSC MPLBP.</td>
                    <td className="px-4 py-3"><Badge variant="success">Disahkan / Muktamad</Badge></td>
                    <td className="px-4 py-3 text-slate-500">Rekod Kekal (Read-Only)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
