"use client";

import {
  hasAdminPermission,
  isSuperAdminSession,
  useAdminSession,
} from "@/components/admin/AdminSessionProvider";
import RequirePermission from "@/components/admin/RequirePermission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminPermissions,
  fetchAdminStaff,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/lib/api";
import { Eye, EyeOff, KeyRound, Loader2, Pencil, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type PermissionModule = {
  module: string;
  label: string;
  permissions: { code: string; label: string; type: string }[];
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  permissions: string[];
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  isActive: true,
  permissions: [],
};

const SUPER_ADMIN_ROLE_CODE = "SUPER_ADMIN";

function togglePermissionCode(
  current: string[],
  code: string,
  modulePerms: { code: string; type: string }[],
  checked: boolean
): string[] {
  const viewCode = modulePerms.find((p) => p.type === "view")?.code;
  if (!checked && code === viewCode) {
    const moduleCodes = new Set(modulePerms.map((p) => p.code));
    return current.filter((c) => !moduleCodes.has(c));
  }

  let next = checked
    ? [...new Set([...current, code])]
    : current.filter((c) => c !== code);

  if (checked && viewCode && code !== viewCode) {
    next = [...new Set([...next, viewCode])];
  }

  return next;
}

export default function AdminUsersPage() {
  const session = useAdminSession();
  const [users, setUsers] = useState<any[]>([]);
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState({ search: "", status: "ALL" as string, page: 1, limit: 25 });
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canCreate = hasAdminPermission(session, "admins.create");
  const canUpdate = hasAdminPermission(session, "admins.update");
  const canDelete = hasAdminPermission(session, "admins.delete");
  const canEditCurrent = editingUser ? canUpdate : canCreate;
  const isSuperAdminUser = (u: any) =>
    u?.role === "super_admin" || u?.roles?.some((r: any) => r.code === SUPER_ADMIN_ROLE_CODE);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAdminStaff({
        search: query.search || undefined,
        isActive: query.status === "ALL" ? undefined : query.status === "ACTIVE",
        page: query.page,
        limit: query.limit,
      });
      setUsers(r.data ?? []);
      setMeta({
        page: r.page ?? 1,
        limit: r.limit ?? 25,
        total: r.total ?? 0,
        totalPages: Math.ceil((r.total ?? 0) / (r.limit ?? 25)) || 1,
      });
    } catch {
      toast.error("Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    fetchAdminPermissions()
      .then((r) => setPermissionModules(r.data ?? []))
      .catch(() => toast.error("Failed to load permissions."));
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () =>
        setQuery((p) =>
          p.search === searchInput.trim() ? p : { ...p, search: searchInput.trim(), page: 1 }
        ),
      350
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  function startEdit(u: any) {
    setEditingUser(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      password: "",
      confirmPassword: "",
      isActive: u.isActive,
      permissions: u.permissions ?? [],
    });
  }

  function resetForm() {
    setEditingUser(null);
    setForm(initialForm);
  }

  async function submit() {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Name and email required.");
      return;
    }
    if (!editingUser && form.password.length < 8) {
      toast.error("Password must be 8+ chars.");
      return;
    }
    if (!editingUser && form.password !== form.confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        const payload: Record<string, unknown> = {
          fullName: form.fullName,
          email: form.email,
        };
        if (!isSuperAdminUser(editingUser)) {
          payload.isActive = form.isActive;
          payload.permissions = form.permissions;
        }
        await updateAdminUser(editingUser.id, payload);
      } else {
        await createAdminUser({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          isActive: form.isActive,
          permissions: form.permissions,
        });
      }
      toast.success(editingUser ? "User updated." : "User created.");
      resetForm();
      await loadUsers();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: any) {
    if (isSuperAdminUser(u)) return;
    try {
      await updateAdminUserStatus(u.id, !u.isActive);
      toast.success("Status updated.");
      await loadUsers();
    } catch {
      toast.error("Failed.");
    }
  }

  async function handleDelete(u: any) {
    if (isSuperAdminUser(u) || !window.confirm(`Delete ${u.email}?`)) return;
    setDeletingUserId(u.id);
    try {
      await deleteAdminUser(u.id);
      toast.success("Deleted.");
      if (editingUser?.id === u.id) resetForm();
      await loadUsers();
    } catch {
      toast.error("Failed.");
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleResetPassword(u: any) {
    if (isSuperAdminUser(u)) return;
    const pw = window.prompt(`New password for ${u.email}`);
    if (!pw || pw.trim().length < 8) {
      if (pw) toast.error("8+ chars required.");
      return;
    }
    try {
      await resetAdminUserPassword(u.id, pw.trim());
      toast.success("Password reset.");
    } catch {
      toast.error("Failed.");
    }
  }

  if (!isSuperAdminSession(session)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
        <p className="text-sm text-muted-foreground">Only super admins can manage admin users.</p>
      </div>
    );
  }

  return (
    <RequirePermission permission="admins.view">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Create admin accounts and assign sidebar access plus action permissions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              {editingUser ? "Update Admin User" : "Create Admin User"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Full Name"
                disabled={!canEditCurrent}
              />
              <Input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                disabled={!canEditCurrent}
              />
            </div>
            {!editingUser && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Input
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm Password"
                  type="password"
                />
              </div>
            )}
            {(!editingUser || !isSuperAdminUser(editingUser)) && (
              <>
                <div className="max-h-96 space-y-4 overflow-y-auto rounded-md border p-3">
                  {permissionModules.map((mod) => (
                    <div key={mod.module} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        {mod.label}
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {mod.permissions.map((perm) => (
                          <label
                            key={perm.code}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm.code)}
                              disabled={!canEditCurrent}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  permissions: togglePermissionCode(
                                    p.permissions,
                                    perm.code,
                                    mod.permissions,
                                    e.target.checked
                                  ),
                                }))
                              }
                            />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={!canEditCurrent}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </>
            )}
            {canEditCurrent && (
              <div className="flex gap-2">
                <Button onClick={submit} disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </Button>
                {editingUser && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">User Directory</CardTitle>
            <CardDescription className="text-xs">Search and manage admin accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email"
              />
              <select
                value={query.status}
                onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value, page: 1 }))}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Permissions</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u: any) => (
                      <tr key={u.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">{u.fullName}</td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3">
                          {isSuperAdminUser(u)
                            ? "All permissions"
                            : `${u.permissionCount ?? u.permissions?.length ?? 0} granted`}
                        </td>
                        <td className="py-3">{u.isActive ? "Active" : "Inactive"}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {canUpdate && (
                              <Button variant="ghost" size="icon" onClick={() => startEdit(u)}>
                                <Pencil size={16} />
                              </Button>
                            )}
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  isSuperAdminUser(u)
                                    ? "text-muted-foreground"
                                    : u.isActive
                                      ? "text-amber-600"
                                      : "text-primary"
                                }
                                disabled={isSuperAdminUser(u)}
                                onClick={() => toggleStatus(u)}
                              >
                                {isSuperAdminUser(u) ? (
                                  <ShieldCheck size={16} />
                                ) : u.isActive ? (
                                  <UserX size={16} />
                                ) : (
                                  <UserCheck size={16} />
                                )}
                              </Button>
                            )}
                            {canUpdate && !isSuperAdminUser(u) && (
                              <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u)}>
                                <KeyRound size={16} />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  isSuperAdminUser(u)
                                    ? "text-muted-foreground"
                                    : "text-red-600 hover:bg-red-50"
                                }
                                disabled={isSuperAdminUser(u) || deletingUserId === u.id}
                                onClick={() => handleDelete(u)}
                              >
                                {deletingUserId === u.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {query.page} of {meta.totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={query.page <= 1}
                  onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={query.page >= meta.totalPages}
                  onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
