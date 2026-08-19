import { ApplicationLayoutPlan, LayoutPlanElement } from "@/types/gis";

export interface GenerateLayoutPlanParams {
  applicationId: string;
  lat: number;
  lng: number;
  siteAreaSqm: number;
  lotNo?: string;
  mukim?: string;
  developmentType?: string;
  projectTitle?: string;
}

/**
 * Generates high-fidelity georeferenced CAD Layout Plan for any planning application
 */
export function generateApplicationLayoutPlan(params: GenerateLayoutPlanParams): ApplicationLayoutPlan {
  const {
    applicationId,
    lat,
    lng,
    siteAreaSqm = 20000,
    lotNo = "Lot 145",
    mukim = "Kuah",
    developmentType = "HOUSING",
    projectTitle = "Cadangan Pemajuan",
  } = params;

  // Calculate proportional geo-offset based on site area
  // 1 degree lat approx 111,000m. Scale side of square lot
  const halfSide = Math.sqrt(siteAreaSqm) / 111000 / 2;
  const devTypeUpper = (developmentType || "HOUSING").toUpperCase();

  const elements: LayoutPlanElement[] = [];

  if (devTypeUpper.includes("COMMERCIAL") || devTypeUpper.includes("PERDAGANGAN")) {
    // COMMERCIAL LAYOUT PLAN
    // 1. Main Complex Block
    elements.push({
      id: `${applicationId}-bld-01`,
      name: "Blok A - Kompleks Komersial & Bazar Bebas Cukai",
      category: "BUILDING_BLOCK",
      label: "Blok A (3 Tingkat)",
      color: "#d97706",
      fillColor: "#f59e0b",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.28),
      heightStoreys: 3,
      unitCount: 45,
      details: "Kompleks perniagaan runcit, kedai bebas cukai, dan ruang pameran.",
      coordinates: [
        [lat + halfSide * 0.6, lng - halfSide * 0.8],
        [lat + halfSide * 0.6, lng + halfSide * 0.1],
        [lat + halfSide * 0.1, lng + halfSide * 0.1],
        [lat + halfSide * 0.1, lng - halfSide * 0.8],
      ],
    });

    // 2. Food Court & Tourist Kiosks
    elements.push({
      id: `${applicationId}-bld-02`,
      name: "Blok B - Medan Selera & Kios Terbuka",
      category: "BUILDING_BLOCK",
      label: "Blok B (Medan Selera)",
      color: "#b45309",
      fillColor: "#fbbf24",
      fillOpacity: 0.7,
      areaSqm: Math.round(siteAreaSqm * 0.12),
      heightStoreys: 2,
      unitCount: 20,
      details: "Medan selera warisan dan kios cenderamata terbuka.",
      coordinates: [
        [lat + halfSide * 0.6, lng + halfSide * 0.3],
        [lat + halfSide * 0.6, lng + halfSide * 0.8],
        [lat + halfSide * 0.2, lng + halfSide * 0.8],
        [lat + halfSide * 0.2, lng + halfSide * 0.3],
      ],
    });

    // 3. Open Plaza & Pedestrian Promenade (10% Open space)
    elements.push({
      id: `${applicationId}-open-01`,
      name: "Plaza Utama & Lanskap Pejalan Kaki (11.2%)",
      category: "OPEN_SPACE",
      label: "Plaza Terbuka & Lanskap",
      color: "#059669",
      fillColor: "#10b981",
      fillOpacity: 0.6,
      areaSqm: Math.round(siteAreaSqm * 0.112),
      details: "Dataran plaza rekreasi awam dengan pancutan air dan pokok peneduh.",
      coordinates: [
        [lat + halfSide * 0.05, lng - halfSide * 0.7],
        [lat + halfSide * 0.05, lng + halfSide * 0.7],
        [lat - halfSide * 0.25, lng + halfSide * 0.7],
        [lat - halfSide * 0.25, lng - halfSide * 0.7],
      ],
    });

    // 4. Parking & Bus Bays
    elements.push({
      id: `${applicationId}-prk-01`,
      name: "Zon Tempat Letak Kenderaan & Bas Pelancong",
      category: "PARKING",
      label: "Tempat Letak Kereta / Bas",
      color: "#0284c7",
      fillColor: "#38bdf8",
      fillOpacity: 0.55,
      areaSqm: Math.round(siteAreaSqm * 0.25),
      details: "180 Petak Kereta, 12 Petak OKU, 60 Motosikal, dan 6 Petak Bas Pelancong.",
      coordinates: [
        [lat - halfSide * 0.3, lng - halfSide * 0.85],
        [lat - halfSide * 0.3, lng + halfSide * 0.85],
        [lat - halfSide * 0.75, lng + halfSide * 0.85],
        [lat - halfSide * 0.75, lng - halfSide * 0.85],
      ],
    });

    // 5. Road Network (66' Access & Circulation)
    elements.push({
      id: `${applicationId}-rd-01`,
      name: "Jalan Masuk Utama 66' & Sirkulasi Dua Hala",
      category: "ROAD",
      label: "Jalan Akses 66 Kaki",
      color: "#475569",
      fillColor: "#94a3b8",
      fillOpacity: 0.45,
      areaSqm: Math.round(siteAreaSqm * 0.18),
      details: "Jalan masuk utama bersambung dengan Jalan Persiaran Kuah.",
      coordinates: [
        [lat - halfSide * 0.78, lng - halfSide * 0.95],
        [lat - halfSide * 0.78, lng + halfSide * 0.95],
        [lat - halfSide * 0.95, lng + halfSide * 0.95],
        [lat - halfSide * 0.95, lng - halfSide * 0.95],
      ],
    });

    // 6. Utilities & OSD Detention Pond
    elements.push({
      id: `${applicationId}-utl-01`,
      name: "Kolam Takungan OSD & Pencawang TNB",
      category: "UTILITY",
      label: "OSD & Pencawang TNB",
      color: "#7c3aed",
      fillColor: "#a855f7",
      fillOpacity: 0.65,
      areaSqm: Math.round(siteAreaSqm * 0.05),
      details: "Kolam OSD bawah tanah dan pencawang elektrik kompak TNB.",
      coordinates: [
        [lat + halfSide * 0.65, lng - halfSide * 0.85],
        [lat + halfSide * 0.85, lng - halfSide * 0.85],
        [lat + halfSide * 0.85, lng - halfSide * 0.5],
        [lat + halfSide * 0.65, lng - halfSide * 0.5],
      ],
    });

    // 7. Setback Boundary Lines (Anjakan Hadapan 6m)
    elements.push({
      id: `${applicationId}-stb-01`,
      name: "Garisan Anjakan Pembangunan (Setback Hadapan 6.0m)",
      category: "SETBACK",
      label: "Anjakan 6.0m (Patuh)",
      color: "#e11d48",
      fillColor: "#fda4af",
      fillOpacity: 0.2,
      details: "Garisan anjakan hadapan mematuhi Garis Panduan RTD Langkawi 2030.",
      coordinates: [
        [lat + halfSide * 0.75, lng - halfSide * 0.9],
        [lat + halfSide * 0.75, lng + halfSide * 0.9],
        [lat - halfSide * 0.8, lng + halfSide * 0.9],
        [lat - halfSide * 0.8, lng - halfSide * 0.9],
      ],
    });
  } else if (devTypeUpper.includes("INDUSTRIAL") || devTypeUpper.includes("PERINDUSTRIAN")) {
    // INDUSTRIAL LAYOUT PLAN
    // 1. Main Factory Block
    elements.push({
      id: `${applicationId}-bld-01`,
      name: "Blok Kilang Pemprosesan Utama (12.0m Ketinggian)",
      category: "BUILDING_BLOCK",
      label: "Kilang Pemprosesan",
      color: "#7c2d12",
      fillColor: "#ea580c",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.32),
      heightStoreys: 1,
      details: "Bangunan pemprosesan makanan laut berhawa dingin piawaian HACCP.",
      coordinates: [
        [lat + halfSide * 0.65, lng - halfSide * 0.8],
        [lat + halfSide * 0.65, lng + halfSide * 0.3],
        [lat - halfSide * 0.1, lng + halfSide * 0.3],
        [lat - halfSide * 0.1, lng - halfSide * 0.8],
      ],
    });

    // 2. Cold Storage & Loading Dock
    elements.push({
      id: `${applicationId}-bld-02`,
      name: "Gudang Logistik Sejuk Beku & Loading Dock",
      category: "BUILDING_BLOCK",
      label: "Gudang Sejuk Beku",
      color: "#9a3412",
      fillColor: "#f97316",
      fillOpacity: 0.7,
      areaSqm: Math.round(siteAreaSqm * 0.18),
      heightStoreys: 1,
      details: "Zon muatan treler sejuk beku 12 meter.",
      coordinates: [
        [lat + halfSide * 0.65, lng + halfSide * 0.4],
        [lat + halfSide * 0.65, lng + halfSide * 0.85],
        [lat + halfSide * 0.05, lng + halfSide * 0.85],
        [lat + halfSide * 0.05, lng + halfSide * 0.4],
      ],
    });

    // 3. Green Buffer Zone (20m Industrial Buffer)
    elements.push({
      id: `${applicationId}-open-01`,
      name: "Zon Penampan Hijau Perindustrian (20 Meter)",
      category: "OPEN_SPACE",
      label: "Zon Penampan 20m (12.4%)",
      color: "#047857",
      fillColor: "#10b981",
      fillOpacity: 0.65,
      areaSqm: Math.round(siteAreaSqm * 0.124),
      details: "Zon penampan landskap padat bagi menapis bau dan pencemaran bunyi.",
      coordinates: [
        [lat + halfSide * 0.95, lng - halfSide * 0.95],
        [lat + halfSide * 0.95, lng + halfSide * 0.95],
        [lat + halfSide * 0.75, lng + halfSide * 0.95],
        [lat + halfSide * 0.75, lng - halfSide * 0.95],
      ],
    });

    // 4. Heavy Vehicle Road & Marshalling Yard
    elements.push({
      id: `${applicationId}-rd-01`,
      name: "Laluan Kenderaan Berat 50' & Kawasan Manuver",
      category: "ROAD",
      label: "Laluan Kenderaan Berat",
      color: "#334155",
      fillColor: "#64748b",
      fillOpacity: 0.5,
      areaSqm: Math.round(siteAreaSqm * 0.22),
      details: "Laluan konkrit bertetulang untuk treler kontena 40 kaki.",
      coordinates: [
        [lat - halfSide * 0.15, lng - halfSide * 0.85],
        [lat - halfSide * 0.15, lng + halfSide * 0.85],
        [lat - halfSide * 0.55, lng + halfSide * 0.85],
        [lat - halfSide * 0.55, lng - halfSide * 0.85],
      ],
    });

    // 5. Industrial Effluent STP & OSD
    elements.push({
      id: `${applicationId}-utl-01`,
      name: "Loji Rawatan Kumbahan Industri (STP) & Kolam OSD",
      category: "UTILITY",
      label: "Loji STP & OSD Industri",
      color: "#6b21a8",
      fillColor: "#9333ea",
      fillOpacity: 0.6,
      areaSqm: Math.round(siteAreaSqm * 0.08),
      details: "Sistem rawatan efluen berpusat Standard A Jabatan Alam Sekitar.",
      coordinates: [
        [lat - halfSide * 0.6, lng + halfSide * 0.4],
        [lat - halfSide * 0.6, lng + halfSide * 0.85],
        [lat - halfSide * 0.9, lng + halfSide * 0.85],
        [lat - halfSide * 0.9, lng + halfSide * 0.4],
      ],
    });
  } else if (devTypeUpper.includes("INSTITUTIONAL") || devTypeUpper.includes("INSTITUSI")) {
    // INSTITUTIONAL LAYOUT PLAN
    // 1. Main Gallery & Interactive Pavilion
    elements.push({
      id: `${applicationId}-bld-01`,
      name: "Galeri Geopark Utama & Auditorium Interaktif",
      category: "BUILDING_BLOCK",
      label: "Galeri Geopark Utama",
      color: "#0369a1",
      fillColor: "#0284c7",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.26),
      heightStoreys: 2,
      details: "Pusat interpretasi geologi, biodiversiti, dan auditorium 300 tempat duduk.",
      coordinates: [
        [lat + halfSide * 0.6, lng - halfSide * 0.6],
        [lat + halfSide * 0.6, lng + halfSide * 0.4],
        [lat + halfSide * 0.05, lng + halfSide * 0.4],
        [lat + halfSide * 0.05, lng - halfSide * 0.6],
      ],
    });

    // 2. Botanical Gardens & Open Space (22.5%)
    elements.push({
      id: `${applicationId}-open-01`,
      name: "Taman Botani Geopark & Kolam Refleksi (22.5%)",
      category: "OPEN_SPACE",
      label: "Taman Botani & Kolam Refleksi",
      color: "#059669",
      fillColor: "#10b981",
      fillOpacity: 0.65,
      areaSqm: Math.round(siteAreaSqm * 0.225),
      details: "Taman spesies flora endemik Langkawi dan denai pejalan kaki.",
      coordinates: [
        [lat + halfSide * 0.6, lng + halfSide * 0.45],
        [lat + halfSide * 0.6, lng + halfSide * 0.9],
        [lat - halfSide * 0.4, lng + halfSide * 0.9],
        [lat - halfSide * 0.4, lng + halfSide * 0.45],
      ],
    });

    // 3. Cultural Heritage Workshop
    elements.push({
      id: `${applicationId}-bld-02`,
      name: "Pusat Bengkel Warisan Kraf & Kafe Pelawat",
      category: "BUILDING_BLOCK",
      label: "Pusat Bengkel Kraf",
      color: "#0284c7",
      fillColor: "#38bdf8",
      fillOpacity: 0.7,
      areaSqm: Math.round(siteAreaSqm * 0.12),
      heightStoreys: 1,
      details: "Bengkel batik, anyaman mengkuang, dan galeri jualan komuniti tempatan.",
      coordinates: [
        [lat - halfSide * 0.05, lng - halfSide * 0.75],
        [lat - halfSide * 0.05, lng - halfSide * 0.15],
        [lat - halfSide * 0.45, lng - halfSide * 0.15],
        [lat - halfSide * 0.45, lng - halfSide * 0.75],
      ],
    });

    // 4. Central Parking (Cars & Tourist Coaches)
    elements.push({
      id: `${applicationId}-prk-01`,
      name: "Kawasan Letak Kereta & Bas Pelawat",
      category: "PARKING",
      label: "Tempat Letak Kenderaan",
      color: "#475569",
      fillColor: "#94a3b8",
      fillOpacity: 0.5,
      areaSqm: Math.round(siteAreaSqm * 0.2),
      details: "120 Petak Kereta, 8 Petak OKU, 8 Petak Bas Pelancong.",
      coordinates: [
        [lat - halfSide * 0.5, lng - halfSide * 0.85],
        [lat - halfSide * 0.5, lng + halfSide * 0.4],
        [lat - halfSide * 0.85, lng + halfSide * 0.4],
        [lat - halfSide * 0.85, lng - halfSide * 0.85],
      ],
    });
  } else {
    // HOUSING LAYOUT PLAN (DEFAULT & PERUMAHAN)
    // 1. Terrace Housing Block A
    elements.push({
      id: `${applicationId}-bld-01`,
      name: "Blok A - Rumah Teres 2 Tingkat (Unit 1 - 25)",
      category: "BUILDING_BLOCK",
      label: "Blok A (25 Unit)",
      color: "#1e40af",
      fillColor: "#3b82f6",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.16),
      heightStoreys: 2,
      unitCount: 25,
      details: "25 unit rumah teres 2 tingkat (20' x 70') dengan anjakan hadapan 20 kaki.",
      coordinates: [
        [lat + halfSide * 0.7, lng - halfSide * 0.8],
        [lat + halfSide * 0.7, lng - halfSide * 0.05],
        [lat + halfSide * 0.4, lng - halfSide * 0.05],
        [lat + halfSide * 0.4, lng - halfSide * 0.8],
      ],
    });

    // 2. Terrace Housing Block B
    elements.push({
      id: `${applicationId}-bld-02`,
      name: "Blok B - Rumah Teres 2 Tingkat (Unit 26 - 50)",
      category: "BUILDING_BLOCK",
      label: "Blok B (25 Unit)",
      color: "#1e40af",
      fillColor: "#3b82f6",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.16),
      heightStoreys: 2,
      unitCount: 25,
      details: "25 unit rumah teres 2 tingkat (20' x 70').",
      coordinates: [
        [lat + halfSide * 0.7, lng + halfSide * 0.15],
        [lat + halfSide * 0.7, lng + halfSide * 0.85],
        [lat + halfSide * 0.4, lng + halfSide * 0.85],
        [lat + halfSide * 0.4, lng + halfSide * 0.15],
      ],
    });

    // 3. Terrace Housing Block C
    elements.push({
      id: `${applicationId}-bld-03`,
      name: "Blok C - Rumah Teres 2 Tingkat (Unit 51 - 75)",
      category: "BUILDING_BLOCK",
      label: "Blok C (25 Unit)",
      color: "#1d4ed8",
      fillColor: "#60a5fa",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.16),
      heightStoreys: 2,
      unitCount: 25,
      details: "25 unit rumah teres 2 tingkat (20' x 70').",
      coordinates: [
        [lat + halfSide * 0.15, lng - halfSide * 0.8],
        [lat + halfSide * 0.15, lng - halfSide * 0.05],
        [lat - halfSide * 0.15, lng - halfSide * 0.05],
        [lat - halfSide * 0.15, lng - halfSide * 0.8],
      ],
    });

    // 4. Terrace Housing Block D
    elements.push({
      id: `${applicationId}-bld-04`,
      name: "Blok D - Rumah Teres 2 Tingkat (Unit 76 - 100)",
      category: "BUILDING_BLOCK",
      label: "Blok D (25 Unit)",
      color: "#1d4ed8",
      fillColor: "#60a5fa",
      fillOpacity: 0.75,
      areaSqm: Math.round(siteAreaSqm * 0.16),
      heightStoreys: 2,
      unitCount: 25,
      details: "25 unit rumah teres 2 tingkat (20' x 70').",
      coordinates: [
        [lat + halfSide * 0.15, lng + halfSide * 0.15],
        [lat + halfSide * 0.15, lng + halfSide * 0.85],
        [lat - halfSide * 0.15, lng + halfSide * 0.85],
        [lat - halfSide * 0.15, lng + halfSide * 0.15],
      ],
    });

    // 5. Open Space & Playground (10.8% - Exceeds 10% statutory requirement)
    elements.push({
      id: `${applicationId}-open-01`,
      name: "Kawasan Lapang & Taman Permainan Komuniti (10.8%)",
      category: "OPEN_SPACE",
      label: "Taman Permainan & Rekreasi (10.8%)",
      color: "#059669",
      fillColor: "#10b981",
      fillOpacity: 0.65,
      areaSqm: Math.round(siteAreaSqm * 0.108),
      details: "Kawasan lapang berpusat dilengkapi taman permainan kanak-kanak, gelanggang badminton, dan wakaf rehat.",
      coordinates: [
        [lat - halfSide * 0.25, lng - halfSide * 0.8],
        [lat - halfSide * 0.25, lng - halfSide * 0.05],
        [lat - halfSide * 0.65, lng - halfSide * 0.05],
        [lat - halfSide * 0.65, lng - halfSide * 0.8],
      ],
    });

    // 6. Community Hall & Surau
    elements.push({
      id: `${applicationId}-utl-surau`,
      name: "Surau & Dewan Serbaguna Komuniti",
      category: "UTILITY",
      label: "Surau & Dewan Komuniti",
      color: "#0d9488",
      fillColor: "#14b8a6",
      fillOpacity: 0.7,
      areaSqm: Math.round(siteAreaSqm * 0.05),
      details: "Surau kariah dengan kapasiti 150 jemaah dan tempat letak kereta khusus.",
      coordinates: [
        [lat - halfSide * 0.25, lng + halfSide * 0.15],
        [lat - halfSide * 0.25, lng + halfSide * 0.55],
        [lat - halfSide * 0.65, lng + halfSide * 0.55],
        [lat - halfSide * 0.65, lng + halfSide * 0.15],
      ],
    });

    // 7. TNB Substation & OSD Detention Pond
    elements.push({
      id: `${applicationId}-utl-osd`,
      name: "Kolam Takungan OSD & Pencawang Elektrik TNB",
      category: "UTILITY",
      label: "Kolam OSD & Pencawang TNB",
      color: "#7c3aed",
      fillColor: "#a855f7",
      fillOpacity: 0.65,
      areaSqm: Math.round(siteAreaSqm * 0.06),
      details: "Kolam takungan mesra alam (MSMA) dan pencawang elektrik TNB 11kV.",
      coordinates: [
        [lat - halfSide * 0.25, lng + halfSide * 0.6],
        [lat - halfSide * 0.25, lng + halfSide * 0.85],
        [lat - halfSide * 0.65, lng + halfSide * 0.85],
        [lat - halfSide * 0.65, lng + halfSide * 0.6],
      ],
    });

    // 8. Internal Road Network (40' & 66' Road Reserve)
    elements.push({
      id: `${applicationId}-rd-01`,
      name: "Hierarki Jalan: Jalan Masuk 66' & Jalan Dalaman 40'",
      category: "ROAD",
      label: "Rizab Jalan 40' - 66'",
      color: "#334155",
      fillColor: "#64748b",
      fillOpacity: 0.4,
      areaSqm: Math.round(siteAreaSqm * 0.22),
      details: "Laluan berturap premix dengan longkang tertutup dan laluan pejalan kaki 1.5m.",
      coordinates: [
        [lat - halfSide * 0.72, lng - halfSide * 0.9],
        [lat - halfSide * 0.72, lng + halfSide * 0.9],
        [lat - halfSide * 0.95, lng + halfSide * 0.9],
        [lat - halfSide * 0.95, lng - halfSide * 0.9],
      ],
    });

    // 9. Front/Rear Setback Lines (Anjakan 6.0m Hadapan)
    elements.push({
      id: `${applicationId}-stb-01`,
      name: "Garisan Anjakan Pembangunan (Setback 6.0m Hadapan / 3.0m Belakang)",
      category: "SETBACK",
      label: "Garisan Anjakan (Patuh RTD)",
      color: "#e11d48",
      fillColor: "#fda4af",
      fillOpacity: 0.2,
      details: "Anjakan bangunan disahkan mematuhi peruntukan Seksyen 21A Akta 172.",
      coordinates: [
        [lat + halfSide * 0.85, lng - halfSide * 0.88],
        [lat + halfSide * 0.85, lng + halfSide * 0.88],
        [lat - halfSide * 0.7, lng + halfSide * 0.88],
        [lat - halfSide * 0.7, lng - halfSide * 0.88],
      ],
    });
  }

  const openSpaceEl = elements.find((e) => e.category === "OPEN_SPACE");
  const openSpaceArea = openSpaceEl?.areaSqm || Math.round(siteAreaSqm * 0.105);
  const openSpacePercent = Number(((openSpaceArea / siteAreaSqm) * 100).toFixed(1));

  return {
    applicationId,
    planName: `Pelan Susunatur CAD - ${projectTitle} (${lotNo}, Mukim ${mukim})`,
    drawingNumber: `DWG/KM/${applicationId.replace("app-demo-", "2026/000")}-L01`,
    scale: "1:500",
    architectName: "Arkitek Perancang Utama Sdn Bhd",
    totalUnits: devTypeUpper.includes("HOUSING") ? 100 : devTypeUpper.includes("COMMERCIAL") ? 65 : 1,
    totalFloors: devTypeUpper.includes("COMMERCIAL") ? 3 : 2,
    plotRatio: devTypeUpper.includes("COMMERCIAL") ? 1.8 : 0.8,
    siteCoveragePercent: devTypeUpper.includes("COMMERCIAL") ? 55 : devTypeUpper.includes("INDUSTRIAL") ? 50 : 45,
    openSpacePercent,
    openSpaceAreaSqm: openSpaceArea,
    parkingBays: {
      car: devTypeUpper.includes("COMMERCIAL") ? 180 : 120,
      motorcycle: devTypeUpper.includes("COMMERCIAL") ? 60 : 40,
      oku: devTypeUpper.includes("COMMERCIAL") ? 12 : 6,
      loading: devTypeUpper.includes("INDUSTRIAL") ? 8 : 4,
    },
    elements,
  };
}
