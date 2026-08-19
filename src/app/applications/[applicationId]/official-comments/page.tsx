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
import { VerifiedComment } from "@/types/comments";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";

export default function OfficialCommentsPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [comments, setComments] = useState<VerifiedComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublicComments() {
      if (!user || !applicationId) return;
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await fetch(`/api/applications/${applicationId}/comments/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err: unknown) {
        console.warn("Failed to load comments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicComments();
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
                  <span className="text-gov-800">Ulasan Rasmi OSC</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  ULASAN RASMI ONE STOP CENTRE (OSC)
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/applications/${applicationId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Kembali</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Explanatory Notice */}
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <strong>Ulasan Disahkan & Diterbitkan:</strong> Ulasan di bawah merupakan perakuan teknikal yang telah disemak, disahkan, dan diterbitkan secara rasmi oleh Pegawai Penilai Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Memuatkan ulasan rasmi...</div>
            ) : comments.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-500">
                <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="font-bold text-sm text-slate-800">Belum Ada Ulasan Rasmi Diterbitkan</p>
                <p className="mt-1">Ulasan teknikal OSC akan dipaparkan di sini setelah disahkan dan diterbitkan oleh pihak Majlis.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comm) => (
                  <Card key={comm.commentId} className="border-l-4 border-l-gov-800 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-slate-900">Ulasan Teknikal OSC (Versi {comm.version})</h3>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Disahkan pada: {String(comm.verifiedAt || comm.createdAt)}
                      </div>
                    </div>

                    <div className="mt-4 prose prose-slate max-w-none text-xs">
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded-sm border border-slate-100">
                        {comm.finalText}
                      </pre>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-mono">Checksum: {comm.checksum.slice(0, 12)}...</span>
                      <Link href={`/applications/${applicationId}/requirements`}>
                        <Button variant="outline" size="sm" className="text-xs text-gov-800">
                          <span>Lihat Senarai Tindakan Pemohon</span>
                        </Button>
                      </Link>
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
