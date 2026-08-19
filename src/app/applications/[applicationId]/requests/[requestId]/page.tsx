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
import { RequestForInformation, ApplicantResponse } from "@/types/workflow";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  HelpCircle,
  Upload,
} from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const requestId = params?.requestId as string;
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestForInformation | null>(null);
  const [responses, setResponses] = useState<ApplicantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!user || !applicationId || !requestId) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
        setResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Failed to load request:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId, requestId]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !responseText.trim()) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/requests/${requestId}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responseText,
          relatedDocumentIds: [],
        }),
      });

      if (res.ok) {
        setStatusMessage("Maklum balas anda telah berjaya dihantar kepada pegawai OSC.");
        setResponseText("");
        loadData();
      } else {
        const err = await res.json();
        setStatusMessage(`Ralat: ${err.error || "Gagal menghantar maklum balas"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Ralat: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/applications/${applicationId}/requests`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali ke Senarai RFI
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-gov-800" />
                Butiran Permintaan Maklumat (RFI)
              </h1>
              <p className="text-xs text-slate-500">
                Maklumat rasmi yang diperlukan oleh OSC bagi meneruskan proses permohonan.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gov-800" />
            </div>
          ) : !request ? (
            <Card className="p-8 text-center text-slate-500 text-xs">
              Permintaan maklumat tidak dijumpai.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card headerTitle="Permintaan Pegawai OSC" className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gov-800 uppercase">
                      {request.requestType}
                    </span>
                    <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                      {request.status}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{request.title}</h2>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-sm border border-slate-100">
                    {request.description}
                  </p>

                  {request.requiredDocumentTypes && request.requiredDocumentTypes.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-slate-800">
                        Dokumen Yang Perlu Dimuat Naik:
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-600">
                        {request.requiredDocumentTypes.map((docType, idx) => (
                          <li key={idx}>{docType}</li>
                        ))}
                      </ul>
                      <div className="pt-2">
                        <Link href={`/applications/${applicationId}/documents`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Muat Naik Dokumen Pinda Di Bahagian Dokumen
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Submit Response Card */}
                {request.status !== "SATISFIED" && (
                  <Card headerTitle="Kemukakan Maklum Balas / Penjelasan" className="p-6">
                    <form onSubmit={handleSubmitResponse} className="space-y-4">
                      {statusMessage && (
                        <div
                          className={`p-3 text-xs rounded-sm ${
                            statusMessage.startsWith("Ralat")
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {statusMessage}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                          Ulasan / Penjelasan Pemohon:
                        </label>
                        <textarea
                          rows={5}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          required
                          placeholder="Nyatakan penjelasan atau rujukan kepada dokumen pinda yang telah dimuat naik..."
                          className="w-full rounded-sm border border-slate-300 p-3 text-xs text-slate-900 focus:border-gov-800 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={submitting || !responseText.trim()}>
                          {submitting ? (
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Hantar Maklum Balas
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Responses History */}
                {responses.length > 0 && (
                  <Card headerTitle="Sejarah Maklum Balas" className="p-6 space-y-4">
                    {responses.map((resp) => (
                      <div
                        key={resp.responseId}
                        className="rounded-sm border border-slate-200 p-4 space-y-2 bg-slate-50/50"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            Maklum Balas #{resp.responseId.slice(0, 6)}
                          </span>
                          <span className="rounded-sm bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                            {resp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line">
                          {resp.responseText}
                        </p>
                        {resp.reviewComment && (
                          <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600 bg-amber-50 p-2 rounded-sm">
                            <strong>Ulasan Pegawai:</strong> {resp.reviewComment}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          Dihantar pada: {new Date(String(resp.createdAt)).toLocaleString("ms-MY")}
                        </span>
                      </div>
                    ))}
                  </Card>
                )}
              </div>

              {/* Sidebar Metadata */}
              <div className="space-y-6">
                <Card headerTitle="Status Permintaan" className="p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <span className="font-bold text-slate-800">{request.status}</span>
                  </div>
                  {request.responseDeadline && (
                    <div>
                      <span className="text-slate-500 block">Tarikh Akhir:</span>
                      <span className="font-bold text-red-700">
                        {new Date(request.responseDeadline).toLocaleDateString("ms-MY")}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Tarikh Dikeluarkan:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(String(request.createdAt)).toLocaleDateString("ms-MY")}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
