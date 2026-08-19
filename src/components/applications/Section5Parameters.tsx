import React from "react";
import { DevelopmentParameters, DevelopmentType } from "@/types/application";

interface Section5Props {
  developmentType: DevelopmentType;
  parameters: Partial<DevelopmentParameters>;
  onChange: (fields: Partial<DevelopmentParameters>) => void;
  disabled?: boolean;
}

export function Section5Parameters({
  developmentType,
  parameters,
  onChange,
  disabled = false,
}: Section5Props) {
  const isHotel = developmentType === "HOTEL";
  const isHousing = developmentType === "HOUSING";
  const isCommercial = developmentType === "COMMERCIAL" || developmentType === "MIXED_DEVELOPMENT";

  const handleNumChange = (field: keyof DevelopmentParameters, val: string) => {
    const parsed = val === "" ? null : parseFloat(val);
    onChange({ [field]: parsed, source: "APPLICANT" });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold text-slate-800">5. Parameter Pembangunan & Spesifikasi Ruang</h3>
        <p className="text-xs text-slate-500">
          Parameter fizikal cadangan bagi penilaian kepatuhan nisbah plot, anjakan bangunan dan penyediaan tempat letak kereta.
        </p>
      </div>

      {/* 5A. Unit Pembangunan & Bilik */}
      <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          5A. Unit / Bilik Pembangunan
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Jumlah Keseluruhan Unit
            </label>
            <input
              type="number"
              value={parameters.totalDevelopmentUnits ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("totalDevelopmentUnits", e.target.value)}
              placeholder="Contoh: 120"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          {(isHousing || (!isHotel && !isCommercial)) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Jumlah Unit Kediaman
              </label>
              <input
                type="number"
                value={parameters.residentialUnits ?? ""}
                disabled={disabled}
                onChange={(e) => handleNumChange("residentialUnits", e.target.value)}
                placeholder="Contoh: 100"
                className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
              />
            </div>
          )}

          {(isHotel || isCommercial) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Jumlah Bilik Hotel / Resort
              </label>
              <input
                type="number"
                value={parameters.hotelRooms ?? ""}
                disabled={disabled}
                onChange={(e) => handleNumChange("hotelRooms", e.target.value)}
                placeholder="Contoh: 85"
                className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5B. Keluasan Lantai & Jejak Bangunan */}
      <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          5B. Keluasan Lantai, Ketinggian & Nisbah Plot
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Lantai Kasar (GFA - m²)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.grossFloorAreaSqm ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("grossFloorAreaSqm", e.target.value)}
              placeholder="Contoh: 8500.5"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Lantai Komersial (m²)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.commercialFloorAreaSqm ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("commercialFloorAreaSqm", e.target.value)}
              placeholder="Contoh: 3200"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Jejak Bangunan (Plinth - m²)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.buildingFootprintSqm ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("buildingFootprintSqm", e.target.value)}
              placeholder="Contoh: 2100"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Bilangan Blok Bangunan
            </label>
            <input
              type="number"
              value={parameters.numberOfBlocks ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("numberOfBlocks", e.target.value)}
              placeholder="Contoh: 2"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Ketinggian Maksimum (Tingkat)
            </label>
            <input
              type="number"
              value={parameters.maximumFloors ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("maximumFloors", e.target.value)}
              placeholder="Contoh: 6"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Ketinggian Maksimum Bangunan (Meter)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.maximumBuildingHeightM ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("maximumBuildingHeightM", e.target.value)}
              placeholder="Contoh: 24.5"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nisbah Plot Dicadangkan
            </label>
            <input
              type="number"
              step="any"
              value={parameters.plotRatio ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("plotRatio", e.target.value)}
              placeholder="Contoh: 1.8"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Liputan Tapak (% Plinth Coverage)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.siteCoveragePercent ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("siteCoveragePercent", e.target.value)}
              placeholder="Contoh: 55"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 5C. Tempat Letak Kenderaan & Kawasan Lapang */}
      <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          5C. Tempat Letak Kenderaan & Kawasan Lapang
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Petak Kereta Disediakan
            </label>
            <input
              type="number"
              value={parameters.parkingProvided ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("parkingProvided", e.target.value)}
              placeholder="Contoh: 150"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Petak Motosikal Disediakan
            </label>
            <input
              type="number"
              value={parameters.motorcycleParkingProvided ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("motorcycleParkingProvided", e.target.value)}
              placeholder="Contoh: 40"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Petak OKU Disediakan
            </label>
            <input
              type="number"
              value={parameters.disabledParkingProvided ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("disabledParkingProvided", e.target.value)}
              placeholder="Contoh: 4"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Keluasan Kawasan Lapang (m²)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.openSpaceAreaSqm ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("openSpaceAreaSqm", e.target.value)}
              placeholder="Contoh: 1200"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Peratusan Kawasan Lapang (%)
            </label>
            <input
              type="number"
              step="any"
              value={parameters.openSpacePercent ?? ""}
              disabled={disabled}
              onChange={(e) => handleNumChange("openSpacePercent", e.target.value)}
              placeholder="Contoh: 10"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
