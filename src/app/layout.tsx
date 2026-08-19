import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BrandingProvider } from "@/lib/branding/BrandingContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSC SmartCheck AI — Majlis Perbandaran Langkawi Bandaraya Pelancongan",
  description:
    "Intelligent Planning Compliance & Decision Support System (Kebenaran Merancang) — Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)",
  keywords: [
    "OSC SmartCheck AI",
    "MPLBP",
    "Kebenaran Merancang",
    "Langkawi Planning Permission",
    "Smart Compliance",
    "RTD Langkawi 2030",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <AuthProvider>
          <BrandingProvider>{children}</BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

