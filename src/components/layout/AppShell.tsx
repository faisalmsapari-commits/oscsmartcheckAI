import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DisclaimerBanner } from "../ui/DisclaimerBanner";

export interface AppShellProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export function AppShell({ children, showDisclaimer = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 antialiased">
      <Header />
      {showDisclaimer && (
        <div className="border-b border-amber-200/80 bg-amber-50/90">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            <DisclaimerBanner compact />
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
