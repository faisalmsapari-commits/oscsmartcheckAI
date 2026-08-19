"use client";

import React from "react";
import {
  ClipboardList,
  Users,
  Building2,
  MapPin,
  SlidersHorizontal,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

export interface StepperStep {
  id: number;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
}

export const APPLICATION_STEPS: StepperStep[] = [
  {
    id: 1,
    title: "Maklumat Permohonan",
    shortTitle: "Permohonan",
    icon: ClipboardList,
  },
  {
    id: 2,
    title: "Maklumat Pemohon & PSP",
    shortTitle: "Pemohon",
    icon: Users,
  },
  {
    id: 3,
    title: "Maklumat Projek",
    shortTitle: "Projek",
    icon: Building2,
  },
  {
    id: 4,
    title: "Maklumat Tapak & Lot",
    shortTitle: "Tapak & Lot",
    icon: MapPin,
  },
  {
    id: 5,
    title: "Parameter Pembangunan",
    shortTitle: "Parameter",
    icon: SlidersHorizontal,
  },
  {
    id: 6,
    title: "Akuan & Semakan",
    shortTitle: "Akuan",
    icon: ShieldCheck,
  },
];

interface ApplicationFormStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReachedStep?: number;
}

export function ApplicationFormStepper({
  currentStep,
  onStepClick,
}: ApplicationFormStepperProps) {
  return (
    <nav aria-label="Langkah Borang Permohonan" className="w-full">
      <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-slate-200 bg-slate-100/70 p-3 sm:p-4">
        {APPLICATION_STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const StepIcon = step.icon;

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                title={`Klik untuk pergi ke Seksyen ${step.id}: ${step.title}`}
                className={`group flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                  isCurrent
                    ? "bg-gov-800 border-gov-900 text-white shadow-sm ring-2 ring-gold-400/80"
                    : "bg-white border-slate-200/90 text-slate-700 hover:bg-gov-50 hover:border-gov-300 hover:text-gov-900 shadow-2xs"
                }`}
              >
                {/* Step Icon & Number Badge */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors ${
                    isCurrent
                      ? "bg-gold-400 text-gov-950 font-bold shadow-xs"
                      : "bg-slate-100 text-slate-600 group-hover:bg-gov-200 group-hover:text-gov-900"
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>

                {/* Step Text Info */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isCurrent ? "text-gold-300" : "text-slate-600 group-hover:text-gov-700"
                    }`}
                  >
                    Langkah {step.id}
                  </div>
                  <div
                    className={`truncate text-xs sm:text-sm font-bold leading-tight ${
                      isCurrent ? "text-white" : "text-slate-800 group-hover:text-gov-950"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
