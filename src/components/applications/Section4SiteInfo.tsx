import React, { useState } from "react";
import { SiteInfo, LotDetail, AreaUnit } from "@/types/application";
import { convertToSqm, formatArea } from "@/lib/utils/areaConverter";
import { Plus, Trash2, MapPin, AlertCircle, Info } from "lucide-react";

export const MUKIM_LANGKAWI = [
  "Kuah",
  "Padang Matsirat",
  "Kedawang",
  "Ulu Melaka",
  "Bohor",
  "Ayer Hangat",
] as const;

interface Section4Props {
  siteInfo: Partial<SiteInfo>;
  onChange: (fields: Partial<SiteInfo>) => void;
  disabled?: boolean;
}

export function Section4SiteInfo({
  siteInfo,
  onChange,
  disabled = false,
}: Section4Props) {
  const lots = siteInfo.lots || [];
  const [lotError, setLotError] = useState<string | null>(null);

  const handleAddLot = () => {
    const primaryMukim = siteInfo.mukim || MUKIM_LANGKAWI[0];
    const newLot: LotDetail = {
      lotNumber: "",
      mukim: primaryMukim,
      titleNumber: "",
      landStatus: "HAKMILIK_KEKAL",
    };
    onChange({ lots: [...lots, newLot] });
    setLotError(null);
  };

  const handleRemoveLot = (index: number) => {
    if (lots.length <= 1) {
      setLotError("Sekurang-kurangnya satu lot diperlukan.");
      return;
    }
    const updated = lots.filter((_, i) => i !== index);
    onChange({ lots: updated });
    setLotError(null);
  };

  const handleLotChange = (index: number, field: keyof LotDetail, value: string) => {
    const updated = [...lots];
    updated[index] = { ...updated[index], [field]: value };

    // Check duplicate lot numbers
    if (field === "lotNumber") {
      const lotNumbers = updated.map((l) => l.lotNumber.trim()).filter(Boolean);
      const hasDuplicates = new Set(lotNumbers).size !== lotNumbers.length;
      if (hasDuplicates) {
        setLotError("Amaran: Terdapat nombor lot yang berulang.");
      } else {
        setLotError(null);
      }
    }

    onChange({ lots: updated });
  };

  const handleAreaChange = (valStr: string, unit?: AreaUnit) => {
    const activeUnit = unit || siteInfo.siteArea?.originalUnit || "SQM";
    const numVal = valStr ? parseFloat(valStr) : null;
    const normalized = convertToSqm(numVal, activeUnit);

    onChange({
      siteArea: {
        originalValue: numVal,
        originalUnit: activeUnit,
        siteAreaSqm: normalized,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 4A. Maklumat Tapak & Alamat */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-800">4A. Maklumat Tapak & Lokasi</h3>
          <p className="text-xs text-slate-500">
            Nyatakan lokasi perbandaran, mukim utama dan alamat tapak cadangan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Mukim Utama <span className="text-red-500">*</span>
            </label>
            <select
              value={siteInfo.mukim || "Kuah"}
              disabled={disabled}
              onChange={(e) => onChange({ mukim: e.target.value })}
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            >
              {MUKIM_LANGKAWI.map((m) => (
                <option key={m} value={m}>
                  Mukim {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Daerah
            </label>
            <input
              type="text"
              value={siteInfo.district || "Langkawi"}
              disabled
              className="mt-1 w-full rounded-sm border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Negeri
            </label>
            <input
              type="text"
              value={siteInfo.state || "Kedah"}
              disabled
              className="mt-1 w-full rounded-sm border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">
              Alamat Lengkap Tapak Cadangan
            </label>
            <textarea
              rows={2}
              value={siteInfo.siteAddress || ""}
              disabled={disabled}
              onChange={(e) => onChange({ siteAddress: e.target.value })}
              placeholder="Contoh: Lot 1082 & Lot 1083, Jalan Pantai Cenang, Mukim Kedawang, 07000 Langkawi, Kedah"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 4B. Senarai Lot Tanah Terlibat */}
      <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4B. Senarai Lot / Hakmilik Tanah Terlibat <span className="text-red-500">*</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Permohonan KM boleh merangkumi satu atau lebih lot tanah bersebelahan.
            </p>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleAddLot}
              className="inline-flex items-center gap-1 rounded-sm bg-gov-700 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-gov-800"
            >
              <Plus className="h-3 w-3" />
              <span>Tambah Lot</span>
            </button>
          )}
        </div>

        {lotError && (
          <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{lotError}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-200 text-[11px] font-semibold uppercase text-slate-600">
              <tr>
                <th className="p-2">Bil.</th>
                <th className="p-2">No. Lot / PT <span className="text-red-500">*</span></th>
                <th className="p-2">Mukim <span className="text-red-500">*</span></th>
                <th className="p-2">No. Hakmilik (Geran/GM)</th>
                <th className="p-2">Status Tanah</th>
                {!disabled && <th className="p-2 text-center">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Tiada lot ditambah. Sila klik &quot;Tambah Lot&quot;.
                  </td>
                </tr>
              ) : (
                lots.map((lot, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={lot.lotNumber}
                        disabled={disabled}
                        onChange={(e) => handleLotChange(idx, "lotNumber", e.target.value)}
                        placeholder="Contoh: Lot 1234"
                        className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs focus:border-gov-700 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={lot.mukim}
                        disabled={disabled}
                        onChange={(e) => handleLotChange(idx, "mukim", e.target.value)}
                        className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs focus:border-gov-700 focus:outline-none"
                      >
                        {MUKIM_LANGKAWI.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={lot.titleNumber || ""}
                        disabled={disabled}
                        onChange={(e) => handleLotChange(idx, "titleNumber", e.target.value)}
                        placeholder="Contoh: GM 889"
                        className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs focus:border-gov-700 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={lot.landStatus || ""}
                        disabled={disabled}
                        onChange={(e) => handleLotChange(idx, "landStatus", e.target.value)}
                        placeholder="Contoh: Hakmilik Kekal"
                        className="w-full rounded-sm border border-slate-300 px-2 py-1 text-xs focus:border-gov-700 focus:outline-none"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLot(idx)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Buang Lot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4C. Keluasan Tapak & Penukaran Unit */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-800">4C. Keluasan Tapak Pembangunan</h3>
          <p className="text-xs text-slate-500">
            Keluasan keseluruhan tapak. Sistem akan menormalkan unit ke meter persegi (m²) untuk pengiraan pematuhan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Tapak <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={siteInfo.siteArea?.originalValue ?? ""}
              disabled={disabled}
              onChange={(e) => handleAreaChange(e.target.value)}
              placeholder="Contoh: 1.25"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Unit Keluasan <span className="text-red-500">*</span>
            </label>
            <select
              value={siteInfo.siteArea?.originalUnit || "SQM"}
              disabled={disabled}
              onChange={(e) =>
                handleAreaChange(
                  siteInfo.siteArea?.originalValue?.toString() || "",
                  e.target.value as AreaUnit
                )
              }
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            >
              <option value="SQM">Meter Persegi (m²)</option>
              <option value="HECTARE">Hektar (Ha)</option>
              <option value="ACRE">Ekar (Ac)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Dinormalkan (m²)
            </label>
            <div className="mt-1 flex h-[34px] items-center rounded-sm border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-gov-900">
              {formatArea(siteInfo.siteArea?.siteAreaSqm, "SQM")}
            </div>
          </div>
        </div>
      </div>

      {/* 4D. Koordinat & GIS Placeholder */}
      <div className="space-y-4 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <div className="border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gov-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4D. Titik Koordinat Geografi (Pilihan Semasa Draf)
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Latitud (WGS84)
            </label>
            <input
              type="number"
              step="any"
              value={siteInfo.location?.latitude ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  location: {
                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                    longitude: siteInfo.location?.longitude ?? null,
                  },
                })
              }
              placeholder="Contoh: 6.312345"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Longitud (WGS84)
            </label>
            <input
              type="number"
              step="any"
              value={siteInfo.location?.longitude ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  location: {
                    latitude: siteInfo.location?.latitude ?? null,
                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              placeholder="Contoh: 99.789012"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <Info className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Pemberitahuan GIS:</strong> Pengesahan lokasi geospatial dan semakan lot kadaster
            bersepadu JUPEM akan diaktifkan dalam modul GIS seterusnya.
          </span>
        </div>
      </div>
    </div>
  );
}
