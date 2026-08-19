"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/ui/ApplicationStatusBadge";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { Application } from "@/types/application";
import { formatArea } from "@/lib/utils/areaConverter";
import {
  ArrowLeft,
  Send,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function ReviewApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  useEffect(() => {
    async function loadApp() {
      if (!user || !applicationId) return;
      try {
        setLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const res = await fetch(`/api/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal memuatkan permohonan");
        }

        const data = await res.json();
        const app = data.application as Application;
        setApplication(app);
        setDeclarationChecked(!!app.declaration?.declarationAccepted);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Ralat memuatkan maklumat";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }

    loadApp();
  }, [user, applicationId]);

  // Validate missing required items for statutory submission
  const validationIssues: string[] = [];
  if (application) {
    const title = application.submissionTitle || application.projectInfo?.projectName || application.title;
    if (!title || title.trim().length < 5) {
      validationIssues.push("Tajuk permohonan / nama projek sekurang-kurangnya 5 aksara diperlukan.");
    }

    if (!application.developmentType && !application.projectInfo?.developmentType) {
      validationIssues.push("Jenis pembangunan utama diperlukan.");
    }

    const lots = application.siteInfo?.lots || [];
    if (lots.length === 0 || !lots[0]?.lotNumber?.trim()) {
      validationIssues.push("Sekurang-kurangnya satu nombor lot tanah diperlukan.");
    }

    const mukim = application.siteInfo?.mukim || application.mukim;
    if (!mukim) {
      validationIssues.push("Mukim tapak cadangan diperlukan.");
    }

    const siteAreaSqm = application.siteInfo?.siteArea?.siteAreaSqm || application.siteAreaSqm;
    if (!siteAreaSqm || siteAreaSqm <= 0) {
      validationIssues.push("Keluasan tapak pembangunan yang sah diperlukan.");
    }

    if (!declarationChecked) {
      validationIssues.push("Perakuan Akuan Pemohon (Seksyen 6) wajib disahkan.");
    }
  }

  const isSubmittable = validationIssues.length === 0;

  const handleSubmitApplication = async () => {
    if (!user || !application || !isSubmittable) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      // 1. Ensure declaration is saved in application draft first
      await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...application,
          declaration: {
            declarationAccepted: true,
            declaredAt: new Date().toISOString(),
            declaredBy: user.uid,
          },
        }),
      });

      // 2. Trigger Authoritative State Machine Transition (DRAFT -> SUBMITTED)
      const transitionRes = await fetch("/api/applications/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId,
          targetStatus: "SUBMITTED",
          remarks: "Penyerahan rasmi Kebenaran Merancang oleh Pemohon.",
        }),
      });

      if (!transitionRes.ok) {
        const errData = await transitionRes.json();
        throw new Error(errData.error || "Gagal menyerahkan permohonan ke OSC.");
      }

      // Success -> Redirect to application detail page
      router.push(`/applications/${applicationId}?submitted=true`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat penyerahan permohonan";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
        <AppShell>
          <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gov-700" />
            <span className="ml-2 text-xs font-medium text-slate-600">Memuatkan semakan permohonan...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!application) {
    return (
      <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
        <AppShell>
          <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
            <Sidebar currentTab="applications" />
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="rounded-sm border border-slate-200 bg-white p-8 max-w-md text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-gov-50 border border-gov-200 flex items-center justify-center mx-auto text-gov-800">
                  <AlertTriangle className="h-6 w-6 text-gov-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Maklumat Permohonan Diselaraskan</h3>
                  <p className="text-xs text-slate-500">
                    Sila muat semula halaman ini atau kembali ke senarai permohonan untuk meneruskan semakan.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button size="sm" variant="primary" onClick={() => window.location.reload()} className="bg-gov-800">
                    Muat Semula
                  </Button>
                  <Link href="/applications">
                    <Button size="sm" variant="outline">
                      Senarai Permohonan
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isAlreadySubmitted = application.status !== "DRAFT" && application.status !== "REQUEST_INFORMATION";

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Permohonan KM</span>
                  <span>/</span>
                  <span className="font-mono text-gov-800">{application.applicationNo || applicationId}</span>
                  <span>/</span>
                  <span className="text-gov-800">Semakan Sebelum Hantar</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Semakan Akhir & Penyerahan Rasmi
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/applications/${applicationId}/edit`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>Kembali & Pinda</span>
                  </Button>
                </Link>

                {!isAlreadySubmitted && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitApplication}
                    disabled={!isSubmittable || submitting}
                    className="bg-gov-800 text-xs shadow-xs hover:bg-gov-900 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Menghantar...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Hantar Permohonan</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Validation Checklist Banner */}
            {!isAlreadySubmitted && (
              <Card
                className={`border-l-4 ${
                  isSubmittable
                    ? "border-l-emerald-500 bg-emerald-50/40"
                    : "border-l-amber-500 bg-amber-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSubmittable ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {isSubmittable
                        ? "Semua Maklumat Wajib Lengkap — Sedia Untuk Dihantar"
                        : "Maklumat Wajib Belum Lengkap"}
                    </h3>

                    {validationIssues.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900">
                        {validationIssues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-emerald-800">
                        Permohonan memenuhi syarat validasi statutori pra-penyerahan. Sila sahkan perakuan di bawah sebelum menekan &quot;Hantar Permohonan&quot;.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Application Summary Card */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Left 2 Cols: Form Sections Summary */}
              <div className="space-y-5 lg:col-span-2">
                {/* 1. Maklumat Permohonan */}
                <Card headerTitle="1. Maklumat Permohonan">
                  <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500">Jenis Permohonan:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.applicationType || "Kebenaran Merancang"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Kategori:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.planningApplicationCategory || "PERDAGANGAN"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-500">Tajuk Cadangan:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.submissionTitle || application.title || "-"}
                      </dd>
                    </div>
                    {application.projectReference && (
                      <div>
                        <dt className="font-semibold text-slate-500">Rujukan Tetuan:</dt>
                        <dd className="font-mono font-medium text-slate-800">
                          {application.projectReference}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>

                {/* 2. Maklumat Pemohon */}
                <Card headerTitle="2. Maklumat Pemohon & Perunding">
                  <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500">Nama Pemohon:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.applicantInfo?.applicantName || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Jenis Entiti:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.applicantInfo?.applicantType || "-"}
                      </dd>
                    </div>
                    {application.applicantInfo?.companyName && (
                      <div>
                        <dt className="font-semibold text-slate-500">Nama Syarikat:</dt>
                        <dd className="font-medium text-slate-800">
                          {application.applicantInfo.companyName}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-semibold text-slate-500">Emel & Telefon:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.applicantInfo?.email || "-"} / {application.applicantInfo?.phone || "-"}
                      </dd>
                    </div>
                    {application.consultantInfo?.principalSubmittingPerson && (
                      <div className="sm:col-span-2 border-t border-slate-100 pt-2">
                        <dt className="font-semibold text-slate-500">PSP / Perunding Perancang:</dt>
                        <dd className="font-medium text-slate-800">
                          {application.consultantInfo.principalSubmittingPerson} ({application.consultantInfo.consultantCompany || "Firma Perunding"})
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>

                {/* 3. Maklumat Projek */}
                <Card headerTitle="3. Maklumat Projek">
                  <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="font-semibold text-slate-500">Nama Projek:</dt>
                      <dd className="font-semibold text-slate-800">
                        {application.projectInfo?.projectName || application.title || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Jenis Pembangunan:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.projectInfo?.developmentType || application.developmentType}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Guna Tanah Dicadangkan:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.projectInfo?.proposedUse || "-"}
                      </dd>
                    </div>
                  </dl>
                </Card>

                {/* 4. Maklumat Tapak & Lot */}
                <Card headerTitle="4. Maklumat Tapak & Lot Tanah">
                  <div className="space-y-3">
                    <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-slate-500">Mukim:</dt>
                        <dd className="font-medium text-slate-800">
                          Mukim {application.siteInfo?.mukim || application.mukim || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Daerah & Negeri:</dt>
                        <dd className="font-medium text-slate-800">
                          {application.siteInfo?.district || application.district || "Langkawi"}, {application.siteInfo?.state || application.state || "Kedah"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Keluasan Tapak:</dt>
                        <dd className="font-bold text-gov-800">
                          {formatArea(application.siteInfo?.siteArea?.siteAreaSqm || application.siteAreaSqm, "SQM")}
                        </dd>
                      </div>
                    </dl>

                    {/* Lot Table */}
                    <div className="overflow-x-auto border-t border-slate-100 pt-2">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                          <tr>
                            <th className="p-1.5">Bil.</th>
                            <th className="p-1.5">No. Lot</th>
                            <th className="p-1.5">Mukim</th>
                            <th className="p-1.5">No. Hakmilik</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(application.siteInfo?.lots || []).map((lot, idx) => (
                            <tr key={idx}>
                              <td className="p-1.5 text-slate-500">{idx + 1}</td>
                              <td className="p-1.5 font-bold text-slate-800">{lot.lotNumber}</td>
                              <td className="p-1.5">{lot.mukim}</td>
                              <td className="p-1.5 text-slate-600">{lot.titleNumber || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>

                {/* 5. Parameter Pembangunan */}
                <Card headerTitle="5. Parameter Pembangunan">
                  <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-slate-500">Jumlah Unit:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.totalDevelopmentUnits ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Bilik Hotel:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.hotelRooms ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Nisbah Plot:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.plotRatio ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Tingkat Maksimum:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.maximumFloors ?? "-"} Tingkat
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">GFA (m²):</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.grossFloorAreaSqm ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Plinth (%):</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.siteCoveragePercent ?? "-"}%
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Petak Kereta:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.parkingProvided ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Kawasan Lapang:</dt>
                      <dd className="font-medium text-slate-800">
                        {application.developmentParameters?.openSpacePercent ?? "-"}%
                      </dd>
                    </div>
                  </dl>
                </Card>
              </div>

              {/* Right Col: Submission Box & Declaration */}
              <div className="space-y-5">
                <Card headerTitle="Perakuan & Penyerahan" className="border-gov-700">
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Status Semasa:</span>
                      <ApplicationStatusBadge status={application.status} size="sm" />
                    </div>

                    <div className="rounded-sm bg-slate-50 p-3 text-slate-700">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <ShieldCheck className="h-4 w-4 text-gov-800" />
                        <span>Akuan Pemohon</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Saya memperakui bahawa maklumat yang dinyatakan adalah benar dan mematuhi peruntukan Akta 172.
                      </p>

                      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-900">
                        <input
                          type="checkbox"
                          checked={declarationChecked}
                          disabled={isAlreadySubmitted}
                          onChange={(e) => setDeclarationChecked(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded-sm text-gov-800"
                        />
                        <span>Saya bersetuju dan memperakui akuan ini.</span>
                      </label>
                    </div>

                    {!isAlreadySubmitted ? (
                      <div className="space-y-2 pt-2">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleSubmitApplication}
                          disabled={!isSubmittable || submitting}
                          className="w-full bg-gov-800 py-2.5 text-xs font-bold shadow-xs hover:bg-gov-900 disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Memproses Penyerahan...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Hantar Permohonan KM</span>
                            </>
                          )}
                        </Button>

                        <Link href={`/applications/${applicationId}/edit`} className="block w-full">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Kembali & Pinda Draf</span>
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-emerald-300 bg-emerald-50 p-3 text-center text-xs text-emerald-800">
                        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
                        <p className="mt-1 font-bold">Permohonan Telah Dihantar</p>
                        <p className="mt-0.5 text-[11px]">
                          Status semasa: <strong>{application.status}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
