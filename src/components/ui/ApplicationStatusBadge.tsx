import React from "react";
import { ApplicationStatus } from "@/types/application";
import { Badge, BadgeProps } from "./Badge";
import {
  FileEdit,
  Send,
  FileSearch,
  FileCheck2,
  Cpu,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";

export interface ApplicationStatusBadgeProps extends Omit<BadgeProps, "children"> {
  status: ApplicationStatus | string;
  showIcon?: boolean;
}

interface StatusMeta {
  label: string;
  variant: BadgeProps["variant"];
  icon: React.ComponentType<{ className?: string }>;
}

export const STATUS_LOCALIZATION: Record<ApplicationStatus, StatusMeta> = {
  DRAFT: {
    label: "Draf",
    variant: "neutral",
    icon: FileEdit,
  },
  SUBMITTED: {
    label: "Dihantar",
    variant: "info",
    icon: Send,
  },
  DOCUMENT_CHECK: {
    label: "Semakan Dokumen",
    variant: "info",
    icon: FileSearch,
  },
  AWAITING_DOCUMENT_COMPLETION: {
    label: "Menunggu Lengkap Dokumen",
    variant: "warning",
    icon: AlertCircle,
  },
  DOCUMENT_COMPLETE: {
    label: "Dokumen Lengkap",
    variant: "info",
    icon: FileCheck2,
  },
  AI_PROCESSING: {
    label: "Pemprosesan AI",
    variant: "gold",
    icon: Cpu,
  },
  SMARTCHECK_READY: {
    label: "SmartCheck Sedia",
    variant: "info",
    icon: CheckCircle2,
  },
  SMARTCHECK_COMPLETED: {
    label: "SmartCheck Selesai",
    variant: "info",
    icon: CheckCircle2,
  },
  OFFICER_REVIEW: {
    label: "Semakan Pegawai",
    variant: "warning",
    icon: UserCheck,
  },
  REQUEST_INFORMATION: {
    label: "Maklumat Tambahan Diperlukan",
    variant: "danger",
    icon: AlertCircle,
  },
  WAITING_APPLICANT: {
    label: "Menunggu Tindakan Pemohon",
    variant: "warning",
    icon: AlertCircle,
  },
  RESUBMITTED: {
    label: "Dihantar Semula",
    variant: "info",
    icon: RotateCcw,
  },
  RECHECK_REQUIRED: {
    label: "Semakan Semula Diperlukan",
    variant: "warning",
    icon: RotateCcw,
  },
  VERIFIED: {
    label: "Disahkan",
    variant: "success",
    icon: ShieldCheck,
  },
  VERIFIED_COMMENT_READY: {
    label: "Ulasan Disahkan Sedia",
    variant: "success",
    icon: ShieldCheck,
  },
  REPORT_READY: {
    label: "Laporan Sedia",
    variant: "success",
    icon: FileCheck2,
  },
  COMPLETED: {
    label: "Selesai",
    variant: "success",
    icon: CheckCheck,
  },
  WITHDRAWN: {
    label: "Ditarik Balik",
    variant: "neutral",
    icon: AlertCircle,
  },
  CANCELLED: {
    label: "Dibatalkan",
    variant: "danger",
    icon: AlertCircle,
  },
};

/**
 * Government Localized Application Status Badge
 * Never displays raw technical enum strings to end users.
 */
export function ApplicationStatusBadge({
  status,
  showIcon = true,
  className,
  size = "md",
  ...props
}: ApplicationStatusBadgeProps) {
  const meta =
    STATUS_LOCALIZATION[status as ApplicationStatus] || {
      label: status,
      variant: "neutral",
      icon: AlertCircle,
    };

  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} size={size} className={className} {...props}>
      {showIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>{meta.label}</span>
    </Badge>
  );
}
