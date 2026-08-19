import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-gov-100 text-gov-800 border-gov-300",
    success: "bg-emerald-50 text-emerald-800 border-emerald-300",
    warning: "bg-amber-50 text-amber-900 border-amber-300",
    danger: "bg-rose-50 text-rose-900 border-rose-300",
    info: "bg-sky-50 text-sky-900 border-sky-300",
    neutral: "bg-slate-100 text-slate-800 border-slate-300",
    gold: "bg-gold-50 text-gold-900 border-gold-300",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-semibold tracking-wide",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border uppercase",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
