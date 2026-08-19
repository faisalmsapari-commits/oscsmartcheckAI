"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBranding } from "@/lib/branding/BrandingContext";
import { AgencyLogo } from "@/components/ui/AgencyLogo";
import { UserRole } from "@/types/common";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signInWithEmail, mockSignIn, isAuthenticated, isLoading } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleQuickLogin = async (
    role: "APPLICANT" | "PLANNING_OFFICER" | "OSC_OFFICER" | "ADMIN"
  ) => {
    setIsSubmitting(true);
    try {
      const roleProfiles: Record<
        string,
        { email: string; name: string }
      > = {
        APPLICANT: {
          email: "pemohon@perunding.com",
          name: "Ir. Ahmad Zulkifli (Pemohon / PSP / Perunding)",
        },
        PLANNING_OFFICER: {
          email: "perancang@mplbp.gov.my",
          name: "Pn. Noor Aini binti Zakaria (Pegawai Perancang)",
        },
        OSC_OFFICER: {
          email: "pegawai.osc@mplbp.gov.my",
          name: "En. Azman bin Kassim (Pegawai OSC)",
        },
        ADMIN: {
          email: "admin@mplbp.gov.my",
          name: "Pentadbir Sistem Utama (Admin)",
        },
      };

      const selected = roleProfiles[role];
      await mockSignIn(role as UserRole, selected.email, selected.name);
      // Direct immediately to /dashboard
      window.location.href = "/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Sila masukkan emel rasmi dan kata laluan.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      // Direct immediately to /dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error("[Login] Error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErrorMessage("Emel atau kata laluan tidak sah. Sila cuba lagi.");
      } else if (error.code === "auth/user-disabled") {
        setErrorMessage("Akaun ini telah digantung atau dinyahaktifkan oleh Pentadbir OSC.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Terlalu banyak percubaan log masuk gagal. Sila cuba sebentar lagi.");
      } else {
        setErrorMessage(error.message || "Ralat semasa log masuk ke sistem.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-300 shadow-md">
      <div className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-sm border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
            >
              Emel Rasmi / ID Pengguna
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@mplbp.gov.my atau nama@firma.com"
              className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-wide text-slate-700 uppercase"
            >
              Kata Laluan
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full bg-gov-800 text-white font-semibold hover:bg-gov-900"
            >
              <Lock className="h-4 w-4 mr-1.5" />
              <span>Log Masuk & Terus Ke Dashboard</span>
            </Button>
          </div>
        </form>

        {/* Demo Quick Logins for 4 Roles */}
        <div className="mt-4 border-t border-slate-200 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>🚀 Log Masuk Pantas (4 Kategori Pengguna)</span>
            </span>
            <span className="rounded-full bg-gold-100 border border-gold-300 px-2 py-0.5 text-[10px] font-bold text-gold-900">
              1-KLIK AKSI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* 1. Pemohon / PSP */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("APPLICANT")}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xs focus:outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-bold text-sm">
                🏢
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">Pemohon / PSP</div>
                <div className="text-[10px] text-slate-500 truncate">Perunding / Arkitek</div>
              </div>
            </button>

            {/* 2. Pegawai Perancang */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("PLANNING_OFFICER")}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-xs focus:outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700 font-bold text-sm">
                📐
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">Pegawai Perancang</div>
                <div className="text-[10px] text-slate-500 truncate">Semakan Teknikal & RTD</div>
              </div>
            </button>

            {/* 3. Pegawai OSC */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("OSC_OFFICER")}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-xs focus:outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 font-bold text-sm">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">Pegawai OSC</div>
                <div className="text-[10px] text-slate-500 truncate">Urus Setia & Edaran</div>
              </div>
            </button>

            {/* 4. Pentadbir Sistem */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("ADMIN")}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-xs focus:outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 font-bold text-sm">
                ⚙️
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">Pentadbir Sistem</div>
                <div className="text-[10px] text-slate-500 truncate">Kawalan Parameter & Audit</div>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
          <span>Perlukan bantuan log masuk? Sila hubungi {branding.agencyDepartment || "Unit OSC"} di </span>
          <span className="font-semibold text-slate-700">{branding.helpdeskEmail || "osc@mplbp.gov.my"}</span>
        </div>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  const { branding } = useBranding();

  return (
    <AppShell showDisclaimer={false}>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header Branding */}
          <div className="text-center flex flex-col items-center">
            <AgencyLogo branding={branding} size="lg" className="mx-auto mb-2" />
            <h1 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Portal Log Masuk {branding.portalTitle || "OSC SmartCheck AI"}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {branding.agencyName || "Majlis Perbandaran Langkawi Bandaraya Pelancongan"}
            </p>
          </div>

          <Suspense
            fallback={
              <Card className="p-8 text-center text-xs text-slate-500">
                Memuatkan borang log masuk...
              </Card>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Security Notice */}
          <div className="rounded-sm border border-slate-200 bg-slate-100/70 p-3 text-center text-xs text-slate-600">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Sistem Sokongan Keputusan Berkanun OSC {branding.agencyAcronym || "MPLBP"}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {branding.statutoryActNotice || "Akses tertakluk kepada Akta Perancangan Bandar dan Desa 1976 (Akta 172). Semua aktiviti diaudit."}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
