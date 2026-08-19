import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <AppShell showDisclaimer={false}>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg text-center">
          <Card className="border-rose-200 p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Akses Tidak Dibenarkan (403 Forbidden)
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Akaun anda tidak mempunyai peranan atau kebenaran statutori yang mencukupi untuk mengakses sumber atau modul ini.
            </p>

            <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <strong className="text-slate-800">Peraturan Keselamatan: </strong>
              Setiap capaian kepada modul pengesahan OSC, enjin penilaian peraturan, dan log audit dikawal ketat oleh Sistem Pengurusan Peranan (RBAC) MPLBP.
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Laman Utama</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm" className="w-full bg-gov-800 sm:w-auto">
                  <span>Log Masuk Semula</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
