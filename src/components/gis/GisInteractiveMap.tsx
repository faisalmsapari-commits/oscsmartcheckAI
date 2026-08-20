"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { NearbyFeature, RtdIntersectionResult, ApplicationLayoutPlan, LayoutElementCategory } from "@/types/gis";

export interface GisInteractiveMapProps {
  lat: number;
  lng: number;
  lotNo: string;
  mukim: string;
  siteAreaSqm: number;
  projectTitle: string;
  upiCode: string;
  rtdData?: { primaryZone: RtdIntersectionResult | null; zones: RtdIntersectionResult[] } | null;
  bufferFeatures?: NearbyFeature[];
  layoutPlan?: ApplicationLayoutPlan | null;
  visibleLayers: {
    layoutPlan?: boolean;
    cadastral: boolean;
    rtdZoning: boolean;
    features: boolean;
    buffer500m: boolean;
  };
}

export function GisInteractiveMap({
  lat,
  lng,
  lotNo,
  mukim,
  siteAreaSqm,
  projectTitle,
  upiCode,
  rtdData,
  bufferFeatures = [],
  layoutPlan,
  visibleLayers,
}: GisInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [basemapType, setBasemapType] = useState<"SATELLITE" | "STREETS" | "OSM">("SATELLITE");
  const [cadOpacity, setCadOpacity] = useState<number>(0.8);
  const [activeCadCategory, setActiveCadCategory] = useState<"ALL" | LayoutElementCategory>("ALL");
  const [showLegend, setShowLegend] = useState<boolean>(true);

  const layersGroupRef = useRef<{
    baseLayer?: L.TileLayer;
    labelLayer?: L.TileLayer;
    lotPolygon?: L.Polygon;
    rtdPolygons?: L.Polygon[];
    bufferCircle?: L.Circle;
    featureMarkers?: L.Marker[];
    siteMarker?: L.Marker;
    layoutPolygons?: L.Polygon[];
  }>({});

  // 1. Initialize Leaflet Map Instance into State
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths
    // @ts-expect-error Leaflet default icon prototype delete
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Clear any stale leaflet container id from previous mounts
    const container = mapContainerRef.current;
    if ("_leaflet_id" in container) {
      delete (container as unknown as Record<string, unknown>)._leaflet_id;
    }

    let mapInstance: L.Map | null = null;
    try {
      mapInstance = L.map(container, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: true,
      });
      setMap(mapInstance);

      // Force instant dimension sync
      setTimeout(() => {
        try {
          mapInstance?.invalidateSize();
        } catch {
          // ignore
        }
      }, 50);
    } catch (err) {
      console.warn("Leaflet init guard:", err);
    }

    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch {
          // ignore unmount errors
        }
      }
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Reactively Update Center, Tiles, and Vector Layers whenever map or props change
  useEffect(() => {
    if (!map || !mapContainerRef.current) return;

    // Strict guard: ensure map container and panes are properly initialized in DOM
    if (!map.getContainer() || !map.getPanes()?.mapPane) return;

    let isMounted = true;

    try {
      map.setView([lat, lng], map.getZoom() || 17);
      map.invalidateSize();
    } catch (err) {
      console.warn("Leaflet setView guard:", err);
    }

    const t1 = setTimeout(() => {
      if (isMounted && map && map.getContainer()) {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 100);

    const t2 = setTimeout(() => {
      if (isMounted && map && map.getContainer()) {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 400);

    // Remove previous base tile and label layers
    if (layersGroupRef.current.baseLayer) {
      map.removeLayer(layersGroupRef.current.baseLayer);
      layersGroupRef.current.baseLayer = undefined;
    }
    if (layersGroupRef.current.labelLayer) {
      map.removeLayer(layersGroupRef.current.labelLayer);
      layersGroupRef.current.labelLayer = undefined;
    }

    // Add Base Tile Layer
    if (basemapType === "SATELLITE") {
      // High-Resolution World Satellite Imagery (Esri / Maxar)
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        }
      ).addTo(map);
      layersGroupRef.current.baseLayer = satLayer;

      // Add Hybrid Road & Place Names Overlay
      const labelLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          opacity: 0.85,
        }
      ).addTo(map);
      layersGroupRef.current.labelLayer = labelLayer;
    } else if (basemapType === "STREETS") {
      // Clean, High-Contrast Street Maps (CartoDB Voyager)
      const streetLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: ["a", "b", "c", "d"],
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        }
      ).addTo(map);
      layersGroupRef.current.baseLayer = streetLayer;
    } else {
      // Standard OpenStreetMap
      const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      layersGroupRef.current.baseLayer = osmLayer;
    }

    // Clear previous vector layers
    if (layersGroupRef.current.lotPolygon) map.removeLayer(layersGroupRef.current.lotPolygon);
    if (layersGroupRef.current.rtdPolygons) {
      layersGroupRef.current.rtdPolygons.forEach((p) => map.removeLayer(p));
    }
    if (layersGroupRef.current.bufferCircle) map.removeLayer(layersGroupRef.current.bufferCircle);
    if (layersGroupRef.current.featureMarkers) {
      layersGroupRef.current.featureMarkers.forEach((m) => map.removeLayer(m));
    }
    if (layersGroupRef.current.siteMarker) map.removeLayer(layersGroupRef.current.siteMarker);
    if (layersGroupRef.current.layoutPolygons) {
      layersGroupRef.current.layoutPolygons.forEach((p) => map.removeLayer(p));
    }

    // Draw RTD Zoning Polygons
    const rtdPolygons: L.Polygon[] = [];
    if (visibleLayers.rtdZoning) {
      const primaryOffset = 0.0022;
      const primaryBounds: [number, number][] = [
        [lat + primaryOffset, lng - primaryOffset],
        [lat + primaryOffset, lng + primaryOffset * 0.8],
        [lat - primaryOffset, lng + primaryOffset * 0.8],
        [lat - primaryOffset, lng - primaryOffset],
      ];

      const primaryPoly = L.polygon(primaryBounds, {
        color: "#a855f7",
        weight: 2.5,
        fillColor: "#c084fc",
        fillOpacity: 0.22,
        dashArray: "5, 5",
      }).bindTooltip(
        `<b>ZON RTD LANGKAWI 2030</b><br/>${rtdData?.primaryZone?.zoneName || "Zon Pembangunan Pemajuan (85%)"}`,
        { permanent: false }
      );
      primaryPoly.addTo(map);
      rtdPolygons.push(primaryPoly);
    }
    layersGroupRef.current.rtdPolygons = rtdPolygons;

    // Draw 500m Buffer Circle
    if (visibleLayers.buffer500m) {
      const buffer = L.circle([lat, lng], {
        radius: 500,
        color: "#f59e0b",
        weight: 2,
        fillColor: "#fbbf24",
        fillOpacity: 0.12,
        dashArray: "6, 6",
      }).bindTooltip("<b>Zon Penimbal 500 Meter (Radius Analisis)</b>", { sticky: true });
      buffer.addTo(map);
      layersGroupRef.current.bufferCircle = buffer;
    }

    // Draw Cadastral Lot Boundary (MyKadLot JUPEM NDCDB)
    if (visibleLayers.cadastral) {
      const halfSideDeg = Math.sqrt(siteAreaSqm || 20000) / 111000 / 2;
      const lotBounds: [number, number][] = [
        [lat + halfSideDeg * 0.9, lng - halfSideDeg * 1.2],
        [lat + halfSideDeg * 0.9, lng + halfSideDeg * 1.2],
        [lat - halfSideDeg * 0.9, lng + halfSideDeg * 1.2],
        [lat - halfSideDeg * 0.9, lng - halfSideDeg * 1.2],
      ];

      const lotPoly = L.polygon(lotBounds, {
        color: "#1d4ed8",
        weight: 3,
        fillColor: "#3b82f6",
        fillOpacity: visibleLayers.layoutPlan ? 0.15 : 0.35,
      }).bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b style="color: #1e3a8a;">${lotNo.toUpperCase()} (${mukim.toUpperCase()})</b><br/>
          <span>Keluasan Tapak: <b>${siteAreaSqm.toLocaleString()} m²</b></span><br/>
          <span style="font-family: monospace; color: #6b21a8;">UPI: ${upiCode}</span>
        </div>`,
        { permanent: !visibleLayers.layoutPlan, direction: "center" }
      );
      lotPoly.addTo(map);
      layersGroupRef.current.lotPolygon = lotPoly;
    }

    // Draw Application Layout Plan (CAD / DWG Elements Overlay)
    const layoutPolygons: L.Polygon[] = [];
    if (visibleLayers.layoutPlan && layoutPlan && layoutPlan.elements.length > 0) {
      const filteredElements =
        activeCadCategory === "ALL"
          ? layoutPlan.elements
          : layoutPlan.elements.filter((e) => e.category === activeCadCategory);

      filteredElements.forEach((el) => {
        const poly = L.polygon(el.coordinates, {
          color: el.color,
          weight: el.category === "SETBACK" ? 2 : 2.5,
          fillColor: el.fillColor,
          fillOpacity: el.fillOpacity * cadOpacity,
          dashArray: el.category === "SETBACK" ? "4, 4" : undefined,
        });

        // Popup Content
        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; min-width: 200px; padding: 4px;">
            <div style="font-weight: bold; color: ${el.color}; font-size: 13px; margin-bottom: 3px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
              📐 ${el.name}
            </div>
            <div style="margin-top: 4px; color: #334155; line-height: 1.4;">
              ${el.details || "Elemen Pelan Tatatur Pemajuan"}
            </div>
            <div style="margin-top: 6px; background: #f8fafc; padding: 4px 6px; border-radius: 4px; font-size: 11px; border: 1px solid #e2e8f0;">
              ${el.areaSqm ? `<div><b>Keluasan:</b> ${el.areaSqm.toLocaleString()} m²</div>` : ""}
              ${el.unitCount ? `<div><b>Bilangan Unit:</b> ${el.unitCount} Unit</div>` : ""}
              ${el.heightStoreys ? `<div><b>Ketinggian:</b> ${el.heightStoreys} Tingkat</div>` : ""}
              <div><b>Kategori CAD:</b> <span style="font-family: monospace; font-weight: bold; color: #475569;">${el.category}</span></div>
            </div>
          </div>
        `;

        poly.bindPopup(popupContent);
        poly.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 10px; font-weight: bold; color: #0f172a;">${el.label}</div>`,
          { permanent: false, direction: "center" }
        );

        poly.addTo(map);
        layoutPolygons.push(poly);
      });
    }
    layersGroupRef.current.layoutPolygons = layoutPolygons;

    // Add Nearby Features Markers
    const featureMarkers: L.Marker[] = [];
    if (visibleLayers.features && bufferFeatures.length > 0) {
      const offsets = [
        { dLat: 0.002, dLng: -0.002 },
        { dLat: -0.0018, dLng: 0.002 },
        { dLat: 0.0015, dLng: 0.0025 },
        { dLat: -0.0022, dLng: -0.0015 },
      ];

      bufferFeatures.forEach((feat, idx) => {
        const off = offsets[idx % offsets.length];
        const featLat = lat + off.dLat;
        const featLng = lng + off.dLng;

        const markerHtml = `
          <div style="background-color: #047857; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap;">
            📍 ${feat.featureName} (${feat.distanceMeters}m)
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "custom-feat-marker",
          iconAnchor: [40, 10],
        });

        const featMarker = L.marker([featLat, featLng], { icon: customIcon }).bindPopup(
          `<b>${feat.featureName}</b><br/>Jenis: ${feat.featureType}<br/>Jarak: ${feat.distanceMeters} meter`
        );
        featMarker.addTo(map);
        featureMarkers.push(featMarker);
      });
    }
    layersGroupRef.current.featureMarkers = featureMarkers;

    // Add Centroid Marker with Custom Pin & Rich Popup
    const pinHtml = `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; left: 0; top: 0; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; left: 5px; top: 2px; width: 24px; height: 30px;">
          <svg viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
          </svg>
        </div>
      </div>
    `;

    const pinIcon = L.divIcon({
      html: pinHtml,
      className: "custom-gps-pin",
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });

    const siteMarker = L.marker([lat, lng], { icon: pinIcon }).bindPopup(
      `<div style="min-width: 220px; font-family: sans-serif; padding: 6px;">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 13px; margin-bottom: 2px;">
          📍 ${lotNo}, Mukim ${mukim}
        </div>
        <div style="font-size: 11px; color: #334155; margin-bottom: 6px; line-height: 1.3;">
          ${projectTitle}
        </div>
        <div style="background: #f1f5f9; padding: 6px; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">
          <div><b>WGS84:</b> ${lat.toFixed(6)}°, ${lng.toFixed(6)}°</div>
          <div><b>Keluasan:</b> ${siteAreaSqm.toLocaleString()} m²</div>
          <div><b>UPI:</b> ${upiCode}</div>
        </div>
        <div style="display: flex; gap: 4px;">
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-decoration: none;">
            Google Maps ↗
          </a>
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #0f172a; color: #fbbf24; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-decoration: none;">
            Street View ↗
          </a>
        </div>
      </div>`
    );
    siteMarker.addTo(map);
    layersGroupRef.current.siteMarker = siteMarker;

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, lat, lng, lotNo, mukim, siteAreaSqm, projectTitle, upiCode, basemapType, visibleLayers, rtdData, bufferFeatures, layoutPlan, cadOpacity, activeCadCategory]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 overflow-hidden" style={{ minHeight: "620px" }}>
      {/* Leaflet CSS Link injection */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Dedicated CAD Sub-Toolbar (Rendered cleanly across top with 100% width and zero overlap) */}
      {visibleLayers.layoutPlan && layoutPlan && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs text-white z-10 shrink-0">
          {/* Subcategory Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase text-gold-400 flex items-center gap-1 mr-1">
              <span>📐 Susunatur CAD:</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveCadCategory("ALL")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeCadCategory === "ALL"
                  ? "bg-gold-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Semua Elemen
            </button>
            <button
              type="button"
              onClick={() => setActiveCadCategory("BUILDING_BLOCK")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeCadCategory === "BUILDING_BLOCK"
                  ? "bg-blue-600 text-white font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🏢 Blok Bangunan
            </button>
            <button
              type="button"
              onClick={() => setActiveCadCategory("OPEN_SPACE")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeCadCategory === "OPEN_SPACE"
                  ? "bg-emerald-600 text-white font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🌳 Kawasan Lapang (10%)
            </button>
            <button
              type="button"
              onClick={() => setActiveCadCategory("PARKING")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeCadCategory === "PARKING"
                  ? "bg-sky-600 text-white font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🅿️ TLK
            </button>
            <button
              type="button"
              onClick={() => setActiveCadCategory("ROAD")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                activeCadCategory === "ROAD"
                  ? "bg-slate-600 text-white font-black shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🛣️ Jalan & Akses
            </button>
          </div>

          {/* Integrated Opacity Slider */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 rounded-md border border-slate-700">
            <span className="text-[11px] font-bold text-slate-300">Kejelasan CAD:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.1"
              value={cadOpacity}
              onChange={(e) => setCadOpacity(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-gold-400"
              title="Kawal kejelasan lapisan susunatur CAD"
            />
            <span className="font-mono text-[11px] font-bold text-gold-300 w-7 text-right">
              {Math.round(cadOpacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Interactive Leaflet Map Canvas Area */}
      <div className="relative w-full h-[580px] overflow-hidden rounded-b-sm" style={{ height: "580px", minHeight: "580px" }}>
        {/* Top Right Basemap & Legend Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {/* Basemap Switcher */}
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-900/90 p-1 shadow-lg border border-slate-700 text-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setBasemapType("SATELLITE")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                basemapType === "SATELLITE"
                  ? "bg-gov-700 text-gold-300 border border-gold-400/40 shadow-xs"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🛰️ Satelit
            </button>
            <button
              type="button"
              onClick={() => setBasemapType("STREETS")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                basemapType === "STREETS"
                  ? "bg-gov-700 text-gold-300 border border-gold-400/40 shadow-xs"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🗺️ Peta Jalan
            </button>
            <button
              type="button"
              onClick={() => setBasemapType("OSM")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                basemapType === "OSM"
                  ? "bg-gov-700 text-gold-300 border border-gold-400/40 shadow-xs"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🌐 OSM
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold border shadow-lg backdrop-blur-md transition ${
              showLegend
                ? "bg-gold-500 text-slate-950 border-gold-400 shadow-gold-500/20"
                : "bg-slate-900/90 text-slate-200 hover:text-white border-slate-700"
            }`}
          >
            {showLegend ? "✕ Tutup Petunjuk" : "ℹ️ Petunjuk CAD"}
          </button>
        </div>

        {/* Leaflet Map DOM Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ height: "580px", width: "100%", minHeight: "580px", position: "relative", zIndex: 0 }}
        />

        {/* Bottom Left In-Map HUD Info Card */}
        <div className="absolute bottom-3 left-3 z-30 max-w-xs sm:max-w-sm rounded-xl bg-slate-900/95 p-3.5 text-xs text-white shadow-2xl backdrop-blur-md border border-gold-400/50 pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 font-extrabold text-gold-300">
              <span>📍 {lotNo}, Mukim {mukim}</span>
            </div>
            <span className="rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
              Peta Langsung Aktif
            </span>
          </div>
          <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">{projectTitle}</p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-700/80 pt-2 text-[11px] text-slate-300 font-mono">
            <span>{lat.toFixed(5)}° U, {lng.toFixed(5)}° T</span>
            <span className="text-emerald-400 font-bold">{siteAreaSqm.toLocaleString()} m²</span>
          </div>
        </div>

          {/* Bottom Right Floating CAD Legend */}
        {showLegend && (
          <div className="absolute bottom-3 right-3 z-30 max-w-xs rounded-xl bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md border border-slate-700 pointer-events-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
              <span className="text-[11px] font-extrabold uppercase text-gold-400">
                Petunjuk Pelan Tatatur (CAD AI)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RTD 2030</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-blue-600 border border-blue-400 shrink-0" />
                <span className="text-slate-200">Blok Bangunan & Jejak Tapak</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-emerald-500 border border-emerald-300 shrink-0" />
                <span className="text-slate-200">Kawasan Lapang & Rekreasi (10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-sky-400 border border-sky-200 shrink-0" />
                <span className="text-slate-200">Petak Tempat Letak Kereta / OKU</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-purple-500 border border-purple-300 shrink-0" />
                <span className="text-slate-200">Utiliti, Surau & Kolam OSD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-slate-500 border border-slate-300 shrink-0" />
                <span className="text-slate-200">Rizab Jalan Utama & Dalaman</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-3 border-t-2 border-dashed border-rose-500 shrink-0" />
                <span className="text-slate-200">Garisan Anjakan Pembangunan (Setback)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

