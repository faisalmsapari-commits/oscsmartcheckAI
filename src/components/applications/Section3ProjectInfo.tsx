import React from "react";
import { ProjectInfo, DevelopmentType, ALLOWED_DEVELOPMENT_TYPES } from "@/types/application";

interface Section3Props {
  projectInfo: Partial<ProjectInfo>;
  onChange: (fields: Partial<ProjectInfo>) => void;
  disabled?: boolean;
}

export function Section3ProjectInfo({
  projectInfo,
  onChange,
  disabled = false,
}: Section3Props) {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold text-slate-800">3. Maklumat Projek & Pembangunan</h3>
        <p className="text-xs text-slate-500">
          Nyatakan perincian jenis guna tanah, perihalan cadangan dan anggaran kos projek.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Nama / Tajuk Projek <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.projectName || ""}
            disabled={disabled}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="Contoh: Cadangan Pembangunan Pusat Komersial dan Hotel Butik Langkawi"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Jenis Pembangunan Utama <span className="text-red-500">*</span>
          </label>
          <select
            value={projectInfo.developmentType || "COMMERCIAL"}
            disabled={disabled}
            onChange={(e) => onChange({ developmentType: e.target.value as DevelopmentType })}
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          >
            {ALLOWED_DEVELOPMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Sub-Jenis Pembangunan (Pilihan)
          </label>
          <input
            type="text"
            value={projectInfo.developmentSubtype || ""}
            disabled={disabled}
            onChange={(e) => onChange({ developmentSubtype: e.target.value })}
            placeholder="Contoh: HOTEL, RESORT, RUMAH TERES, PANGSAPURI SERVIS"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Guna Tanah Dicadangkan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.proposedUse || ""}
            disabled={disabled}
            onChange={(e) => onChange({ proposedUse: e.target.value })}
            placeholder="Contoh: Perniagaan Runcit, Restoran & Hotel (80 Bilik)"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Guna Tanah Semasa Tapak
          </label>
          <input
            type="text"
            value={projectInfo.existingUse || ""}
            disabled={disabled}
            onChange={(e) => onChange({ existingUse: e.target.value })}
            placeholder="Contoh: Tanah Kosong / Pertanian Kelapa Sawit"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Anggaran Nilai Pembangunan Kasar (GDV - RM)
          </label>
          <input
            type="number"
            value={projectInfo.estimatedProjectValue ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                estimatedProjectValue: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            placeholder="Contoh: 15000000"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Perihalan Ringkas Cadangan Pembangunan
          </label>
          <textarea
            rows={3}
            value={projectInfo.developmentDescription || ""}
            disabled={disabled}
            onChange={(e) => onChange({ developmentDescription: e.target.value })}
            placeholder="Huraikan konsep pembangunan, fasa pelaksanaan dan ciri-ciri utama kemudahan yang dicadangkan..."
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
