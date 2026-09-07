"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole, ALLOWED_USER_ROLES } from "@/types/common";
import { getDemoSystemUsers, DemoSystemUser } from "@/lib/seed/demoData";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Key,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Building2,
  Mail,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, role: currentUserRole } = useAuth();

  const initialUsers = getDemoSystemUsers();
  const [users, setUsers] = useState<DemoSystemUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Notifications
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals
  const [editingUser, setEditingUser] = useState<DemoSystemUser | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("OSC_OFFICER");
  const [targetOrgId, setTargetOrgId] = useState("MPLBP");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("OSC_OFFICER");
  const [newUserDept, setNewUserDept] = useState("Unit Pusat Setempat (OSC)");
  const [newUserDesignation, setNewUserDesignation] = useState("Pegawai Semakan OSC");
  const [isAddingUser, setIsAddingUser] = useState(false);

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(currentUserRole || "");

  const loadUsers = async () => {
    if (!user) return;
    try {
      if (users.length === 0) setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
        }
      }
    } catch (err: unknown) {
      console.warn("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active) ||
        (statusFilter === "INACTIVE" && !u.active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const managers = users.filter((u) => u.role.includes("MANAGER")).length;
    const admins = users.filter((u) => ["ADMIN", "SUPER_ADMIN"].includes(u.role)).length;
    const applicants = users.filter((u) => u.role === "APPLICANT").length;
    return { total, active, managers, admins, applicants };
  }, [users]);

  // Handle Role Change
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setStatusMessage(null);
    setIsUpdatingRole(true);

    try {
      const token = user ? await user.getIdToken() : "mock-token";
      const res = await fetch(`/api/admin/users/${editingUser.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: targetRole,
          organizationId: targetOrgId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengemaskini peranan pengguna.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === editingUser.uid ? { ...u, role: targetRole, organizationId: targetOrgId } : u
        )
      );

      setStatusMessage({
        type: "success",
        text: `Berjaya menukar peranan '${editingUser.displayName}' kepada '${targetRole}'. Custom Claims & rekod audit telah dikemaskini.`,
      });
      setEditingUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ralat mengemaskini peranan";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (targetUser: DemoSystemUser) => {
    setStatusMessage(null);
    const newStatus = !targetUser.active;

    try {
      const token = user ? await user.getIdToken() : "mock-token";
      const res = await fetch(`/api/admin/users/${targetUser.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengemaskini status pengguna.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, active: newStatus } : u))
      );

      setStatusMessage({
        type: "success",
        text: `Berjaya ${newStatus ? "mengaktifkan" : "menyenyahaktifkan"} akaun '${targetUser.displayName}'.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ralat mengemaskini status akaun";
      setStatusMessage({ type: "error", text: message });
    }
  };

  // Handle Add New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    setStatusMessage(null);
    setIsAddingUser(true);

    try {
      const token = user ? await user.getIdToken() : "mock-token";
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          displayName: newUserName,
          role: newUserRole,
          department: newUserDept,
          designation: newUserDesignation,
          organizationId: "MPLBP",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftarkan pengguna baharu.");
      }

      if (data.user) {
        setUsers((prev) => [data.user, ...prev]);
      }

      setStatusMessage({
        type: "success",
        text: `Berjaya mendaftarkan pengguna baharu '${newUserName}' (${newUserRole}).`,
      });

      setShowAddUserModal(false);
      setNewUserEmail("");
      setNewUserName("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ralat mendaftarkan pengguna baharu";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setIsAddingUser(false);
    }
  };

  const getRoleBadgeVariant = (userRole: UserRole) => {
    switch (userRole) {
      case "SUPER_ADMIN":
        return "danger";
      case "ADMIN":
        return "warning";
      case "OSC_MANAGER":
      case "PLANNING_MANAGER":
        return "info";
      case "OSC_OFFICER":
      case "PLANNING_OFFICER":
      case "GIS_OFFICER":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell>
        <div className="flex min-h-[calc(100vh-140px)] flex-col md:flex-row">
          <Sidebar currentTab="admin_users" />

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Link href="/admin" className="hover:text-gov-800">
                    Panel Pentadbiran
                  </Link>
                  <span>/</span>
                  <span className="text-gov-800">Pengurusan Pengguna System (RBAC)</span>
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Konsol Pentadbiran Pengguna & Peranan
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  className="text-xs font-semibold"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Pengguna Baharu</span>
                </Button>
              </div>
            </div>

            {/* Notification Alert Banner */}
            {statusMessage && (
              <div
                className={`flex items-center justify-between rounded-sm border p-3.5 text-xs ${
                  statusMessage.type === "success"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-rose-300 bg-rose-50 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  {statusMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-700" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-medium">Jumlah Pengguna</span>
                  <Users className="h-4 w-4 text-gov-600" />
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">{metrics.total}</div>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-medium">Pegawai Aktif</span>
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-700">{metrics.active}</div>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-medium">Pengurus & Ketua</span>
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-1 text-xl font-bold text-blue-700">{metrics.managers}</div>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-medium">Pentadbir (Admin)</span>
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-1 text-xl font-bold text-amber-700">{metrics.admins}</div>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-medium">Pemohon / PSP</span>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="mt-1 text-xl font-bold text-purple-700">{metrics.applicants}</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <Card>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pengguna, e-mel, UID atau jabatan..."
                    className="w-full rounded-sm border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <span>Peranan:</span>
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                  >
                    <option value="ALL">Semua Peranan</option>
                    {ALLOWED_USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif Sahaja</option>
                    <option value="INACTIVE">Nyahaktif Sahaja</option>
                  </select>

                  <Button
                    variant="outline"
                    className="py-1.5 text-xs"
                    onClick={loadUsers}
                    title="Muat Semula Senarai Pengguna"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Users Table */}
            <Card className="[&>div:last-child]:p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Maklumat Pengguna</th>
                      <th className="px-4 py-3">Peranan (Custom Claim)</th>
                      <th className="px-4 py-3">Jabatan & Jawatan</th>
                      <th className="px-4 py-3">Status Akaun</th>
                      <th className="px-4 py-3">Tindakan Pentadbir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="font-semibold">Tiada rekod pengguna dijumpai</p>
                          <p className="text-[11px] mt-1">Cuba tukar carian atau penapis peranan.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 uppercase">
                                {u.displayName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{u.displayName}</div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <span>{u.email}</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">UID: {u.uid}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                            <div className="text-[10px] text-slate-500 mt-1">Org: {u.organizationId}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{u.department}</div>
                            <div className="text-[11px] text-slate-500">{u.designation}</div>
                          </td>

                          <td className="px-4 py-3">
                            {u.active ? (
                              <Badge variant="success">Aktif</Badge>
                            ) : (
                              <Badge variant="danger">Nyahaktif</Badge>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(u.lastActive).toLocaleDateString("ms-MY", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                className="h-7 px-2 text-[11px] font-medium"
                                onClick={() => {
                                  setEditingUser(u);
                                  setTargetRole(u.role);
                                  setTargetOrgId(u.organizationId);
                                }}
                                disabled={!isAdmin}
                                title="Tukar Peranan Custom Claim"
                              >
                                <Key className="h-3 w-3 text-amber-600 mr-1" />
                                Peranan
                              </Button>

                              <Button
                                variant={u.active ? "outline" : "secondary"}
                                className="h-7 px-2 text-[11px] font-medium"
                                onClick={() => handleToggleStatus(u)}
                                disabled={!isAdmin}
                                title={u.active ? "Nyahaktifkan Akaun" : "Aktifkan Akaun"}
                              >
                                {u.active ? (
                                  <>
                                    <UserX className="h-3 w-3 text-rose-600 mr-1" />
                                    Nyahaktif
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3 w-3 text-emerald-600 mr-1" />
                                    Aktifkan
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Role Change Modal */}
            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Key className="h-4 w-4 text-amber-600" />
                      <span>Tukar Peranan Pengguna (RBAC)</span>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateRole} className="mt-4 space-y-4">
                    <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="font-bold text-slate-900">{editingUser.displayName}</div>
                      <div className="text-slate-500">{editingUser.email}</div>
                      <div className="mt-1 font-mono text-[11px] text-slate-400">UID: {editingUser.uid}</div>
                    </div>

                    {!isSuperAdmin && (
                      <div className="rounded-sm border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <strong>Nota Pentadbir:</strong> Penukaran peranan akan merekodkan log audit keselamatan. Pengguna dikehendaki log masuk semula untuk kemas kini token.
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">
                        Peranan Baharu (Custom Claim)
                      </label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value as UserRole)}
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      >
                        {ALLOWED_USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase">
                        Kod Organisasi
                      </label>
                      <input
                        type="text"
                        value={targetOrgId}
                        onChange={(e) => setTargetOrgId(e.target.value)}
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setEditingUser(null)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isUpdatingRole}
                        className="text-xs font-semibold"
                      >
                        Simpan Peranan Baharu
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add New User Modal */}
            {showAddUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                <div className="w-full max-w-lg rounded-sm border border-slate-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Plus className="h-4 w-4 text-gov-600" />
                      <span>Daftar Pengguna Baharu Sistem</span>
                    </div>
                    <button
                      onClick={() => setShowAddUserModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddUser} className="mt-4 space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase">
                        Nama Penuh Pengguna *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Contoh: En. Ahmad Shahir"
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase">
                        Alamat E-mel Rasmi *
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="shahir.perancang@mplbp.gov.my"
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block font-semibold text-slate-700 uppercase">
                          Peranan Sistem *
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                          className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                        >
                          {ALLOWED_USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 uppercase">
                          Jabatan / Unit
                        </label>
                        <input
                          type="text"
                          value={newUserDept}
                          onChange={(e) => setNewUserDept(e.target.value)}
                          placeholder="Jabatan Perancangan Bandar"
                          className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase">
                        Jawatan & Gred
                      </label>
                      <input
                        type="text"
                        value={newUserDesignation}
                        onChange={(e) => setNewUserDesignation(e.target.value)}
                        placeholder="Pegawai Perancang Bandar (J41)"
                        className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-gov-600 focus:ring-1 focus:ring-gov-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setShowAddUserModal(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isAddingUser}
                        className="text-xs font-semibold"
                      >
                        Daftar Pengguna
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
