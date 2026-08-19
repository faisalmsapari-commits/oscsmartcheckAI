"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AgencyBrandingConfig, DEFAULT_AGENCY_BRANDING } from "@/types/branding";

interface BrandingContextType {
  branding: AgencyBrandingConfig;
  updateBranding: (newConfig: Partial<AgencyBrandingConfig>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = "osc_agency_branding_cms";

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<AgencyBrandingConfig>(DEFAULT_AGENCY_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setBranding((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      console.warn("Failed to load branding from storage:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Update branding function
  const updateBranding = useCallback(async (newConfig: Partial<AgencyBrandingConfig>) => {
    setBranding((prev) => {
      const updated: AgencyBrandingConfig = {
        ...prev,
        ...newConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: "Pentadbir Sistem",
      };

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist branding:", err);
      }

      return updated;
    });
  }, []);

  // 3. Reset to default configuration
  const resetToDefault = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setBranding(DEFAULT_AGENCY_BRANDING);
    } catch (err) {
      console.warn("Failed to reset branding:", err);
    }
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        updateBranding,
        resetToDefault,
        isLoading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    // Return default fallback if used outside provider
    return {
      branding: DEFAULT_AGENCY_BRANDING,
      updateBranding: async () => {},
      resetToDefault: async () => {},
      isLoading: false,
    };
  }
  return context;
}
