import React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerTitle?: string;
  headerAction?: React.ReactNode;
}

export function Card({ children, className, headerTitle, headerAction, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
        className
      )}
      {...props}
    >
      {headerTitle && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">
            {headerTitle}
          </h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
