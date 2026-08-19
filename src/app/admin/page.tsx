"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole, ALLOWED_USER_ROLES } from "@/types/common";
import { ShieldAlert, CheckCircle, AlertTriangle, Key } from "lucide-react";

export default function AdminPage() {
  const { user, role, profile } = useAuth();
  const [targetUid, setTargetUid] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("OSC_OFFICER");
  const [organizationId, setOrganizationId] = useState("MPLBP");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!targetUid.trim()) {
      setStatusMessage({
        type: "error",
        text: "Sila masukkan Target UID pengguna yang sah.",
      });
      return;
    }

    if (role !== "SUPER_ADMIN") {
      setStatusMessage({
        type: "error",
        text: "Hanya akaun dengan tuntutan peranan SUPER_ADMIN dibenarkan mengubah peranan pengguna.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (!user) throw new Error("Pengguna tidak disahkan.");
      const idToken = await user.getIdToken(true);

      const response = await fetch("/api/admin/set-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUid: targetUid.trim(),
          role: selectedRole,
          organizationId: organizationId.trim() || "MPLBP",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal menetapkan peranan pengguna.");
      }

      setStatusMessage({
        type: "success",
        text: `Berjaya menetapkan peranan '${selectedRole}' dan organisasi '${organizationId}' untuk UID: ${targetUid}. Rekod audit telah disimpan.`,
      });
      setTargetUid("");
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({
        type: "error",
        text: error.message || "Ralat semasa memproses penukaran peranan pengguna.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                  <span>Modul Pentadbiran Keselamatan</span>
                  <span>/</span>
                  <span className="text-gov-800">Kawalan Peranan & Parameter</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Konsol Pentadbir Sistem
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="danger">{role || "ADMIN"}</Badge>
                <span className="text-xs text-slate-600">
                  {profile?.organizationId || "MPLBP"}
                </span>
              </div>
            </div>

            {/* RBAC Notice Banner */}
            <div className="rounded-sm border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="h-4 w-4 text-rose-700" />
                <span>Prinsip Keselamatan Kawalan Peranan (RBAC)</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-900">
                Semua peranan disimpan dalam bentuk <strong>Firebase Custom Claims</strong> pada token
                pengguna. Pelayar klien dilarang sama sekali mengubah suai peranan sendiri. Sebarang
                perubahan wajib melalui fungsi pelayan yang dipercayai dan direkod dalam log audit
                kekal.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Role Management Form Card */}
              <Card headerTitle="Pengurusan Peranan Pengguna (setUserRole)">
                <form onSubmit={handleSetUserRole} className="space-y-4">
                  {statusMessage && (
                    <div
                      className={`flex items-start gap-2 rounded-sm border p-3 text-xs ${
                        statusMessage.type === "success"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-rose-300 bg-rose-50 text-rose-900"
                      }`}
                    >
                      {statusMessage.type === "success" ? (
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                      )}
                      <div className="flex-1">{statusMessage.text}</div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="targetUid"
                      className="block text-xs font-semibold text-slate-700 uppercase"
                    >
                      Target User UID
                    </label>
                    <input
                      id="targetUid"
                      name="targetUid"
                      type="text"
                      required
                      value={targetUid}
                      onChange={(e) => setTargetUid(e.target.value)}
                      placeholder="e.g. 7qZb9pL0WdY219kX..."
                      className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      UID pengguna daripada Firebase Authentication console.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-xs font-semibold text-slate-700 uppercase"
                      >
                        Peranan (Custom Claim)
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      >
                        {ALLOWED_USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="organizationId"
                        className="block text-xs font-semibold text-slate-700 uppercase"
                      >
                        Kod Organisasi
                      </label>
                      <input
                        id="organizationId"
                        name="organizationId"
                        type="text"
                        value={organizationId}
                        onChange={(e) => setOrganizationId(e.target.value)}
                        placeholder="MPLBP"
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="danger"
                      isLoading={isProcessing}
                      disabled={isProcessing || role !== "SUPER_ADMIN"}
                      className="w-full text-xs font-semibold"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>
                        {role === "SUPER_ADMIN"
                          ? "Kemas Kini Custom Claims & Firestore Profile"
                          : "Hanya SUPER_ADMIN Dibenarkan Menukar Peranan"}
                      </span>
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Roles Reference Matrix */}
              <Card headerTitle="Matriks Hierarki Peranan MPLBP">
                <div className="space-y-2 text-xs">
                  <div className="rounded-sm border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>SUPER_ADMIN</span>
                      <Badge variant="danger" size="sm">Penuh</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Kuasa mutlak pengurusan peranan, kelulusan sistem, dan audit jejak kekal.
                    </p>
                  </div>

                  <div className="rounded-sm border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>ADMIN</span>
                      <Badge variant="danger" size="sm">Pentadbir</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Pengurusan parameter dan konfigurasi sistem tanpa kebenaran elevation.
                    </p>
                  </div>

                  <div className="rounded-sm border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>OSC_OFFICER / PLANNING_OFFICER / GIS_OFFICER</span>
                      <Badge variant="gold" size="sm">Pegawai</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Akses ruang semakan teknikal, penentusahan HITL, dan pengesyoran rasmi.
                    </p>
                  </div>

                  <div className="rounded-sm border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>APPLICANT</span>
                      <Badge variant="info" size="sm">Pemohon</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Penyerahan permohonan KM dan semakan status draf peribadi.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Admin Modules Quick Launch Grid */}
            <div className="space-y-3 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Pusat Kawalan & Modul Pentadbiran Sistem
                </h2>
                <p className="text-xs text-slate-500">
                  Modul konfigurasi identiti, enjin peraturan perancangan, GIS dan templat ulasan statutori.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. CMS Branding & Logo */}
                <Link href="/admin/branding" className="group block">
                  <div className="rounded-xl border border-gold-400/50 bg-gradient-to-br from-gov-900 to-slate-900 p-4 text-white shadow-md transition group-hover:border-gold-300 group-hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/20 text-gold-300 border border-gold-400/40">
                        🎨
                      </div>
                      <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-gold-300 border border-gold-400/30">
                        CMS BARU
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white group-hover:text-gold-300 transition">
                      CMS Logo & Identiti Agensi
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                      Kemaskini logo header (muat naik / preset / URL), nama PBT, jalur jenama atas, dan cogan kata rasmi.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-gold-400 flex items-center gap-1">
                      <span>Buka CMS Branding ↗</span>
                    </div>
                  </div>
                </Link>

                {/* 2. Planning Rules Engine */}
                <Link href="/admin/planning-rules" className="group block">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition group-hover:border-gov-600 group-hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-gov-700 border border-blue-200">
                      📐
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-gov-800 transition">
                      Enjin Peraturan RTD 2030
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      Konfigurasi ambang nisbah plot, anjakan hadapan/sisi, peratus kawasan lapang dan keperluan petak TLK.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-gov-700 flex items-center gap-1">
                      <span>Urus Peraturan ↗</span>
                    </div>
                  </div>
                </Link>

                {/* 3. GIS Datasets */}
                <Link href="/admin/gis" className="group block">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition group-hover:border-gov-600 group-hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🗺️
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-gov-800 transition">
                      SmartGIS & Data JUPEM
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      Pengurusan lapisan kadaster tanah, zon rancangan tempatan RTD 2030, dan kawasan sensitif alam sekitar.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span>Pusat GIS ↗</span>
                    </div>
                  </div>
                </Link>

                {/* 4. Comment Templates */}
                <Link href="/admin/comment-templates" className="group block">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition group-hover:border-gov-600 group-hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                      📝
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-gov-800 transition">
                      Templat Ulasan Perancangan
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      Katalog frasa standard teknikal perancangan dan klausa statutori kelulusan bersyarat.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                      <span>Katalog Frasa ↗</span>
                    </div>
                  </div>
                </Link>

                {/* 5. Notification Templates */}
                <Link href="/admin/notifications/templates" className="group block">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition group-hover:border-gov-600 group-hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      🔔
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-gov-800 transition">
                      Templat Notifikasi & RFI
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      Templat surat pemakluman statutori, pertanyaan maklumat (RFI), dan keputusan mesyuarat jawatankuasa.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <span>Templat Surat ↗</span>
                    </div>
                  </div>
                </Link>

                {/* 6. Go-Live Governance */}
                <Link href="/admin/go-live" className="group block">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition group-hover:border-gov-600 group-hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      🚀
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-gov-800 transition">
                      Kesediaan Pelancaran (Go-Live)
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      Senarai semak tadbir urus pengeluaran, keselamatan RBAC, dan audit pematuhan Akta 172.
                    </p>
                    <div className="mt-3 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <span>Status Go-Live ↗</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
