"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { SmartCheckIssue } from "@/types/issues";
import { getDemoIssuesForApp } from "@/lib/seed/demoData";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";

export default function ApplicantRequirementsPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const initialIssues = applicationId ? (getDemoIssuesForApp(applicationId) as unknown as SmartCheckIssue[]) : [];
  const [issues, setIssues] = useState<SmartCheckIssue[]>(initialIssues);
  const [loading, setLoading] = useState(false);

  const fetchPublishedRequirements = async () => {
    if (!user || !applicationId) return;
    try {
      if (issues.length === 0) setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.issues && data.issues.length > 0) {
          setIssues(data.issues);
        }
      }
    } catch (err: unknown) {
      console.warn("Error fetching requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedRequirements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  return (
    <ProtectedRoute allowedRoles={["APPLICANT", "OSC_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="applications" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href={`/applications/${applicationId}`} className="hover:text-gov-800">
                    Maklumat Permohonan
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Tindakan Pemohon</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  PERKARA YANG MEMERLUKAN TINDAKAN / PINDAAN
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Kembali</span>
                  </Button>
                </Link>

                <Link href={`/applications/${applicationId}/documents`}>
                  <Button variant="primary" size="sm" className="bg-gov-800 text-xs hover:bg-gov-900">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    <span>Muat Naik Pindaan Dokumen</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Explanatory Notice */}
            <div className="rounded-sm border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
              <strong>Makluman Kepada Pemohon:</strong> Senarai di bawah mengandungi ulasan dan perkara teknikal yang telah disahkan oleh pegawai penilai untuk tindakan susulan atau pindaan dokumen LCP / pelan susunatur.
            </div>

            {/* Issues List */}
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Memuatkan senarai tindakan...</div>
            ) : issues.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-bold text-sm text-slate-800">Tiada Isu Tindakan Aktif</p>
                <p className="mt-1">Semua semakan pematuhan awal berada dalam keadaan memuaskan atau belum diterbitkan.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <Card key={issue.issueId} className="border-l-4 border-l-amber-600 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                        <h3 className="font-bold text-sm text-slate-900">{issue.title}</h3>
                      </div>
                      <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {issue.category} • {issue.severity}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500">Keterangan Penemuan:</span>
                        <p className="text-slate-800 mt-0.5">{issue.description}</p>
                      </div>

                      {issue.officerCommentDraft && (
                        <div className="rounded-sm bg-slate-50 p-2.5 border border-slate-200">
                          <span className="font-bold text-gov-800 block">Arahan / Ulasan Pegawai Penilai:</span>
                          <p className="text-slate-700 italic mt-0.5">{issue.officerCommentDraft}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>Status: <strong className="text-slate-800">{issue.status}</strong></span>
                        <Link href={`/applications/${applicationId}/documents`}>
                          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] text-gov-800">
                            Kemukakan Pindaan
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
