import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Column 1: Organization */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
              Majlis Perbandaran Langkawi Bandaraya Pelancongan
            </h4>
            <p className="text-xs text-slate-500">
              Pusat Transformasi Bandar (UTC) & Kompleks MPLBP, Kuah, 07000 Langkawi, Kedah Darul
              Aman.
            </p>
            <p className="text-xs text-slate-500">
              Tel: +604-966 6599 | Emel: osc@mplbp.gov.my
            </p>
          </div>

          {/* Column 2: Governance & Guidelines */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
              Rujukan Perundangan
            </h4>
            <ul className="space-y-1 text-xs text-slate-500">
              <li>Akta Perancangan Bandar dan Desa 1976 (Akta 172)</li>
              <li>Akta Jalan, Parit dan Bangunan 1974 (Akta 133)</li>
              <li>Rancangan Tempatan Daerah (RTD) Langkawi 2030</li>
              <li>Undang-Undang Kecil Bangunan Seragam (UKBS 1984)</li>
            </ul>
          </div>

          {/* Column 3: Security & Verification Assurance */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
              Jaminan Integriti Keputusan
            </h4>
            <p className="text-xs text-slate-500">
              Sistem mematuhi tatacara audit staturori. Enjin perundangan beroperasi secara bebas
              dan keputusan muktamad disahkan oleh Pegawai OSC yang diberi kuasa.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <span>Sistem Dilindungi Garis Panduan Keselamatan Siber Sektor Awam</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-6 flex flex-col items-center justify-between border-t border-slate-200 pt-4 text-center text-xs text-slate-500 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).
            Hak Cipta Terpelihara.
          </div>
          <div className="mt-2 flex items-center gap-4 sm:mt-0">
            <Link href="/unauthorized" className="hover:text-slate-800 hover:underline">
              Dasar Keselamatan
            </Link>
            <Link href="/unauthorized" className="hover:text-slate-800 hover:underline">
              Dasar Privasi
            </Link>
            <span>v0.1.0 (Module 01 Scaffold)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
