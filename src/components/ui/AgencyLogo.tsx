"use client";

import React from "react";
import { AgencyBrandingConfig } from "@/types/branding";
import { Building2, Compass, Landmark, MapPin, Shield } from "lucide-react";

interface AgencyLogoProps {
  branding: AgencyBrandingConfig;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AgencyLogo({ branding, className = "", size = "md" }: AgencyLogoProps) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const iconSizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-11 w-11",
  };

  const currentSizeClass = sizeMap[size];
  const iconSizeClass = iconSizeMap[size];

  // 1. Custom Upload / Direct Image URL
  if (
    (branding.agencyLogoType === "IMAGE_URL" || branding.agencyLogoType === "CUSTOM_UPLOAD") &&
    branding.agencyLogoUrl
  ) {
    return (
      <div
        className={`relative flex ${currentSizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95 p-1 shadow-inner border border-gold-400/50 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={branding.agencyLogoUrl}
          alt={branding.agencyName}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  // 2. Preset Official Emblems
  const preset = branding.agencyEmblemPreset || "MPLBP";

  switch (preset) {
    case "KEDAH_STATE":
      return (
        <div
          className={`flex ${currentSizeClass} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-950 via-gov-900 to-amber-950 border border-gold-400/60 shadow-inner text-gold-300 ${className}`}
          title="Jata Negeri Kedah Darul Aman"
        >
          <Landmark className={iconSizeClass} />
        </div>
      );

    case "PLANMALAYSIA":
      return (
        <div
          className={`flex ${currentSizeClass} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-950 via-gov-900 to-indigo-950 border border-sky-400/60 shadow-inner text-sky-300 ${className}`}
          title="PLANMalaysia (Jabatan Perancangan Bandar dan Desa)"
        >
          <Compass className={iconSizeClass} />
        </div>
      );

    case "JUPEM":
      return (
        <div
          className={`flex ${currentSizeClass} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-950 via-gov-900 to-teal-950 border border-emerald-400/60 shadow-inner text-emerald-300 ${className}`}
          title="JUPEM (Jabatan Ukur dan Pemetaan Malaysia)"
        >
          <MapPin className={iconSizeClass} />
        </div>
      );

    case "KPKT":
      return (
        <div
          className={`flex ${currentSizeClass} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-950 via-gov-900 to-slate-950 border border-purple-400/60 shadow-inner text-purple-300 ${className}`}
          title="KPKT (Kementerian Perumahan dan Kerajaan Tempatan)"
        >
          <Shield className={iconSizeClass} />
        </div>
      );

    case "MPLBP":
    default:
      return (
        <div
          className={`flex ${currentSizeClass} shrink-0 items-center justify-center rounded-xl bg-gov-900 border border-gold-400/50 shadow-inner text-gold-300 ${className}`}
          title="Majlis Perbandaran Langkawi Bandaraya Pelancongan"
        >
          <Building2 className={iconSizeClass} />
        </div>
      );
  }
}
