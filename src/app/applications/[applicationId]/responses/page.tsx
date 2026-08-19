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
  FileCheck2,
  ArrowLeft,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

export default function OfficerResponsesReviewPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const { user } = useAuth();

  const [requests, setRequests] = useState<RequestForInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const loadData = async () => {
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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId]);

  const handleReviewAction = async (
    requestId: string,
    responseId: string,
    action: "ACCEPT" | "PARTIAL_ACCEPT" | "REQUIRE_FURTHER"
  ) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/applications/${applicationId}/responses/${responseId}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            action,
            reviewComment:
              action === "ACCEPT"
                ? "Maklum balas diterima untuk semakan teknikal."
                : "Maklum balas memerlukan penjelasan lanjut.",
          }),
        }
      );

      if (res.ok) {
        setReviewMessage("Tindakan semakan maklum balas berjaya direkodkan.");
        loadData();
      }
    } catch (err: any) {
      setReviewMessage(`Ralat: ${err.message}`);
    }
  };

  const handleStartRecheck = async () => {
    if (!user) return;
    try {
      setRechecking(true);
      setReviewMessage(null);
      const token = await user.getIdToken();
      const res = await fetch(`/api/applications/${applicationId}/recheck`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReviewMessage(
          `Semakan semula SmartCheck berjaya diselesaikan. ${data.changeSummary?.resolvedIssuesCount || 0} isu terdahulu diselesaikan.`
        );
        loadData();
      } else {
        const err = await res.json();
        setReviewMessage(`Ralat semakan semula: ${err.error}`);
      }
    } catch (err: any) {
      setReviewMessage(`Ralat: ${err.message}`);
    } finally {
      setRechecking(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={[
        "OSC_OFFICER",
        "PLANNING_OFFICER",
        "OSC_MANAGER",
        "PLANNING_MANAGER",
        "ADMIN",
        "SUPER_ADMIN",
      ]}
    >
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/applications/${applicationId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali ke Permohonan
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="h-6 w-6 text-gov-800" />
                  Semakan Maklum Balas Pemohon & Pelan Pinda
                </h1>
                <p className="text-xs text-slate-500">
                  Semak respon pemohon, dokumen pinda, dan laksanakan semakan semula SmartCheck.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartRecheck}
                disabled={rechecking}
                className="text-xs"
              >
                {rechecking ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Proses Semakan Semula SmartCheck
              </Button>
            </div>
          </div>

          {reviewMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-sm">
              {reviewMessage}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gov-800" />
            </div>
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-500">
              Tiada rekod permintaan maklumat atau maklum balas bagi permohonan ini.
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((rfi) => (
                <Card
                  key={rfi.requestId}
                  headerTitle={`RFI: ${rfi.title}`}
                  className="p-6 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gov-800 uppercase">{rfi.requestType}</span>
                    <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                      Status RFI: {rfi.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-sm">
                    {rfi.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {rfi.status === "RESPONDED" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewAction(rfi.requestId, "resp-latest", "ACCEPT")}
                            className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          >
                            Terima Maklum Balas
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewAction(rfi.requestId, "resp-latest", "REQUIRE_FURTHER")}
                            className="text-xs text-amber-800 border-amber-300 hover:bg-amber-50"
                          >
                            Perlu Penjelasan Lanjut
                          </Button>
                        </>
                      )}
                    </div>
                    <Link href={`/applications/${applicationId}/requests/${rfi.requestId}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Buka Butiran & Maklum Balas
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
