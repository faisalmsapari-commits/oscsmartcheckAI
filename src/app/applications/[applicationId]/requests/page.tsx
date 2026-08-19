/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { RequestForInformation } from "@/types/workflow";
import {
  FileText,
  Clock,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

export default function ApplicationRequestsPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [requests, setRequests] = useState<RequestForInformation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user || !applicationId) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/applications/${applicationId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-gov-800" />
                  Permintaan Maklumat & Pelan Pinda (RFI)
                </h1>
                <p className="text-xs text-slate-500">
                  Senarai permintaan maklumat rasmi daripada pegawai OSC untuk permohonan ini.
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={loadRequests}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gov-800" />
            </div>
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Tiada Permintaan Maklumat Aktif
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Pegawai OSC belum mengeluarkan sebarang permintaan maklumat atau pindaan bagi permohonan ini.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((rfi) => (
                <div
                  key={rfi.requestId}
                  className="rounded-sm border border-slate-200 bg-white p-4 transition-colors hover:border-gov-800"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gov-800">
                          {rfi.requestType}
                        </span>
                        <span
                          className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                            rfi.status === "ISSUED" || rfi.status === "VIEWED"
                              ? "bg-amber-100 text-amber-900"
                              : rfi.status === "RESPONDED"
                              ? "bg-blue-100 text-blue-900"
                              : rfi.status === "SATISFIED"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {rfi.status}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-900">{rfi.title}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2">{rfi.description}</p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500">
                        {rfi.responseDeadline && (
                          <span className="flex items-center gap-1 text-red-700 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Tarikh Akhir: {new Date(rfi.responseDeadline).toLocaleDateString("ms-MY")}
                          </span>
                        )}
                        <span>
                          Dikeluarkan: {new Date(String(rfi.createdAt)).toLocaleDateString("ms-MY")}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link href={`/applications/${applicationId}/requests/${rfi.requestId}`}>
                        <Button size="sm" className="w-full sm:w-auto text-xs">
                          {rfi.status === "ISSUED" || rfi.status === "VIEWED"
                            ? "Beri Maklum Balas"
                            : "Lihat Butiran"}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
