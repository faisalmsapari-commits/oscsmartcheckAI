import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DisclaimerBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "warning" | "info";
  compact?: boolean;
}

export function DisclaimerBanner({
  className,
  variant = "warning",
  compact = false,
  ...props
}: DisclaimerBannerProps) {
  const isWarning = variant === "warning";

  return (
    <aside
      aria-label="Penafian Rasmi OSC SmartCheck AI"
      className={cn(
        "flex items-start gap-3 rounded-sm border px-3.5 py-2.5 transition-colors",
        isWarning
          ? "border-amber-300 bg-amber-50/80 text-amber-950"
          : "border-sky-300 bg-sky-50/80 text-sky-950",
        compact ? "py-2 text-xs" : "text-xs sm:text-sm",
        className
      )}
      {...props}
    >
      <div className="mt-0.5 shrink-0">
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 leading-relaxed">
        <strong className="font-semibold tracking-wide">PENAFIAN STATUTORI: </strong>
        <span>
          Analisis AI merupakan bantuan semakan dan tidak menggantikan keputusan atau pengesahan
          Pegawai OSC MPLBP. Segala keputusan pematuhan tertakluk kepada semakan rasmi dan
          kelulusan Mesyuarat Jawatankuasa OSC MPLBP.
        </span>
      </div>
    </aside>
  );
}
