"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import RequirePermission from "@/components/admin/RequirePermission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAdminRoles, fetchAdminPermissions, createAdminRole, updateAdminRole, deleteAdminRole } from "@/lib/api";
import { Loader2, Pencil, ShieldCheck, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type RoleFormState = { name: string; code: string; description: string; permissionCodes: string[] };
const initialForm: RoleFormState = { name: "", code: "", description: "", permissionCodes: [] };

export default function RolesPage() {
  const session = useAdminSession();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [form, setForm] = useState<RoleFormState>(initialForm);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  const canCreate = hasAdminPermission(session, "roles.create");
  const canUpdate = hasAdminPermission(session, "roles.update");
  const canDelete = hasAdminPermission(session, "roles.delete");
  const canViewPermissions = hasAdminPermission(session, "permissions.view");
  const canEditCurrent = editingRole ? canUpdate : canCreate;

  const grouped = useMemo(() => permissions.reduce<Record<string, any[]>>((acc, p) => { const key = p.module || "General"; if (!acc[key]) acc[key] = []; acc[key].push(p); return acc; }, {}), [permissions]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetchAdminRoles({ page, limit }); setRoles(r.data); setMeta(r.meta); } catch { toast.error("Failed to load roles."); } finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (canViewPermissions) fetchAdminPermissions().then(setPermissions).catch(() => toast.error("Failed to load permissions.")); }, [canViewPermissions]);

  function resetForm() { setEditingRole(null); setForm(initialForm); }
  function startEdit(role: any) { setEditingRole(role); setForm({ name: role.name, code: role.code, description: role.description ?? "", permissionCodes: role.permissionCodes }); }

  async function submit() {
    if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code required."); return; }
    setSaving(true);
    try {
      if (editingRole) await updateAdminRole(editingRole.id, form);
      else await createAdminRole(form);
      toast.success(editingRole ? "Role updated." : "Role created.");
      resetForm(); await load();
    } catch { toast.error("Failed to save role."); } finally { setSaving(false); }
  }

  async function handleDeleteRole(role: any) {
    if (role.code === "SUPER_ADMIN" || role.isSystemRole) { toast.error("System role is protected."); return; }
    if (role.assignedUsersCount > 0) { toast.error("Remove assigned users first."); return; }
    if (!window.confirm(`Delete role ${role.name}?`)) return;
    setDeletingRoleId(role.id);
    try { await deleteAdminRole(role.id); toast.success("Role deleted."); if (editingRole?.id === role.id) resetForm(); if (roles.length === 1 && page > 1) setPage(page - 1); else await load(); }
    catch { toast.error("Failed to delete role."); } finally { setDeletingRoleId(null); }
  }

  return (
    <RequirePermission permission="roles.view">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define role templates and permission bundles.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">{editingRole ? "Update Role" : "Create Role"}</CardTitle><CardDescription className="text-xs">Grant minimum permissions required.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Role Name" className="h-9 text-sm" disabled={!canEditCurrent} />
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Role Code" className="h-9 text-sm" disabled={!canEditCurrent} />
            </div>
            <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="h-9 text-sm" disabled={!canEditCurrent} />
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-3">
              {Object.entries(grouped).map(([group, perms]) => (
                <div key={group} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">{group}</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(perms as any[]).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
                        <input type="checkbox" checked={form.permissionCodes.includes(p.code)} disabled={!canEditCurrent}
                          onChange={(e) => setForm((prev) => ({ ...prev, permissionCodes: e.target.checked ? [...prev.permissionCodes, p.code] : prev.permissionCodes.filter((c) => c !== p.code) }))} />
                        <span>{p.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {canEditCurrent && canViewPermissions ? (
              <div className="flex gap-2">
                <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}</Button>
                {editingRole && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
            ) : <p className="text-xs text-muted-foreground">View-only access.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Role Directory</CardTitle><CardDescription className="text-xs">{meta.total} role{meta.total === 1 ? "" : "s"} found.</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
                  <th className="py-2 text-left">Name</th><th className="py-2 text-left">Code</th><th className="py-2 text-left">Permissions</th><th className="py-2 text-left">Users</th><th className="py-2 text-left">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  : roles.length === 0 ? <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No roles found.</td></tr>
                  : roles.map((role: any) => (
                    <tr key={role.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">{role.name}</td>
                      <td className="py-3 text-muted-foreground">{role.code}</td>
                      <td className="py-3">{role.permissionCodes?.length ?? 0}</td>
                      <td className="py-3">{role.assignedUsersCount}</td>
                      <td className="py-3"><div className="flex items-center gap-1">
                        {canUpdate && <Button variant="ghost" size="icon" onClick={() => startEdit(role)} title="Edit"><Pencil size={16} /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" className={role.code === "SUPER_ADMIN" || role.isSystemRole || role.assignedUsersCount > 0 ? "text-muted-foreground" : "text-red-600 hover:bg-red-50"}
                          disabled={role.code === "SUPER_ADMIN" || role.isSystemRole || role.assignedUsersCount > 0 || deletingRoleId === role.id} onClick={() => handleDeleteRole(role)}>
                          {role.code === "SUPER_ADMIN" || role.isSystemRole ? <ShieldCheck size={16} /> : role.assignedUsersCount > 0 ? <Users size={16} /> : deletingRoleId === role.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {meta.page} of {meta.totalPages || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages || loading} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
