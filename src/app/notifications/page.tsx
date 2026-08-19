/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { NotificationRecord } from "@/types/workflow";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Inbox,
} from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/notifications?unread=${filter === "UNREAD"}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/notifications/${notifId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notifId ? { ...n, status: "READ" } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch("/api/notifications", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-6 w-6 text-gov-800" />
                Pusat Pemberitahuan Rasmi
              </h1>
              <p className="text-xs text-slate-600">
                Pemberitahuan status, permintaan maklumat, pengesahan ulasan dan laporan permohonan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                className="text-xs"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Tanda Semua Telah Dibaca
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
                className="text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setFilter("ALL")}
              className={`border-b-2 px-4 py-2.5 transition-colors ${
                filter === "ALL"
                  ? "border-gov-800 text-gov-800 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua Pemberitahuan
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`border-b-2 px-4 py-2.5 transition-colors ${
                filter === "UNREAD"
                  ? "border-gov-800 text-gov-800 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Belum Dibaca
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gov-800" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">Tiada pemberitahuan.</p>
              <p className="text-xs text-slate-500 mt-1">
                Semua notifikasi terkini akan dipaparkan di sini.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const isUnread = n.status === "SENT";
                return (
                  <div
                    key={n.notificationId}
                    className={`rounded-sm border p-4 transition-colors ${
                      isUnread
                        ? "bg-amber-50/50 border-amber-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {n.priority === "HIGH" || n.priority === "URGENT" ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gov-800" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {n.title}
                            </span>
                            {isUnread && (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                Baru
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[11px] text-slate-400 block pt-1">
                            {new Date(String(n.createdAt)).toLocaleString("ms-MY")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {n.actionUrl && (
                          <Link href={n.actionUrl} onClick={() => markAsRead(n.notificationId)}>
                            <Button size="sm" className="text-xs">
                              Buka Tindakan
                              <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        {isUnread && (
                          <button
                            onClick={() => markAsRead(n.notificationId)}
                            className="text-xs text-slate-500 hover:text-slate-800 underline"
                          >
                            Tanda Dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
