import { NextResponse } from "next/server";
import { getDatasets } from "@/lib/gis/adminService";

export async function GET() {
  try {
    const datasets = await getDatasets();
    const activeDatasets = datasets.filter((d) => d.status === "ACTIVE");

    const layers = [
      {
        layerId: "CADASTRAL",
        name: "Lot Kadaster",
        available: activeDatasets.some((d) => d.datasetType === "CADASTRAL"),
        defaultVisible: true,
        color: "#2563eb",
      },
      {
        layerId: "RTD_ZONING",
        name: "Zon Rancangan Tempatan Daerah (RTD)",
        available: activeDatasets.some((d) => d.datasetType === "RTD_ZONING"),
        defaultVisible: true,
        color: "#9333ea",
      },
      {
        layerId: "ROAD",
        name: "Rangkaian Jalan & Rizab",
        available: activeDatasets.some((d) => d.datasetType === "ROAD" || d.datasetType === "FACILITY"),
        defaultVisible: false,
        color: "#f59e0b",
      },
      {
        layerId: "FACILITY",
        name: "Kemudahan Awam & Infrastruktur",
        available: activeDatasets.some((d) => d.datasetType === "FACILITY"),
        defaultVisible: false,
        color: "#10b981",
      },
    ];

    return NextResponse.json({ layers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ralat memuatkan lapisan GIS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
