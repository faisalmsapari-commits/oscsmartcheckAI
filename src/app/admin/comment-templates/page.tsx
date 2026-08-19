"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { StandardPhraseTemplate } from "@/types/comments";
import { BookOpen, Plus, CheckCircle2 } from "lucide-react";

export default function AdminCommentTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<StandardPhraseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("PARKING");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTemplates = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/comment-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err: unknown) {
      console.warn("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddTemplate = async () => {
    if (!user || !name.trim() || !text.trim()) return;
    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/comment-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          text,
          isLocked: false,
          status: "ACTIVE",
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setText("");
        setSuccessMessage("Templat frasa piawai berjaya ditambah.");
        await loadTemplates();
      }
    } catch (err: unknown) {
      console.warn("Error creating template:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "OSC_OFFICER"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/admin" className="hover:text-gov-800">
                    Pentadbiran Sistem
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pustaka Frasa Piawai</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1">
                  PUSTAKA FRASA & TEMPLAT ULASAN OSC
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="bg-gov-800 text-xs hover:bg-gov-900"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Tambah Frasa Piawai</span>
                </Button>
              </div>
            </div>

            {successMessage && (
              <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuatkan pustaka frasa...</div>
            ) : templates.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-500">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="font-bold text-sm text-slate-800">Tiada Frasa Piawai Didaftarkan</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {templates.map((tpl) => (
                  <Card key={tpl.templateId} className="p-4 border-l-4 border-l-gov-800 space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs text-slate-900">{tpl.name}</h3>
                      <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-sm border border-slate-100">
                      {tpl.text}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
                Tambah Frasa Piawai Ulasan
              </h3>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Nama / Tajuk Frasa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Peringatan TLK Kereta"
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  >
                    <option value="PARKING">PARKING</option>
                    <option value="OPEN_SPACE">OPEN_SPACE</option>
                    <option value="RTD">RTD</option>
                    <option value="PLOT_RATIO">PLOT_RATIO</option>
                    <option value="HOUSING">HOUSING</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Teks Frasa Piawai</label>
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Masukkan teks frasa yang telah diluluskan..."
                    className="w-full rounded-sm border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddTemplate}
                    disabled={!name.trim() || !text.trim() || isSubmitting}
                    className="bg-gov-800 text-xs hover:bg-gov-900"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Frasa"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
