"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import RequirePermission from "@/components/admin/RequirePermission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAdminUsers, fetchAdminRoles, createAdminUser, updateAdminUser, deleteAdminUser, updateAdminUserStatus, resetAdminUserPassword } from "@/lib/api";
import { Eye, EyeOff, KeyRound, Loader2, Pencil, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FormState = { fullName: string; email: string; password: string; confirmPassword: string; isActive: boolean; roleIds: number[] };
const initialForm: FormState = { fullName: "", email: "", password: "", confirmPassword: "", isActive: true, roleIds: [] };
const SUPER_ADMIN_ROLE_CODE = "SUPER_ADMIN";

export default function AdminUsersPage() {
  const session = useAdminSession();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState({ search: "", status: "ALL" as string, roleId: "", page: 1, limit: 25 });
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canCreate = hasAdminPermission(session, "admins.create");
  const canUpdate = hasAdminPermission(session, "admins.update");
  const canDelete = hasAdminPermission(session, "admins.delete");
  const canEditCurrent = editingUser ? canUpdate : canCreate;
  const isSuperAdmin = (u: any) => u?.roles?.some((r: any) => r.code === SUPER_ADMIN_ROLE_CODE);

  const roleOptions = useMemo(() => roles.filter((r) => r.code !== SUPER_ADMIN_ROLE_CODE).map((r) => ({ id: r.id, label: r.name })), [roles]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAdminUsers({ search: query.search || undefined, isActive: query.status === "ALL" ? undefined : query.status === "ACTIVE", roleId: query.roleId ? Number(query.roleId) : undefined, page: query.page, limit: query.limit, sortBy: "createdAt", sortOrder: "DESC" });
      setUsers(r.data); setMeta(r.meta);
    } catch { toast.error("Failed to load admin users."); } finally { setLoading(false); }
  }, [query]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { fetchAdminRoles({ page: 1, limit: 100 }).then((r) => setRoles(r.data)).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => setQuery((p) => p.search === searchInput.trim() ? p : { ...p, search: searchInput.trim(), page: 1 }), 350); return () => clearTimeout(t); }, [searchInput]);

  function startEdit(u: any) { setEditingUser(u); setForm({ fullName: u.fullName, email: u.email, password: "", confirmPassword: "", isActive: u.isActive, roleIds: u.roles.map((r: any) => r.id) }); }
  function resetForm() { setEditingUser(null); setForm(initialForm); }

  async function submit() {
    if (!form.fullName.trim() || !form.email.trim()) { toast.error("Name and email required."); return; }
    if (!editingUser && form.password.length < 8) { toast.error("Password must be 8+ chars."); return; }
    if (!editingUser && form.password !== form.confirmPassword) { toast.error("Passwords don't match."); return; }
    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = { fullName: form.fullName, email: form.email };
        if (!isSuperAdmin(editingUser)) { payload.isActive = form.isActive; payload.roleIds = form.roleIds; }
        await updateAdminUser(editingUser.id, payload);
      } else {
        await createAdminUser({ fullName: form.fullName, email: form.email, password: form.password, isActive: form.isActive, roleIds: form.roleIds });
      }
      toast.success(editingUser ? "User updated." : "User created.");
      resetForm(); await loadUsers();
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  }

  async function toggleStatus(u: any) {
    if (isSuperAdmin(u)) return;
    try { await updateAdminUserStatus(u.id, !u.isActive); toast.success("Status updated."); await loadUsers(); } catch { toast.error("Failed."); }
  }

  async function handleDelete(u: any) {
    if (isSuperAdmin(u) || !window.confirm(`Delete ${u.email}?`)) return;
    setDeletingUserId(u.id);
    try { await deleteAdminUser(u.id); toast.success("Deleted."); if (editingUser?.id === u.id) resetForm(); await loadUsers(); }
    catch { toast.error("Failed."); } finally { setDeletingUserId(null); }
  }

  async function handleResetPassword(u: any) {
    const pw = window.prompt(`New password for ${u.email}`);
    if (!pw || pw.trim().length < 8) { if (pw) toast.error("8+ chars required."); return; }
    try { await resetAdminUserPassword(u.id, pw.trim()); toast.success("Password reset."); } catch { toast.error("Failed."); }
  }

  return (
    <RequirePermission permission="admins.view">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Admin Users</h1>
          <p className="text-sm text-muted-foreground">Manage administrator accounts and role assignments.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">{editingUser ? "Update Admin User" : "Create Admin User"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" disabled={!canEditCurrent} />
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" disabled={!canEditCurrent} />
            </div>
            {!editingUser && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password" type={showPassword ? "text" : "password"} className="pr-10" />
                  <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                <Input value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm Password" type="password" />
              </div>
            )}
            {(!editingUser || !isSuperAdmin(editingUser)) && (
              <>
                <div className="grid gap-2 md:grid-cols-3">
                  {roleOptions.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
                      <input type="checkbox" checked={form.roleIds.includes(r.id)} disabled={!canEditCurrent}
                        onChange={(e) => setForm((p) => ({ ...p, roleIds: e.target.checked ? [...p.roleIds, r.id] : p.roleIds.filter((id) => id !== r.id) }))} />
                      {r.label}
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} disabled={!canEditCurrent} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
              </>
            )}
            {canEditCurrent && <div className="flex gap-2"><Button onClick={submit} disabled={saving}>{saving ? "Saving..." : editingUser ? "Update" : "Create"}</Button>{editingUser && <Button variant="outline" onClick={resetForm}>Cancel</Button>}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">User Directory</CardTitle><CardDescription className="text-xs">Search and manage admin accounts.</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email" />
              <select value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value, page: 1 }))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </select>
              <select value={query.roleId} onChange={(e) => setQuery((p) => ({ ...p, roleId: e.target.value, page: 1 }))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">All roles</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
                  <th className="py-2 text-left">Name</th><th className="py-2 text-left">Email</th><th className="py-2 text-left">Roles</th><th className="py-2 text-left">Status</th><th className="py-2 text-left">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  : users.length === 0 ? <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No users found.</td></tr>
                  : users.map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">{u.fullName}</td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3">{u.roles?.map((r: any) => r.name).join(", ") || "-"}</td>
                      <td className="py-3">{u.isActive ? "Active" : "Inactive"}</td>
                      <td className="py-3"><div className="flex items-center gap-1">
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => startEdit(u)}><Pencil size={16} /></Button>}
                        {canUpdate && <Button variant="ghost" size="icon" className={isSuperAdmin(u) ? "text-muted-foreground" : u.isActive ? "text-amber-600" : "text-primary"} disabled={isSuperAdmin(u)} onClick={() => toggleStatus(u)}>
                          {isSuperAdmin(u) ? <ShieldCheck size={16} /> : u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}</Button>}
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u)}><KeyRound size={16} /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" className={isSuperAdmin(u) ? "text-muted-foreground" : "text-red-600 hover:bg-red-50"} disabled={isSuperAdmin(u) || deletingUserId === u.id} onClick={() => handleDelete(u)}>
                          {deletingUserId === u.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</Button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {query.page} of {meta.totalPages || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={query.page <= 1} onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={query.page >= meta.totalPages} onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
