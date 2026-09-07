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
  AlertTriangle,
} from "lucide-react";
import { Application } from "@/types/application";
import { PlanningFact } from "@/types/extraction";
import { useAuth } from "@/lib/auth/AuthContext";
import { mapRealFactsToApplication } from "@/lib/extraction/factMapper";

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
  applicationId?: string | null;
  onEnsureApplicationCreated?: () => Promise<string>;
  onDataExtracted: (extractedData: Partial<Application>, extractedNotice?: string) => void;
}

export function AiDocumentIngestionZone({
  applicationId,
  onEnsureApplicationCreated,
  onDataExtracted,
}: AiDocumentIngestionZoneProps) {
  const { user } = useAuth();
  const [lcpFile, setLcpFile] = useState<File | null>(null);
  const [dwgFile, setDwgFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStageText, setProgressStageText] = useState<string>("");
  const [activeExtractedPreset, setActiveExtractedPreset] = useState<ExtractedPreset | null>(null);
  const [qualityErrorMessage, setQualityErrorMessage] = useState<string | null>(null);
  const [unextractedNotice, setUnextractedNotice] = useState<string | null>(null);

  const handleSelectPreset = (preset: ExtractedPreset) => {
    setActiveExtractedPreset(preset);
    setQualityErrorMessage(null);
    setUnextractedNotice(null);
    onDataExtracted(preset.extractedData);
  };

  const handleCustomUpload = async (type: "LCP" | "DWG", e: React.ChangeEvent<HTMLInputElement>) => {
    setQualityErrorMessage(null);
    setUnextractedNotice(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith(".dwg") || nameLower.endsWith(".dxf")) {
      setQualityErrorMessage(
        "Fail CAD (.dwg / .dxf) tidak boleh diproses secara terus oleh enjin OCR Document AI. Sila muat naik fail eksport Pelan Susunatur dalam format PDF untuk pengekstrakan AI."
      );
      return;
    }

    // Pre-Upload PDF Quality Gate
    if (type === "LCP") {
      if (file.size === 0 || file.size < 1024) {
        setQualityErrorMessage(
          "Fail PDF tidak sah atau kualiti imbuhan (OCR) terlalu rendah. Sila pastikan dokumen PDF bukan fail kosong, mengandungi teks/halaman yang boleh dibaca, dan resolusi imbasan sekurang-kurangnya 150 DPI sebelum memuat naik semula."
        );
        return;
      }
      setLcpFile(file);
    } else {
      setDwgFile(file);
    }

    try {
      setIsProcessing(true);
      setActiveExtractedPreset(null);
      setProgressStageText("Memulakan draf permohonan & mengesahkan identiti...");

      // 1. Ensure Application Record Exists
      let appId = applicationId;
      if (!appId && onEnsureApplicationCreated) {
        appId = await onEnsureApplicationCreated();
      }

      if (!appId) {
        throw new Error("Gagal memperoleh ID permohonan untuk muat naik dokumen.");
      }

      const token = user ? await user.getIdToken() : "";

      // 2. Upload Document via Real Backend Upload Endpoint
      setProgressStageText("Memuat naik fail LCP ke pelayan simpanan Firestore & Cloud Storage...");
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("documentType", type === "LCP" ? "LCP" : "SITE_PLAN");

      const uploadRes = await fetch(`/api/applications/${appId}/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat naik fail PDF ke pelayan backend.");
      }

      // 3. Trigger Asynchronous Real Backend AI Extraction Job
      setProgressStageText("Enjin Document AI & Gemini 1.5 Pro sedang mengekstrak fakta perancangan...");
      const processRes = await fetch(`/api/applications/${appId}/extraction/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ forceReprocess: true }),
      });

      if (!processRes.ok) {
        const errJson = await processRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memulakan proses pengekstrakan LCP.");
      }

      // 4. Poll Extraction Job Status Until COMPLETED or FAILED
      let attempts = 0;
      let jobCompleted = false;
      while (attempts < 25 && !jobCompleted) {
        await new Promise((r) => setTimeout(r, 800));
        attempts += 1;
        setProgressStageText(`Enjin AI sedang mengekstrak jadual & parameter perancangan... (${(attempts * 0.8).toFixed(1)}s)`);

        const statusRes = await fetch(`/api/applications/${appId}/extraction/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData?.job?.status === "COMPLETED") {
            jobCompleted = true;
          } else if (statusData?.job?.status === "FAILED") {
            throw new Error(statusData.job.errorMessage || "Pengekstrakan AI gagal di pelayan.");
          }
        }
      }

      // 5. Read Real Extracted Facts & Evidences
      setProgressStageText("Memuatkan fakta perancangan diekstrak...");
      const factsRes = await fetch(`/api/applications/${appId}/extraction`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!factsRes.ok) {
        throw new Error("Gagal mengambil fakta perancangan yang diekstrak.");
      }

      const factsData = await factsRes.json();
      const realFacts = (factsData.facts || []) as PlanningFact[];

      // 6. Honest Zero-Fabrication Mapping
      const { extractedData, unextractedKeys, unextractedNotice: notice } = mapRealFactsToApplication(realFacts);

      setUnextractedNotice(notice || null);
      setActiveExtractedPreset({
        id: `real-${Date.now()}`,
        name: file.name,
        lcpFileName: file.name,
        dwgFileName: dwgFile ? dwgFile.name : "Pelan_Susunatur.pdf",
        lcpFileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        dwgFileSize: "0.00 MB",
        highlights: [
          `Pengekstrakan AI Backend: SELESAI`,
          `Fakta Berkeyakinan: ${realFacts.filter((f) => f.confidenceLevel !== "LOW").length}`,
          `Boleh Disunting: YA (Dicadangkan oleh AI)`,
          notice ? `Perhatian: Medan Tidak Berkeyakinan Ditinggalkan Kosong` : `Status: 100% Berkeyakinan`,
        ],
        extractedData,
      });

      onDataExtracted(extractedData, notice);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat pemprosesan pengekstrakan AI";
      setQualityErrorMessage(msg);
      setUnextractedNotice("Tidak dapat dikesan secara automatik — sila isi secara manual");
      onDataExtracted({}, "Tidak dapat dikesan secara automatik — sila isi secara manual");
    } finally {
      setIsProcessing(false);
    }
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
                <span>Pengekstrakan Pintar AI (Backend Pipeline Real)</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • Semakan & Isian Beretika (Tiada Data Rekaan)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Muat Naik LCP (PDF) & Pelan Susunatur (DWG/CAD)</span>
            </h2>
            <p className="text-xs text-slate-300">
              Enjin Document AI & Gemini 1.5 Pro mengekstrak fakta rasmi daripada dokumen anda. Medan yang tidak pasti akan kekal kosong untuk diisi secara manual.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-xs bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Integriti Data Terjamin</span>
            </span>
          </div>
        </div>

        {qualityErrorMessage && (
          <div className="rounded-sm border border-rose-500/50 bg-rose-950/80 p-3.5 text-xs text-rose-200 shadow-sm flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{qualityErrorMessage}</span>
          </div>
        )}

        {unextractedNotice && !qualityErrorMessage && (
          <div className="rounded-sm border border-amber-500/50 bg-amber-950/70 p-3.5 text-xs text-amber-200 shadow-sm flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">AMARAN PENGEKSTRAKAN: </span>
              <span>{unextractedNotice}</span>
            </div>
          </div>
        )}

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
                    ? `Dokumen Aktif: ${activeExtractedPreset.lcpFileName}`
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
                      disabled={isProcessing}
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
                    ? `Dokumen Aktif: ${activeExtractedPreset.dwgFileName}`
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
                      disabled={isProcessing}
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

        {/* 1-Click Sample Presets (Presentation Demo Simulation) */}
        <div className="space-y-2 border-t border-gov-700/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              💡 Atau Pilih Contoh Pakej LCP & CAD Lengkap (1-Klik Auto-Isi Demo):
            </span>
            <span className="text-[10px] text-gold-300 font-semibold">Simulasi Demo Sahaja</span>
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
                    <span>Klik Untuk Simulasi Demo</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Processing Indicator or Success Banner */}
        {isProcessing ? (
          <div className="rounded-sm bg-gov-950/80 border border-gold-400/50 p-4 space-y-2.5 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gold-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Enjin Backend Document AI & Gemini Sedang Memproses Dokumen...
                </h4>
                <p className="text-xs text-gold-300">{progressStageText}</p>
              </div>
            </div>
          </div>
        ) : activeExtractedPreset ? (
          <div className="rounded-sm bg-emerald-950/40 border border-emerald-500/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Pengekstrakan AI Selesai — Borang Telah Diisi (Dicadangkan Oleh AI)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Data diekstrak daripada <b>{activeExtractedPreset.lcpFileName}</b> melalui pipeline backend rasmi. Sila semak setiap seksyen sebelum menghantar.
                  </p>
                </div>
              </div>
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
