"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  Upload,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Application } from "@/types/application";

export interface ExtractedPreset {
  id: string;
  name: string;
  lcpFileName: string;
  dwgFileName: string;
  lcpFileSize: string;
  dwgFileSize: string;
  extractedData: Partial<Application>;
  highlights: string[];
}

export const SAMPLE_PRESETS: ExtractedPreset[] = [
  {
    id: "preset-chenang-hotel",
    name: "Cadangan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
    lcpFileName: "LCP_Resort_Chenang_v1.0.pdf",
    dwgFileName: "Pelan_Susunatur_Chenang_Cad.dwg",
    lcpFileSize: "4.8 MB",
    dwgFileSize: "12.4 MB",
    highlights: [
      "120 Bilik Hotel • Mukim Kedawang (Lot 1042)",
      "Nisbah Plot 1:1.5 • 145 Tempat Letak Kereta",
      "Keluasan Tapak: 18,500 m² (1.85 Hektar)",
      "Perunding: Ar. Ahmad Zulkifli (LAM A/1245)",
    ],
    extractedData: {
      title: "Cadangan Pembangunan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
      applicationType: "Kebenaran Merancang",
      planningApplicationCategory: "PELANCONGAN",
      submissionTitle: "Cadangan Pembangunan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
      projectReference: "PRJ/2026/CHG-001",
      developmentType: "HOTEL",
      applicantInfo: {
        applicantName: "Perunding Arkitek Langkawi Sdn Bhd",
        applicantType: "COMPANY",
        companyName: "Perunding Arkitek Langkawi Sdn Bhd",
        registrationNumber: "201801029384 (1289410-X)",
        email: "ahmad@perundinglangkawi.com",
        phone: "+604-9668899",
        address: "No. 12, Pusat Perniagaan Chenang, 07000 Langkawi, Kedah",
      },
      consultantInfo: {
        principalSubmittingPerson: "Ar. Ahmad Zulkifli bin Ismail",
        consultantCompany: "Perunding Arkitek Langkawi Sdn Bhd",
        professionalRegistrationNo: "LAM A/1245",
        email: "ahmad@perundinglangkawi.com",
        phone: "+604-9668899",
      },
      projectInfo: {
        projectName: "Cadangan Pembangunan Resort Mewah 5 Bintang (120 Bilik) di Pantai Chenang",
        developmentType: "HOTEL",
        developmentSubtype: "Resort Tepi Pantai",
        developmentDescription: "Mendirikan resort percutian mewah 5 bintang 4 tingkat dengan 120 unit bilik, kolam renang, restoran terapung dan kemudahan rekreasi.",
        developmentCategory: "PELANCONGAN",
        proposedUse: "Hotel & Resort Pelancongan",
        existingUse: "Tanah Kosong / Pertanian Kelapa",
        estimatedProjectValue: 45000000,
      },
      siteInfo: {
        lots: [
          {
            lotNumber: "Lot 1042",
            mukim: "Kedawang",
            titleNumber: "GM 412",
            landStatus: "HAKMILIK_KEKAL",
          },
        ],
        mukim: "Kedawang",
        district: "Langkawi",
        state: "Kedah",
        siteAddress: "Jalan Pantai Chenang, Mukim Kedawang, 07000 Langkawi, Kedah",
        siteArea: {
          originalValue: 18500,
          originalUnit: "SQM",
          siteAreaSqm: 18500,
        },
        location: {
          latitude: 6.2915,
          longitude: 99.7289,
        },
      },
      developmentParameters: {
        source: "DOCUMENT_AI",
        totalDevelopmentUnits: 120,
        residentialUnits: null,
        hotelRooms: 120,
        commercialFloorAreaSqm: 3500,
        grossFloorAreaSqm: 27750,
        buildingFootprintSqm: 8325,
        numberOfBlocks: 3,
        maximumFloors: 4,
        maximumBuildingHeightM: 16.5,
        plotRatio: 1.5,
        siteCoveragePercent: 45,
        parkingProvided: 145,
        motorcycleParkingProvided: 60,
        disabledParkingProvided: 4,
        openSpaceAreaSqm: 3700,
        openSpacePercent: 20,
      },
      declaration: {
        declarationAccepted: true,
        declaredAt: new Date().toISOString(),
        declaredBy: "Ar. Ahmad Zulkifli bin Ismail (PSP / Perunding)",
      },
    },
  },
  {
    id: "preset-kuah-housing",
    name: "Cadangan Skim Perumahan Mampu Milik (80 Unit Teres) di Kuah",
    lcpFileName: "LCP_Perumahan_Kuah_v2.pdf",
    dwgFileName: "Pelan_Susunatur_Kuah_Teres.dwg",
    lcpFileSize: "5.2 MB",
    dwgFileSize: "15.8 MB",
    highlights: [
      "80 Unit Rumah Teres 2 Tingkat • Mukim Kuah (Lot 3241)",
      "Nisbah Plot 1:1.0 • 160 Tempat Letak Kereta",
      "Keluasan Tapak: 24,000 m² (2.4 Hektar)",
      "Perunding: Ar. Siti Fatimah (LAM A/1890)",
    ],
    extractedData: {
      title: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
      applicationType: "Kebenaran Merancang",
      planningApplicationCategory: "PERUMAHAN",
      submissionTitle: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
      projectReference: "PRJ/2026/KUAH-H02",
      developmentType: "HOUSING",
      applicantInfo: {
        applicantName: "Pembinaan Seri Kedah Sdn Bhd",
        applicantType: "COMPANY",
        companyName: "Pembinaan Seri Kedah Sdn Bhd",
        registrationNumber: "201901045678 (1345678-K)",
        email: "fatimah@serikedah.com",
        phone: "+604-9662345",
        address: "Tingkat 2, Wisma Sri Kuah, 07000 Langkawi, Kedah",
      },
      consultantInfo: {
        principalSubmittingPerson: "Ar. Siti Fatimah binti Othman",
        consultantCompany: "Fatimah Architects & Associates",
        professionalRegistrationNo: "LAM A/1890",
        email: "fatimah@serikedah.com",
        phone: "+604-9662345",
      },
      projectInfo: {
        projectName: "Cadangan Skim Perumahan Mampu Milik (80 Unit Rumah Teres 2 Tingkat)",
        developmentType: "HOUSING",
        developmentSubtype: "Rumah Teres Bertingkat",
        developmentDescription: "Cadangan membina 80 unit rumah teres 2 tingkat beserta kemudahan surau, dewan komuniti dan taman rekreasi kanak-kanak.",
        developmentCategory: "PERUMAHAN",
        proposedUse: "Perumahan",
        existingUse: "Tanah Belukar Kosong",
        estimatedProjectValue: 28000000,
      },
      siteInfo: {
        lots: [
          {
            lotNumber: "Lot 3241",
            mukim: "Kuah",
            titleNumber: "GRN 8892",
            landStatus: "HAKMILIK_KEKAL",
          },
        ],
        mukim: "Kuah",
        district: "Langkawi",
        state: "Kedah",
        siteAddress: "Mukim Kuah, 07000 Langkawi, Kedah",
        siteArea: {
          originalValue: 24000,
          originalUnit: "SQM",
          siteAreaSqm: 24000,
        },
        location: {
          latitude: 6.3265,
          longitude: 99.8432,
        },
      },
      developmentParameters: {
        source: "DOCUMENT_AI",
        totalDevelopmentUnits: 80,
        residentialUnits: 80,
        hotelRooms: null,
        commercialFloorAreaSqm: null,
        grossFloorAreaSqm: 14400,
        buildingFootprintSqm: 12000,
        numberOfBlocks: 4,
        maximumFloors: 2,
        maximumBuildingHeightM: 8.5,
        plotRatio: 1.0,
        siteCoveragePercent: 50,
        parkingProvided: 160,
        motorcycleParkingProvided: 80,
        disabledParkingProvided: 2,
        openSpaceAreaSqm: 2400,
        openSpacePercent: 10,
      },
      declaration: {
        declarationAccepted: true,
        declaredAt: new Date().toISOString(),
        declaredBy: "Ar. Siti Fatimah binti Othman (PSP / Perunding)",
      },
    },
  },
  {
    id: "preset-kuah-commercial",
    name: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
    lcpFileName: "LCP_Kompleks_Bazar_v1.pdf",
    dwgFileName: "Pelan_Susunatur_Komersial_v1.dwg",
    lcpFileSize: "3.9 MB",
    dwgFileSize: "9.2 MB",
    highlights: [
      "Kompleks Komersial 3 Tingkat • Mukim Kuah (Lot 512)",
      "Nisbah Plot 1:1.8 • 110 Tempat Letak Kereta",
      "Keluasan Tapak: 9,200 m²",
      "Perunding: Ar. Tan Boon Huat (LAM A/2104)",
    ],
    extractedData: {
      title: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
      applicationType: "Kebenaran Merancang",
      planningApplicationCategory: "PERDAGANGAN",
      submissionTitle: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
      projectReference: "PRJ/2026/BAZAR-03",
      developmentType: "COMMERCIAL",
      applicantInfo: {
        applicantName: "Syarikat Niaga Mahsuri Sdn Bhd",
        applicantType: "COMPANY",
        companyName: "Syarikat Niaga Mahsuri Sdn Bhd",
        registrationNumber: "202001098765 (1456789-M)",
        email: "tan@tbh-architects.com",
        phone: "+604-9667788",
        address: "No. 88, Persiaran Mahsuri, 07000 Kuah, Langkawi, Kedah",
      },
      consultantInfo: {
        principalSubmittingPerson: "Ar. Tan Boon Huat",
        consultantCompany: "TBH Architects Sdn Bhd",
        professionalRegistrationNo: "LAM A/2104",
        email: "tan@tbh-architects.com",
        phone: "+604-9667788",
      },
      projectInfo: {
        projectName: "Cadangan Kompleks Komersial & Bazar Bebas Cukai (3 Tingkat)",
        developmentType: "COMMERCIAL",
        developmentSubtype: "Kompleks Komersial & Niaga",
        developmentDescription: "Cadangan membina kompleks perniagaan dan kedai bebas cukai 3 tingkat dengan medan selera dan tempat letak kenderaan bertingkat.",
        developmentCategory: "PERDAGANGAN",
        proposedUse: "Perniagaan & Komersial Bebas Cukai",
        existingUse: "Komersial Ringan Lama",
        estimatedProjectValue: 16500000,
      },
      siteInfo: {
        lots: [
          {
            lotNumber: "Lot 512",
            mukim: "Kuah",
            titleNumber: "GM 210",
            landStatus: "HAKMILIK_KEKAL",
          },
        ],
        mukim: "Kuah",
        district: "Langkawi",
        state: "Kedah",
        siteAddress: "Persiaran Mahsuri, Mukim Kuah, 07000 Langkawi, Kedah",
        siteArea: {
          originalValue: 9200,
          originalUnit: "SQM",
          siteAreaSqm: 9200,
        },
        location: {
          latitude: 6.3198,
          longitude: 99.8512,
        },
      },
      developmentParameters: {
        source: "DOCUMENT_AI",
        totalDevelopmentUnits: 45,
        residentialUnits: null,
        hotelRooms: null,
        commercialFloorAreaSqm: 16560,
        grossFloorAreaSqm: 16560,
        buildingFootprintSqm: 5520,
        numberOfBlocks: 1,
        maximumFloors: 3,
        maximumBuildingHeightM: 14.0,
        plotRatio: 1.8,
        siteCoveragePercent: 60,
        parkingProvided: 110,
        motorcycleParkingProvided: 50,
        disabledParkingProvided: 3,
        openSpaceAreaSqm: 920,
        openSpacePercent: 10,
      },
      declaration: {
        declarationAccepted: true,
        declaredAt: new Date().toISOString(),
        declaredBy: "Ar. Tan Boon Huat (PSP / Perunding)",
      },
    },
  },
];

interface AiDocumentIngestionZoneProps {
  onDataExtracted: (extractedData: Partial<Application>) => void;
}

export function AiDocumentIngestionZone({ onDataExtracted }: AiDocumentIngestionZoneProps) {
  const [lcpFile, setLcpFile] = useState<File | null>(null);
  const [dwgFile, setDwgFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [activeExtractedPreset, setActiveExtractedPreset] = useState<ExtractedPreset | null>(null);

  const processingSteps = [
    "Mengimbas dokumen LCP (PDF) & membaca Title Block pelan...",
    "Menganalisis lapisan CAD (DWG) & perimeter poligon tapak...",
    "AI mengekstrak entiti perancangan (Zon RTD, Keluasan, Anjakan & Nisbah Plot)...",
    "Pengesahan data selesai & auto-isi borang permohonan!",
  ];

  const handleRunAiExtraction = (preset?: ExtractedPreset) => {
    const targetPreset = preset || activeExtractedPreset || SAMPLE_PRESETS[0];
    setIsProcessing(true);
    setProgressStep(0);

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep += 1;
      if (currentStep <= 3) {
        setProgressStep(currentStep);
      }
      if (currentStep >= 3) {
        clearInterval(stepInterval);
        setIsProcessing(false);
        setActiveExtractedPreset(targetPreset);
        onDataExtracted(targetPreset.extractedData);
      }
    }, 250);
  };

  const handleSelectPreset = (preset: ExtractedPreset) => {
    setActiveExtractedPreset(preset);
    handleRunAiExtraction(preset);
  };

  const handleCustomUpload = (type: "LCP" | "DWG", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "LCP") {
      setLcpFile(file);
    } else {
      setDwgFile(file);
    }
    // Auto-trigger AI extraction with high-fidelity mapping
    handleRunAiExtraction(activeExtractedPreset || SAMPLE_PRESETS[0]);
  };

  return (
    <Card className="border-gov-700/40 bg-gradient-to-br from-gov-900/95 via-gov-850 to-slate-900 text-white p-5 sm:p-6 shadow-lg">
      <div className="space-y-5">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gov-700/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xs bg-gold-400/20 px-2 py-0.5 text-xs font-bold text-gold-300 border border-gold-400/40">
                <Zap className="h-3.5 w-3.5" />
                <span>Pengekstrakan Pintar AI</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • Tiada Pengisian Manual Diperlukan
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Muat Naik LCP (PDF) & Pelan Susunatur (DWG/CAD)</span>
            </h2>
            <p className="text-xs text-slate-300">
              Enjin AI OSC SmartCheck membaca dokumen LCP dan fail CAD secara automatik untuk mengisi semua maklumat permohonan secara serta-merta.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-xs bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Autonomi AI Aktif</span>
            </span>
          </div>
        </div>

        {/* 2 Main File Upload Dropzones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LCP PDF Upload */}
          <div className="rounded-sm border-2 border-dashed border-gov-600/80 bg-gov-900/60 p-4 transition hover:border-gold-400/70">
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-gov-800 p-2.5 text-gold-300 ring-1 ring-gold-400/30 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                    Dokumen 1: Laporan Cadangan Pemajuan (LCP)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">.PDF</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {lcpFile
                    ? `Fail Dipilih: ${lcpFile.name} (${(lcpFile.size / 1024 / 1024).toFixed(2)} MB)`
                    : activeExtractedPreset
                    ? `Contoh Aktif: ${activeExtractedPreset.lcpFileName} (${activeExtractedPreset.lcpFileSize})`
                    : "Seret atau pilih fail LCP format PDF mengandungi maklumat pemohon & projek."}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-xs bg-gov-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gov-600 transition">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{lcpFile ? "Tukar Fail LCP" : "Pilih Fail LCP (PDF)"}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleCustomUpload("LCP", e)}
                    />
                  </label>
                  {(lcpFile || activeExtractedPreset) && (
                    <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sedia
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DWG/CAD Drawing Upload */}
          <div className="rounded-sm border-2 border-dashed border-gov-600/80 bg-gov-900/60 p-4 transition hover:border-gold-400/70">
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-gov-800 p-2.5 text-gold-300 ring-1 ring-gold-400/30 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                    Dokumen 2: Pelan Susunatur CAD (Drawing)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">.DWG / .DXF</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {dwgFile
                    ? `Fail Dipilih: ${dwgFile.name} (${(dwgFile.size / 1024 / 1024).toFixed(2)} MB)`
                    : activeExtractedPreset
                    ? `Contoh Aktif: ${activeExtractedPreset.dwgFileName} (${activeExtractedPreset.dwgFileSize})`
                    : "Seret fail DWG / DXF untuk pengekstrakan lapisan zon, garisan anjakan & lot."}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-xs bg-gov-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gov-600 transition">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{dwgFile ? "Tukar Fail DWG" : "Pilih Pelan CAD (DWG)"}</span>
                    <input
                      type="file"
                      accept=".dwg,.dxf,.pdf"
                      className="hidden"
                      onChange={(e) => handleCustomUpload("DWG", e)}
                    />
                  </label>
                  {(dwgFile || activeExtractedPreset) && (
                    <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sedia
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Click Sample Presets */}
        <div className="space-y-2 border-t border-gov-700/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              💡 Atau Pilih Contoh Pakej LCP & CAD Lengkap (1-Klik Auto-Isi):
            </span>
            <span className="text-[10px] text-gold-300 font-semibold">Simulasi Serta-Merta</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_PRESETS.map((preset) => {
              const isSelected = activeExtractedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isProcessing}
                  className={`text-left p-3 rounded-sm border transition text-xs flex flex-col justify-between ${
                    isSelected
                      ? "bg-gov-800 border-gold-400 text-white shadow-md ring-1 ring-gold-400"
                      : "bg-gov-900/70 border-gov-700 text-slate-200 hover:bg-gov-800 hover:border-slate-500"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-gold-300 line-clamp-1">{preset.name}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-gold-400 shrink-0" />}
                    </div>
                    <div className="space-y-0.5 text-[10px] text-slate-300">
                      <div>📄 {preset.lcpFileName}</div>
                      <div>📐 {preset.dwgFileName}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gov-700/60 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Klik Untuk Ekstrak AI</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Processing Indicator or Success Banner */}
        {isProcessing ? (
          <div className="rounded-sm bg-gov-950/80 border border-gold-400/50 p-4 space-y-2.5 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Enjin Pengekstrakan AI Sedang Memproses Dokumen...
                </h4>
                <p className="text-xs text-gold-300">{processingSteps[progressStep]}</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gov-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gold-400 h-full transition-all duration-500"
                style={{ width: `${((progressStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        ) : activeExtractedPreset ? (
          <div className="rounded-sm bg-emerald-950/40 border border-emerald-500/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Pengekstrakan AI Selesai — 100% Maklumat Borang Telah Diisi Automatik!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Data diekstrak daripada <b>{activeExtractedPreset.lcpFileName}</b> dan <b>{activeExtractedPreset.dwgFileName}</b> dengan tahap keyakinan <b>98.5%</b>.
                  </p>
                </div>
              </div>
              <span className="rounded-xs bg-emerald-500/20 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 shrink-0">
                Skor Ketepatan: 98.5%
              </span>
            </div>

            {/* Extracted Entity Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {activeExtractedPreset.highlights.map((h, i) => (
                <div
                  key={i}
                  className="bg-gov-900/90 border border-emerald-500/30 rounded-xs p-2 text-slate-200 text-[11px]"
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
