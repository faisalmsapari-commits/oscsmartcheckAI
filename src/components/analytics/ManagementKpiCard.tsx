import React from "react";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

export interface ManagementKpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  target?: {
    value: number;
    variance: number;
    met: boolean;
  };
  badgeColor?: "blue" | "emerald" | "amber" | "red" | "slate";
}

export function ManagementKpiCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  target,
  badgeColor = "slate",
}: ManagementKpiCardProps) {
  const badgeStyles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-800 border-red-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <Card className={`p-4 border-l-4 shadow-2xs ${
      badgeColor === "emerald"
        ? "border-l-emerald-600"
        : badgeColor === "amber"
        ? "border-l-amber-500"
        : badgeColor === "red"
        ? "border-l-red-600"
        : badgeColor === "blue"
        ? "border-l-blue-600"
        : "border-l-gov-800"
    } space-y-2`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </span>
        {Icon && (
          <div className={`rounded-sm p-1.5 border ${badgeStyles[badgeColor]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {unit && <span className="text-sm font-bold text-slate-600">{unit}</span>}
      </div>

      {subtitle && <p className="text-xs text-slate-600 font-medium">{subtitle}</p>}

      {trend && (
        <div className="flex items-center gap-1 text-[11px]">
          {trend.value > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span
            className={
              trend.isPositive
                ? "font-semibold text-emerald-700"
                : trend.value < 0
                ? "font-semibold text-red-700"
                : "text-slate-600"
            }
          >
            {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}

      {target && (
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
          <span className="text-slate-500">Sasaran: {target.value}</span>
          <span
            className={`font-semibold ${
              target.met ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {target.met ? "✓ Tercapai" : `Beza: ${target.variance > 0 ? `+${target.variance}` : target.variance}`}
          </span>
        </div>
      )}
    </Card>
  );
}
