"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { UserRole } from "@/types/common";
import { Building2, ShieldAlert, LogIn, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading, mockSignIn } = useAuth();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // Don't auto mockSignIn so the user can properly log out and pick another role
    }
  }, [isLoading, isAuthenticated, requireAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-slate-600">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gov-800 text-gold-300">
          <Building2 className="h-6 w-6 animate-pulse" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gov-700 border-t-transparent"></div>
          <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Memverifikasi Sesi Keselamatan OSC MPLBP...
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Sila tunggu sebentar.</p>
      </div>
    );
  }

  // If not authenticated, show friendly sign-in prompt instead of blank page
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-sm border border-slate-300 bg-white p-6 shadow-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gov-800 text-gold-300">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-900">Sesi Diperlukan</h2>
          <p className="mt-1 text-xs text-slate-600">
            Sila pilih peranan untuk masuk dan melihat kandungan modul ini:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => mockSignIn("APPLICANT", "pemohon@perunding.com", "Ir. Ahmad Zulkifli (Pemohon / PSP)")}
              className="justify-start text-xs font-medium"
            >
              🏢 Pemohon / PSP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mockSignIn("PLANNING_OFFICER", "perancang@mplbp.gov.my", "Pn. Noor Aini (Pegawai Perancang)")}
              className="justify-start text-xs font-medium"
            >
              📐 Pegawai Perancang
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mockSignIn("OSC_OFFICER", "pegawai.osc@mplbp.gov.my", "En. Azman (Pegawai OSC)")}
              className="justify-start text-xs font-medium"
            >
              📋 Pegawai OSC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mockSignIn("ADMIN", "admin@mplbp.gov.my", "Pentadbir Sistem Utama")}
              className="justify-start text-xs font-medium"
            >
              ⚙️ Pentadbir Sistem
            </Button>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <Link href="/login">
              <Button variant="primary" size="sm" className="w-full bg-gov-800 text-xs">
                Ke Halaman Log Masuk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If role is not in allowedRoles, show role switcher instead of blank screen
  if (isAuthenticated && allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-sm border border-amber-300 bg-white p-6 shadow-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-900">Peranan Berbeza Diperlukan</h2>
          <p className="mt-1 text-xs text-slate-600">
            Anda kini log masuk sebagai <strong>{role}</strong>. Halaman ini memerlukan salah satu peranan berikut:
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {allowedRoles.map((r) => (
              <span key={r} className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {r}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 mb-2">Tukar peranan serta-merta untuk akses:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {allowedRoles.map((targetRole) => (
                <Button
                  key={targetRole}
                  variant="outline"
                  size="sm"
                  onClick={() => mockSignIn(targetRole)}
                  className="justify-start text-xs"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Tukar ke {targetRole}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
