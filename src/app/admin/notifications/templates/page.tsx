/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { NotificationTemplate } from "@/types/workflow";
import {
  Mail,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function AdminNotificationTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/notifications/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex gap-6">
          <Sidebar />

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="h-6 w-6 text-gov-800" />
                    Pengurusan Templat Notifikasi
                  </h1>
                  <p className="text-xs text-slate-500">
                    Konfigurasi templat mesej rasmi bagi sistem pemberitahuan OSC SmartCheck.
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gov-800" />
              </div>
            ) : templates.length === 0 ? (
              <Card className="p-12 text-center text-xs text-slate-500">
                Tiada templat notifikasi berdaftar.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <Card
                    key={tpl.templateId}
                    headerTitle={tpl.subject}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gov-800 uppercase">
                        {tpl.eventType}
                      </span>
                      <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                        v{tpl.version} • {tpl.channel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-sm border border-slate-100 whitespace-pre-line">
                      {tpl.body}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <span className="font-bold block">Pembolehubah Dibenarkan:</span>
                      <div className="flex flex-wrap gap-1">
                        {tpl.allowedVariables?.map((v) => (
                          <span
                            key={v}
                            className="rounded-sm bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
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
