import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-gov-700 hover:bg-gov-800 text-white border-gov-800 shadow-sm focus:ring-gov-500",
      secondary:
        "bg-slate-700 hover:bg-slate-800 text-white border-slate-800 shadow-sm focus:ring-slate-400",
      outline:
        "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm focus:ring-gov-500",
      danger:
        "bg-rose-700 hover:bg-rose-800 text-white border-rose-800 shadow-sm focus:ring-rose-500",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 border-transparent focus:ring-gov-500",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs font-medium rounded-sm",
      md: "px-4 py-2 text-sm font-medium rounded-sm",
      lg: "px-5 py-2.5 text-base font-medium rounded-sm",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
