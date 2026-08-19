"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { AiDocumentIngestionZone } from "@/components/applications/AiDocumentIngestionZone";
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
  Sparkles,
} from "lucide-react";

type AutosaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR";

export default function NewApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(6);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("IDLE");
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Application>>({
    title: "",
    applicationType: "Kebenaran Merancang",
    planningApplicationCategory: "PERDAGANGAN",
    categoryOtherDescription: "",
    submissionTitle: "",
    projectReference: "",
    developmentType: "COMMERCIAL",
    applicantInfo: {
      applicantName: user?.displayName || "",
      applicantType: "COMPANY",
      companyName: "",
      registrationNumber: "",
      email: user?.email || "",
      phone: "",
      address: "",
    },
    consultantInfo: {
      principalSubmittingPerson: "",
      consultantCompany: "",
      professionalRegistrationNo: "",
      email: "",
      phone: "",
    },
    projectInfo: {
      projectName: "",
      developmentType: "COMMERCIAL",
      developmentSubtype: "",
      developmentDescription: "",
      developmentCategory: null,
      proposedUse: "",
      existingUse: "",
      estimatedProjectValue: null,
    },
    siteInfo: {
      lots: [{ lotNumber: "", mukim: "Kuah", titleNumber: "", landStatus: "HAKMILIK_KEKAL" }],
      mukim: "Kuah",
      district: "Langkawi",
      state: "Kedah",
      siteAddress: "",
      siteArea: { originalValue: null, originalUnit: "SQM", siteAreaSqm: null },
      location: { latitude: null, longitude: null },
    },
    developmentParameters: {
      source: "APPLICANT",
      totalDevelopmentUnits: null,
      residentialUnits: null,
      hotelRooms: null,
      commercialFloorAreaSqm: null,
      grossFloorAreaSqm: null,
      buildingFootprintSqm: null,
      numberOfBlocks: null,
      maximumFloors: null,
      maximumBuildingHeightM: null,
      plotRatio: null,
      siteCoveragePercent: null,
      parkingProvided: null,
      motorcycleParkingProvided: null,
      disabledParkingProvided: null,
      openSpaceAreaSqm: null,
      openSpacePercent: null,
    },
    declaration: {
      declarationAccepted: false,
      declaredAt: null,
      declaredBy: null,
    },
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Debounced Autosave Effect
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = () => {
    if (!user) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setAutosaveStatus("SAVING");
        const token = await user.getIdToken();
        const payload = {
          ...formDataRef.current,
          applicationId: createdAppId || undefined,
        };

        const res = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Gagal menyimpan draf automatik");
        }

        const data = await res.json();
        if (data.applicationId && !createdAppId) {
          setCreatedAppId(data.applicationId);
        }

        setAutosaveStatus("SAVED");
      } catch {
        setAutosaveStatus("ERROR");
      }
    }, 1500);
  };

  const handleFieldChange = (newFields: Partial<Application>) => {
    setErrorMessage(null);
    setFormData((prev) => {
      const updated = { ...prev, ...newFields };
      return updated;
    });
    triggerAutosave();
  };

  const handleAiDataExtracted = (extractedData: Partial<Application>) => {
    setErrorMessage(null);
    setFormData((prev) => ({
      ...prev,
      ...extractedData,
      applicantInfo: {
        ...prev.applicantInfo,
        ...extractedData.applicantInfo,
      } as ApplicantInfo,
      consultantInfo: {
        ...prev.consultantInfo,
        ...extractedData.consultantInfo,
      } as ConsultantInfo,
      projectInfo: {
        ...prev.projectInfo,
        ...extractedData.projectInfo,
      } as ProjectInfo,
      siteInfo: {
        ...prev.siteInfo,
        ...extractedData.siteInfo,
      } as SiteInfo,
      developmentParameters: {
        ...prev.developmentParameters,
        ...extractedData.developmentParameters,
      } as DevelopmentParameters,
      declaration: {
        ...prev.declaration,
        ...extractedData.declaration,
      } as ApplicantDeclaration,
    }));
    setMaxReachedStep(6);
    triggerAutosave();
  };

  const handleManualSave = async () => {
    if (!user) return;
    try {
      setIsManualSaving(true);
      setErrorMessage(null);
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        applicationId: createdAppId || undefined,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan draf");
      }

      const data = await res.json();
      if (data.applicationId && !createdAppId) {
        setCreatedAppId(data.applicationId);
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

  const formCardRef = useRef<HTMLDivElement>(null);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    if (formCardRef.current) {
      const topOffset = formCardRef.current.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      goToStep(currentStep + 1);
    } else {
      // Step 6 completed -> Save and go to review page
      handleManualSave().then(() => {
        if (createdAppId) {
          router.push(`/applications/${createdAppId}/review`);
        }
      });
    }
  };

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="new_application" />

          <div className="flex-1 space-y-5 p-4 sm:p-6 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <span>Permohonan KM</span>
                  <span>/</span>
                  <span className="text-gov-800 font-bold">Daftar Permohonan Baharu</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  Borang Permohonan Kebenaran Merancang (KM)
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Muat naik LCP & Pelan CAD untuk pengisian pintar automatik AI atau semak borang secara langkah demi langkah.
                </p>
              </div>

              {/* Status / Actions Bar */}
              <div className="flex items-center gap-3">
                {/* Autosave Indicator */}
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
                  <Save className="h-3.5 w-3.5 mr-1" />
                  <span>{isManualSaving ? "Menyimpan..." : "Simpan Draf"}</span>
                </Button>

                {createdAppId && (
                  <Link href={`/applications/${createdAppId}/review`}>
                    <Button variant="primary" size="sm" className="bg-gov-700 text-xs shadow-xs hover:bg-gov-800">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      <span>Semak Permohonan</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* AI Document & CAD Auto-Extraction Hub */}
            <AiDocumentIngestionZone onDataExtracted={handleAiDataExtracted} />

            {/* Form Stepper Card */}
            <div ref={formCardRef} className="scroll-mt-20">
              <Card className="p-0 overflow-hidden bg-white shadow-2xs border-slate-200">
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
                    submissionTitle={formData.submissionTitle || ""}
                    projectReference={formData.projectReference || null}
                    onChange={(fields) => handleFieldChange(fields)}
                  />
                )}

                {currentStep === 2 && (
                  <Section2ApplicantInfo
                    applicantInfo={formData.applicantInfo || {}}
                    consultantInfo={formData.consultantInfo || {}}
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
                    onChange={(fields) => {
                      const updatedProj = { ...formData.projectInfo, ...fields } as ProjectInfo;
                      handleFieldChange({
                        projectInfo: updatedProj,
                        projectReference: formData.projectReference,
                        title: updatedProj.projectName || formData.title,
                        developmentType: updatedProj.developmentType || formData.developmentType,
                      });
                    }}
                  />
                )}

                {currentStep === 4 && (
                  <Section4SiteInfo
                    siteInfo={formData.siteInfo || {}}
                    onChange={(fields) => {
                      const updatedSite = { ...formData.siteInfo, ...fields } as SiteInfo;
                      handleFieldChange({
                        siteInfo: updatedSite,
                        mukim: updatedSite.mukim,
                      });
                    }}
                  />
                )}

                {currentStep === 5 && (
                  <Section5Parameters
                    parameters={formData.developmentParameters || {}}
                    developmentType={formData.developmentType || "COMMERCIAL"}
                    onChange={(fields) =>
                      handleFieldChange({
                        developmentParameters: {
                          ...formData.developmentParameters,
                          ...fields,
                        } as DevelopmentParameters,
                      })
                    }
                  />
                )}

                {currentStep === 6 && (
                  <Section6Declaration
                    declaration={formData.declaration || {}}
                    applicationData={formData}
                    onChange={(fields) =>
                      handleFieldChange({
                        declaration: {
                          ...formData.declaration,
                          ...fields,
                        } as ApplicantDeclaration,
                      })
                    }
                  />
                )}

                {/* Stepper Navigation Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => goToStep(currentStep - 1)}
                        className="text-xs"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        <span>Kembali ke Langkah {currentStep - 1}</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleNext}
                      className="bg-gov-800 text-xs text-white hover:bg-gov-900 font-bold px-4 py-2"
                    >
                      {currentStep < 6 ? (
                        <>
                          <span>Langkah Seterusnya (Langkah {currentStep + 1})</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1 text-gold-300" />
                          <span>Hantar & Semak Pra-Pematuhan SmartCheck</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
    </ProtectedRoute>
  );
}
