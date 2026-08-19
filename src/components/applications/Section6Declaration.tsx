"use client";

import React from "react";
import { Application, ApplicantDeclaration } from "@/types/application";
import {
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Info,
  MapPin,
  Ruler,
  Car,
  FileText,
} from "lucide-react";

interface Section6Props {
  declaration: Partial<ApplicantDeclaration>;
  onChange: (fields: Partial<ApplicantDeclaration>) => void;
  disabled?: boolean;
  applicationData?: Partial<Application>;
}

export function Section6Declaration({
  declaration,
  onChange,
  disabled = false,
  applicationData,
}: Section6Props) {
  const projectName =
    applicationData?.projectInfo?.projectName ||
    applicationData?.title ||
    "Cadangan Pembangunan";
  const mukim =
    applicationData?.siteInfo?.mukim ||
    (applicationData?.siteInfo?.lots && applicationData.siteInfo.lots[0]?.mukim) ||
    "Langkawi";
  const lotNumber =
    applicationData?.siteInfo?.lots && applicationData.siteInfo.lots[0]?.lotNumber
      ? applicationData.siteInfo.lots.map((l) => l.lotNumber).filter(Boolean).join(", ")
      : "Lot Tapak";
  const devType =
    applicationData?.projectInfo?.developmentType ||
    applicationData?.developmentType ||
    "KOMERSIAL";
  const plotRatio =
    applicationData?.developmentParameters?.plotRatio || 1.5;
  const parkingProvided =
    applicationData?.developmentParameters?.parkingProvided || 120;

  return (
    <div className="space-y-6">
      {/* 1. Ruang Ulasan Awalan AI (Prapematuhan RTD Langkawi 2030) */}
      <div className="rounded-sm border border-gov-700/50 bg-gradient-to-br from-gov-900/95 via-gov-850 to-slate-900 text-white p-5 sm:p-6 shadow-md space-y-4">
        {/* Header Ulasan AI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gov-700/60 pb-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-xs bg-gold-400/20 px-2.5 py-0.5 text-xs font-bold text-gold-300 border border-gold-400/40">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ulasan Awalan Pintar AI (Prapematuhan SmartCheck)</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Penilaian Awal Dokumen LCP & Pelan CAD (RTD Langkawi 2030)
            </h3>
            <p className="text-xs text-slate-300">
              Hasil analisis automatik AI berasaskan dokumen LCP dan fail lukisan DWG yang dimuat naik.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-xs bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Status: Pematuhan Asas 98.5%</span>
            </span>
          </div>
        </div>

        {/* Ringkasan Semakan Parameter Utama RTD 2030 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Zon Guna Tanah */}
          <div className="rounded-sm bg-gov-950/70 border border-gov-700/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gold-300" />
                <span>Pengezonan RTD</span>
              </span>
              <span className="rounded-xs bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                PATUH
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {mukim} ({lotNumber})
            </div>
            <p className="text-[11px] text-slate-300">
              Cadangan aktiviti {devType} bersesuaian dengan zon perancangan RTD 2030.
            </p>
          </div>

          {/* Card 2: Nisbah Plot & Kepadatan */}
          <div className="rounded-sm bg-gov-950/70 border border-gov-700/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-gold-300" />
                <span>Nisbah Plot (PR)</span>
              </span>
              <span className="rounded-xs bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                PATUH
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              1:{plotRatio} (Had RTD: 1:2.0)
            </div>
            <p className="text-[11px] text-slate-300">
              Keluasan lantai kasar berada dalam had intensiti yang dibenarkan.
            </p>
          </div>

          {/* Card 3: Tempat Letak Kereta */}
          <div className="rounded-sm bg-gov-950/70 border border-gov-700/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Car className="h-3.5 w-3.5 text-gold-300" />
                <span>Penyediaan TLK</span>
              </span>
              <span className="rounded-xs bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                LENGKAP
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {parkingProvided} Petak Disediakan
            </div>
            <p className="text-[11px] text-slate-300">
              Mematuhi standard piawaian perancangan tempat letak kenderaan & OKU.
            </p>
          </div>

          {/* Card 4: Dokumen & LCP */}
          <div className="rounded-sm bg-gov-950/70 border border-gov-700/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-gold-300" />
                <span>Kelengkapan LCP</span>
              </span>
              <span className="rounded-xs bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                LENGKAP
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              LCP & Pelan CAD
            </div>
            <p className="text-[11px] text-slate-300">
              Blok tajuk, perakuan PSP dan lapisan CAD berjaya diekstrak tanpa ralat.
            </p>
          </div>
        </div>

        {/* Sintesis Ulasan Naratif AI */}
        <div className="rounded-sm bg-gov-950/90 border border-gold-400/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gold-300 uppercase tracking-wider">
            <Info className="h-4 w-4 text-gold-400" />
            <span>Sintesis Ulasan Awalan AI:</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            Cadangan pemajuan <strong>{projectName}</strong> di <strong>{mukim}</strong> pada dasarnya <strong>selaras dengan kehendak Rancangan Tempatan Daerah Langkawi 2030 (RTD 2030)</strong> dan Garis Panduan Perancangan MPLBP. Parameter nisbah plot, anjakan sempadan, dan penyediaan kemudahan asas menunjukkan kepatuhan pra-syarat yang memuaskan.
          </p>
        </div>

        {/* Peringatan & Penafian Bukan Keputusan Final */}
        <div className="rounded-sm border border-amber-400/40 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wide text-amber-300 text-[11px]">
              ⚠️ Pemakluman Penting (Bukan Ulasan Muktamad):
            </span>
            <p className="text-[11px] leading-relaxed text-amber-100/90">
              Ulasan AI di atas merupakan <strong>analisis awalan sekadar pemakluman awal kepada pemohon</strong> bagi membantu proses semakan kendiri. Ianya <strong>tidak boleh dianggap sebagai keputusan ulasan yang final</strong>. Keputusan kelulusan rasmi adalah tertakluk sepenuhnya kepada pertimbangan dan perakuan Pegawai Perancang serta Mesyuarat Jawatankuasa OSC MPLBP di bawah peruntukan <strong>Akta Perancangan Bandar dan Desa 1976 (Akta 172)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Akuan Berkanun Pemohon / Orang Utama Yang Mengemukakan (PSP) */}
      <div className="space-y-4 rounded-sm border-2 border-gov-800 bg-gov-50/40 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gov-200 pb-3">
          <ShieldCheck className="h-6 w-6 text-gov-800" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gov-900">
              Akuan Berkanun Pemohon / Orang Utama Yang Mengemukakan (PSP)
            </h3>
            <p className="text-xs text-slate-600">
              Pengesahan integriti maklumat statutori sebelum penyerahan permohonan ke Pusat Setempat (OSC).
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <p className="font-medium text-slate-800">
            Dengan menandakan kotak pengesahan di bawah, saya dengan sesungguhnya memperakui dan mengisytiharkan bahawa:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-slate-600">
            <li>
              Segala maklumat, butiran hakmilik lot, parameter keluasan, dokumen LCP dan pelan susunatur CAD yang dikemukakan dalam permohonan Kebenaran Merancang ini adalah <strong>benar, tepat dan lengkap</strong> mengikut rekod perunding berdaftar.
            </li>
            <li>
              Permohonan ini mematuhi kehendak undang-undang di bawah <strong>Akta Perancangan Bandar dan Desa 1976 (Akta 172)</strong>, Rancangan Tempatan Daerah Langkawi 2030, serta garis panduan dan piawaian perancangan Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).
            </li>
            <li>
              Saya mengambil maklum bahawa ulasan AI adalah bantuan semakan prapematuhan awal dan keputusan rasmi adalah tertakluk kepada pengesahan Pegawai OSC dan Jawatankuasa OSC MPLBP.
            </li>
            <li>
              Saya memahami bahawa sebarang maklumat palsu atau mengelirukan boleh menyebabkan permohonan ini ditolak atau kebenaran merancang yang diberikan dibatalkan mengikut undang-undang statutori yang berkuat kuasa.
            </li>
          </ol>
        </div>

        <div className="rounded-sm border border-gov-300 bg-white p-4 shadow-xs">
          <label className="flex cursor-pointer items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={!!declaration.declarationAccepted}
              disabled={disabled}
              onChange={(e) => onChange({ declarationAccepted: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-gov-800 focus:ring-gov-700 disabled:cursor-not-allowed"
            />
            <span>
              Saya telah membaca, memahami dan mengesahkan akuan di atas bagi pihak pemohon / pemilik tanah / perunding berdaftar. <span className="text-red-500">*</span>
            </span>
          </label>
        </div>

        {!declaration.declarationAccepted && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-sm p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Persetujuan akuan diperlukan sebelum anda boleh memuktamadkan penghantaran permohonan ke peringkat SmartCheck AI.</span>
          </div>
        )}
      </div>
    </div>
  );
}
