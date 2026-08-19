"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/ui/ApplicationStatusBadge";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApplicationFormStepper } from "@/components/applications/ApplicationFormStepper";
import { Section1ApplicationInfo } from "@/components/applications/Section1ApplicationInfo";
import { Section2ApplicantInfo } from "@/components/applications/Section2ApplicantInfo";
import { Section3ProjectInfo } from "@/components/applications/Section3ProjectInfo";
import { Section4SiteInfo } from "@/components/applications/Section4SiteInfo";
import { Section5Parameters } from "@/components/applications/Section5Parameters";
import { Section6Declaration } from "@/components/applications/Section6Declaration";
import {
  Application,
  ApplicantInfo,
  ConsultantInfo,
  ProjectInfo,
  SiteInfo,
  DevelopmentParameters,
  ApplicantDeclaration,
} from "@/types/application";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Lock,
} from "lucide-react";

type AutosaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR";

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(6);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("IDLE");
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Application>>({});
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    async function loadApplication() {
      if (!user || !applicationId) return;
      try {
        setLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const res = await fetch(`/api/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal memuatkan permohonan");
        }

        const data = await res.json();
        const app = data.application as Application;

        // Check if locked
        if (app.status !== "DRAFT" && app.status !== "REQUEST_INFORMATION") {
          setIsLocked(true);
        }

        setFormData(app);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Ralat memuatkan permohonan";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [user, applicationId]);

  // Debounced Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = () => {
    if (!user || isLocked || !applicationId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setAutosaveStatus("SAVING");
        const token = await user.getIdToken();

        const res = await fetch(`/api/applications/${applicationId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formDataRef.current),
        });

        if (!res.ok) {
          throw new Error("Gagal menyimpan draf");
        }

        setAutosaveStatus("SAVED");
      } catch {
        setAutosaveStatus("ERROR");
      }
    }, 1500);
  };

  const handleFieldChange = (newFields: Partial<Application>) => {
    if (isLocked) return;
    setFormData((prev) => {
      const updated = { ...prev, ...newFields };
      return updated;
    });
    triggerAutosave();
  };

  const handleManualSave = async () => {
    if (!user || isLocked || !applicationId) return;
    try {
      setIsManualSaving(true);
      setErrorMessage(null);
      const token = await user.getIdToken();

      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan draf");
      }

      setAutosaveStatus("SAVED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat menyimpan draf";
      setErrorMessage(msg);
      setAutosaveStatus("ERROR");
    } finally {
      setIsManualSaving(false);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep < 6) {
      goToStep(currentStep + 1);
    } else {
      handleManualSave().then(() => {
        router.push(`/applications/${applicationId}/review`);
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["APPLICANT", "SUPER_ADMIN"]}>
        <AppShell>
          <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gov-700" />
            <span className="ml-2 text-xs font-medium text-slate-600">Memuatkan data permohonan...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "SUPER_ADMIN"]}>
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
                  <span className="font-mono text-gov-800">{formData.applicationNo || applicationId}</span>
                  <span>/</span>
                  <span className="text-gov-800">Pinda Draf</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Pinda Draf Permohonan Kebenaran Merancang
                </h1>
              </div>

              {/* Status / Actions Bar */}
              <div className="flex items-center gap-3">
                {formData.status && <ApplicationStatusBadge status={formData.status} size="sm" />}

                {!isLocked && (
                  <>
                    <div className="text-xs">
                      {autosaveStatus === "SAVING" && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gov-700" />
                          <span>Menyimpan...</span>
                        </span>
                      )}
                      {autosaveStatus === "SAVED" && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Draf disimpan</span>
                        </span>
                      )}
                      {autosaveStatus === "ERROR" && (
                        <span className="inline-flex items-center gap-1 font-medium text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Gagal menyimpan</span>
                        </span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualSave}
                      disabled={isManualSaving}
                      className="text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isManualSaving ? "Menyimpan..." : "Simpan Draf"}</span>
                    </Button>
                  </>
                )}

                <Link href={`/applications/${applicationId}/review`}>
                  <Button variant="primary" size="sm" className="bg-gov-700 text-xs shadow-xs hover:bg-gov-800">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Semak & Hantar</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Read-only locked warning if already submitted */}
            {isLocked && (
              <div className="flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <strong>Permohonan Telah Dihantar (Mod Baca Sahaja):</strong> Permohonan ini berstatus{" "}
                  <strong>{formData.status}</strong> dan tidak lagi boleh dipinda secara langsung. Sila layari{" "}
                  <Link href={`/applications/${applicationId}`} className="font-bold underline hover:text-amber-950">
                    Halaman Perincian Permohonan
                  </Link>{" "}
                  untuk menyemak status terkini.
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Stepper Card */}
            <Card className="p-0 overflow-hidden">
              <ApplicationFormStepper
                currentStep={currentStep}
                onStepClick={goToStep}
                maxReachedStep={maxReachedStep}
              />

              {/* Form Content */}
              <div className="p-4 sm:p-6">
                {currentStep === 1 && (
                  <Section1ApplicationInfo
                    applicationType={formData.applicationType || "Kebenaran Merancang"}
                    planningApplicationCategory={formData.planningApplicationCategory || "PERDAGANGAN"}
                    categoryOtherDescription={formData.categoryOtherDescription || null}
                    submissionTitle={formData.submissionTitle || formData.title || ""}
                    projectReference={formData.projectReference || null}
                    disabled={isLocked}
                    onChange={(fields) => handleFieldChange(fields)}
                  />
                )}

                {currentStep === 2 && (
                  <Section2ApplicantInfo
                    applicantInfo={formData.applicantInfo || {}}
                    consultantInfo={formData.consultantInfo || {}}
                    disabled={isLocked}
                    onChangeApplicant={(fields) =>
                      handleFieldChange({
                        applicantInfo: { ...formData.applicantInfo, ...fields } as ApplicantInfo,
                      })
                    }
                    onChangeConsultant={(fields) =>
                      handleFieldChange({
                        consultantInfo: { ...formData.consultantInfo, ...fields } as ConsultantInfo,
                      })
                    }
                  />
                )}

                {currentStep === 3 && (
                  <Section3ProjectInfo
                    projectInfo={formData.projectInfo || {}}
                    disabled={isLocked}
                    onChange={(fields) => {
                      const updatedProj = { ...formData.projectInfo, ...fields } as ProjectInfo;
                      handleFieldChange({
                        projectInfo: updatedProj,
                        developmentType: updatedProj.developmentType,
                      });
                    }}
                  />
                )}

                {currentStep === 4 && (
                  <Section4SiteInfo
                    siteInfo={formData.siteInfo || {}}
                    disabled={isLocked}
                    onChange={(fields) =>
                      handleFieldChange({
                        siteInfo: { ...formData.siteInfo, ...fields } as SiteInfo,
                      })
                    }
                  />
                )}

                {currentStep === 5 && (
                  <Section5Parameters
                    developmentType={
                      formData.projectInfo?.developmentType || formData.developmentType || "COMMERCIAL"
                    }
                    parameters={formData.developmentParameters || {}}
                    disabled={isLocked}
                    onChange={(fields) =>
                      handleFieldChange({
                        developmentParameters: {
                          ...formData.developmentParameters,
                          ...fields,
                          source: "APPLICANT",
                        } as DevelopmentParameters,
                      })
                    }
                  />
                )}

                {currentStep === 6 && (
                  <Section6Declaration
                    declaration={formData.declaration || {}}
                    disabled={isLocked}
                    onChange={(fields) =>
                      handleFieldChange({
                        declaration: { ...formData.declaration, ...fields } as ApplicantDeclaration,
                      })
                    }
                  />
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {!isLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualSave}
                        disabled={isManualSaving}
                        className="text-xs"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Simpan Draf</span>
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNext}
                      className="bg-gov-700 text-xs shadow-xs hover:bg-gov-800"
                    >
                      <span>{currentStep === 6 ? "Teruskan ke Semakan" : "Seterusnya"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
