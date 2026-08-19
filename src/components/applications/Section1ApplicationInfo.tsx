import React from "react";
import { PlanningApplicationCategory, ALLOWED_PLANNING_CATEGORIES } from "@/types/application";

interface Section1Props {
  applicationType: string;
  planningApplicationCategory: PlanningApplicationCategory;
  categoryOtherDescription: string | null;
  submissionTitle: string;
  projectReference: string | null;
  onChange: (fields: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function Section1ApplicationInfo({
  applicationType,
  planningApplicationCategory,
  categoryOtherDescription,
  submissionTitle,
  projectReference,
  onChange,
  disabled = false,
}: Section1Props) {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold text-slate-800">1. Maklumat Permohonan Kebenaran Merancang</h3>
        <p className="text-xs text-slate-500">
          Sila pilih kategori permohonan dan masukkan tajuk rasmi penyerahan pelan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Jenis Permohonan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={applicationType || "Kebenaran Merancang"}
            disabled
            className="mt-1 w-full rounded-sm border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
          />
          <p className="mt-0.5 text-[11px] text-slate-500">
            Permohonan Kebenaran Merancang di bawah Seksyen 21, Akta 172.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Kategori Perancangan <span className="text-red-500">*</span>
          </label>
          <select
            value={planningApplicationCategory || "PERDAGANGAN"}
            disabled={disabled}
            onChange={(e) =>
              onChange({ planningApplicationCategory: e.target.value as PlanningApplicationCategory })
            }
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          >
            {ALLOWED_PLANNING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {planningApplicationCategory === "LAIN_LAIN" && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Keterangan Kategori Lain-Lain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={categoryOtherDescription || ""}
              disabled={disabled}
              onChange={(e) => onChange({ categoryOtherDescription: e.target.value })}
              placeholder="Contoh: Pembangunan Kemudahan Maritim / Jeti Pelancongan"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Tajuk Cadangan Permohonan <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={submissionTitle || ""}
            disabled={disabled}
            onChange={(e) => onChange({ submissionTitle: e.target.value, title: e.target.value })}
            placeholder="Cadangan Mendirikan [1 Blok Bangunan Perniagaan dan Hotel 8 Tingkat] di atas [Lot 1234, Mukim Kuah], Daerah Langkawi, Kedah Darul Aman..."
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Rujukan Projek Pemohon / Tetuan (Pilihan)
          </label>
          <input
            type="text"
            value={projectReference || ""}
            disabled={disabled}
            onChange={(e) => onChange({ projectReference: e.target.value })}
            placeholder="Contoh: ARK/2026/LKG-09"
            className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
