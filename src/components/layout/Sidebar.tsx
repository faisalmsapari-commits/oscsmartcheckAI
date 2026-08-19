"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  ShieldAlert,
  PlusCircle,
  FolderLock,
  UserCheck,
  Rocket,
  Info,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBranding } from "@/lib/branding/BrandingContext";
import { UserRole } from "@/types/common";

export interface SidebarProps {
  currentTab?: string;
}

export function Sidebar({ currentTab }: SidebarProps) {
  const pathname = usePathname();
  const { role, profile } = useAuth();
  const { branding } = useBranding();

  const links: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    description: string;
    allowedRoles?: UserRole[];
  }> = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      description: "Pusat kawalan utama",
    },
    {
      id: "applications",
      title: "Permohonan KM",
      icon: FileCheck2,
      href: "/applications",
      description: "Senarai permohonan pemohon / PSP",
    },
    {
      id: "new_application",
      title: "Permohonan Baru",
      icon: PlusCircle,
      href: "/applications/new",
      description: "Daftar permohonan baharu",
      allowedRoles: ["APPLICANT", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN"],
    },
    {
      id: "officer",
      title: "Ruang Kerja Pegawai",
      icon: UserCheck,
      href: "/officer",
      description: "Semakan & pengesyoran OSC",
      allowedRoles: ["PLANNING_OFFICER", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
    },
    {
      id: "management",
      title: "Dashboard Pengurusan",
      icon: LayoutDashboard,
      href: "/management/dashboard",
      description: "KPI, analitik & inteligen perancangan",
      allowedRoles: ["PLANNING_OFFICER", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
    },
    {
      id: "escalations",
      title: "Eskalasi & SLA",
      icon: ShieldAlert,
      href: "/management/escalations",
      description: "Pemantauan sasaran masa dalaman",
      allowedRoles: ["PLANNING_OFFICER", "OSC_OFFICER", "ADMIN", "SUPER_ADMIN", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
    },
    {
      id: "admin",
      title: "Panel Pentadbiran",
      icon: FolderLock,
      href: "/admin",
      description: "Kawalan peranan & parameter",
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
      id: "admin_branding",
      title: "CMS Logo & Agensi",
      icon: Palette,
      href: "/admin/branding",
      description: "Logo header, nama PBT & tema",
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
      id: "go-live",
      title: "Kesediaan Go-Live",
      icon: Rocket,
      href: "/admin/go-live",
      description: "Senarai semak tadbir urus pelancaran",
      allowedRoles: ["ADMIN", "SUPER_ADMIN", "PLANNING_OFFICER", "OSC_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
    },
    {
      id: "system-info",
      title: "Maklumat Sistem",
      icon: Info,
      href: "/admin/system-info",
      description: "Versi komponen & konfigurasi",
      allowedRoles: ["ADMIN", "SUPER_ADMIN", "PLANNING_OFFICER", "OSC_OFFICER", "APPLICANT", "GIS_OFFICER", "OSC_MANAGER", "PLANNING_MANAGER"],
    },
  ];

  const visibleLinks = links.filter((link) => {
    if (!link.allowedRoles) return true;
    if (!role) return false;
    return link.allowedRoles.includes(role);
  });

  return (
    <aside className="w-full shrink-0 border-r border-slate-200 bg-slate-50/70 md:w-64">
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        {/* Main Navigation Items */}
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Menu Akses Terkawal
          </div>

          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab
              ? currentTab === link.id
              : pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "group flex items-start gap-3 rounded-sm p-2.5 transition-colors",
                  isActive
                    ? "border-l-4 border-gov-700 bg-white font-semibold text-gov-800 shadow-sm"
                    : "border-l-4 border-transparent text-slate-700 hover:bg-slate-200/60 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    isActive ? "text-gov-700" : "text-slate-500 group-hover:text-slate-700"
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{link.title}</span>
                  <span className="text-[10px] text-slate-500">{link.description}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Security & Organization Badge */}
        <div className="mt-6 space-y-2 border-t border-slate-200 pt-3">
          <div className="rounded-sm border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <FolderLock className="h-3.5 w-3.5 text-gov-700" />
              <span>Zon Keselamatan RBAC</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Peranan:</span>
              <span className="font-semibold text-gov-800">{role || "GUEST"}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Organisasi:</span>
              <span className="font-semibold text-slate-700">
                {branding.agencyAcronym || profile?.organizationId || "MPLBP"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
