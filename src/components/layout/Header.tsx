"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  Bell,
  LayoutDashboard,
  FolderKanban,
  UserCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBranding } from "@/lib/branding/BrandingContext";
import { AgencyLogo } from "@/components/ui/AgencyLogo";
import { NavItem, UserRole } from "@/types/common";
import { Badge } from "@/components/ui/Badge";

export interface EnhancedNavItem extends NavItem {
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: EnhancedNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Permohonan",
    href: "/applications",
    icon: FolderKanban,
  },
  {
    title: "Ruang Pegawai",
    href: "/officer",
    icon: UserCheck,
    allowedRoles: ["PLANNING_OFFICER", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
  },
  {
    title: "Pengurusan OSC",
    href: "/management/dashboard",
    icon: BarChart3,
    allowedRoles: ["PLANNING_OFFICER", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
  },
  {
    title: "Pentadbiran",
    href: "/admin",
    icon: Settings,
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, role, isAuthenticated, signOutUser, mockSignIn } = useAuth();
  const { branding } = useBranding();

  const isRouteAllowed = (item: NavItem) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    if (!role) return false;
    return item.allowedRoles.includes(role);
  };

  const getRoleBadgeVariant = (userRole: UserRole | null) => {
    switch (userRole) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "danger";
      case "OSC_OFFICER":
      case "PLANNING_OFFICER":
      case "GIS_OFFICER":
      case "OSC_MANAGER":
      case "PLANNING_MANAGER":
        return "gold";
      case "APPLICANT":
        return "info";
      default:
        return "neutral";
    }
  };

  const getRoleDisplayName = (r: UserRole | null) => {
    switch (r) {
      case "PLANNING_OFFICER":
        return "Pegawai Perancang";
      case "OSC_OFFICER":
        return "Pegawai OSC";
      case "ADMIN":
      case "SUPER_ADMIN":
        return "Pentadbir Sistem";
      case "APPLICANT":
      default:
        return "Pemohon / PSP";
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = profile?.displayName || user?.displayName || "Pn. Noor Aini binti Zakaria";

  return (
    <header className="sticky top-0 z-40 border-b border-gov-900/20 bg-gov-800 text-white shadow-md">
      {/* Top Malaysian Government Brand Strip */}
      <div className="border-b border-gov-700/60 bg-gov-950 px-4 py-1.5 text-xs text-slate-300">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-wide text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-100">
              {branding.topStripText || "PORTAL RASMI KERAJAAN TEMPATAN NEGERI KEDAH DARUL AMAN"}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex">
            <span>Sistem Pintar Pematuhan Perancangan {branding.agencyAcronym || "MPLBP"}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-gold-400">{branding.referencePlanText || "RTD Langkawi 2030"}</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="mx-auto flex max-w-[1700px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Brand & Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3.5 transition-all hover:opacity-95 shrink-0"
        >
          <AgencyLogo branding={branding} size="md" className="group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white sm:text-xl">
                {branding.portalTitle || "OSC SmartCheck AI"}
              </span>
              <span className="rounded-md bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-300 border border-gold-400/30">
                {branding.agencyAcronym || "MPLBP"}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-300 tracking-normal">
              {branding.agencyName || "Majlis Perbandaran Langkawi Bandaraya Pelancongan"}
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links with Icons */}
        <nav
          className="hidden items-center gap-1.5 xl:gap-2 lg:flex mx-4"
          aria-label="Navigasi Utama"
        >
          {NAV_ITEMS.filter(isRouteAllowed).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold tracking-wide transition-all uppercase",
                  isActive
                    ? "bg-gov-900 text-gold-300 border border-gold-400/40 shadow-xs ring-1 ring-gold-400/20"
                    : "text-slate-200 hover:bg-gov-700/70 hover:text-white"
                )}
              >
                <ItemIcon className={cn("h-4 w-4", isActive ? "text-gold-300" : "text-slate-300")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Controls & Session Area */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Quick Role Switcher Pill */}
              <div className="flex items-center gap-2 rounded-lg border border-gold-400/40 bg-gov-900/90 px-3 py-1.5 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-gold-300 shrink-0" />
                <span className="text-[11px] font-extrabold uppercase text-gold-400 hidden sm:inline">
                  Peranan:
                </span>
                <div className="relative flex items-center">
                  <select
                    value={role || "APPLICANT"}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      mockSignIn(newRole);
                    }}
                    className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-white focus:outline-none hover:text-gold-200"
                    title="Tukar Peranan Pengguna"
                  >
                    <option value="APPLICANT" className="bg-slate-900 text-white">
                      🏢 Pemohon / PSP / Perunding
                    </option>
                    <option value="PLANNING_OFFICER" className="bg-slate-900 text-white">
                      📐 Pegawai Perancang
                    </option>
                    <option value="OSC_OFFICER" className="bg-slate-900 text-white">
                      📋 Pegawai OSC
                    </option>
                    <option value="ADMIN" className="bg-slate-900 text-white">
                      ⚙️ Pentadbir Sistem
                    </option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-gold-300" />
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="h-7 w-px bg-gov-700/80 hidden md:block" />

              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gov-700 bg-gov-900/70 text-slate-200 transition-colors hover:bg-gov-700 hover:text-white"
                title="Pemberitahuan Sistem"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-gov-800" />
              </Link>

              {/* User Profile Badge */}
              <div className="hidden items-center gap-2.5 md:flex pl-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gov-700 border border-gold-400/50 text-xs font-black text-gold-300 shadow-xs">
                  {getUserInitials(displayName)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white tracking-tight truncate max-w-[180px]">
                    {displayName}
                  </span>
                  <span className="text-[11px] font-semibold text-gold-300/90">
                    {getRoleDisplayName(role)} • {profile?.organizationId || "MPLBP"}
                  </span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="h-7 w-px bg-gov-700/80 hidden sm:block" />

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  window.location.href = "/login";
                }}
                title="Log Keluar dari Sistem"
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-gov-900/90 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-rose-400 hover:bg-rose-950/60 hover:text-rose-200 shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Log Keluar</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gold-400/50 bg-gov-900/90 px-4 py-2 text-xs font-bold text-gold-300 transition hover:bg-gov-900 hover:text-gold-200 shadow-xs"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Log Masuk</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gov-700 bg-gov-900/80 text-slate-200 hover:bg-gov-700 focus:outline-none focus:ring-2 focus:ring-gold-400 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gov-700 bg-gov-950 px-5 py-4 lg:hidden">
          {isAuthenticated && (
            <div className="mb-4 border-b border-gov-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gov-800 border border-gold-400 text-xs font-bold text-gold-300">
                  {getUserInitials(displayName)}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {displayName}
                  </span>
                  <span className="text-xs text-gold-300 font-medium">
                    {getRoleDisplayName(role)} ({profile?.organizationId || "MPLBP"})
                  </span>
                </div>
              </div>
              {role && (
                <Badge variant={getRoleBadgeVariant(role)} size="sm">
                  {role}
                </Badge>
              )}
            </div>
          )}

          <nav className="flex flex-col gap-1.5" aria-label="Navigasi Mudah Alih">
            {NAV_ITEMS.filter(isRouteAllowed).map((item) => {
              const ItemIcon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-gov-900 text-gold-300 border border-gold-400/30"
                      : "text-slate-200 hover:bg-gov-800 hover:text-white"
                  )}
                >
                  <ItemIcon className={cn("h-4 w-4", isActive ? "text-gold-300" : "text-slate-400")} />
                  <span>{item.title}</span>
                </Link>
              );
            })}

            <div className="mt-4 border-t border-gov-800 pt-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOutUser();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-800/80 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white uppercase transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Keluar</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-xs font-bold text-gov-950 uppercase"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log Masuk Pengguna</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
