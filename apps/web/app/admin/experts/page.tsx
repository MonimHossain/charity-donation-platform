"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchAdminExperts, deleteAdminExpert } from "@/lib/api";
import { Loader2, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ExpertsPage() {
  const session = useAdminSession();
  const [experts, setExperts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expertToDelete, setExpertToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = hasAdminPermission(session, "experts.create");
  const canUpdate = hasAdminPermission(session, "experts.update");
  const canDelete = hasAdminPermission(session, "experts.delete");

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const data = await fetchAdminExperts(); setExperts(data); }
    catch (err: any) { setError(err?.message || "Failed to load experts"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadExperts(); }, [loadExperts]);

  const filtered = experts.filter((e: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q) || (e.country ?? "").toLowerCase().includes(q);
  });

  const handleDeleteConfirm = async () => {
    if (!expertToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminExpert(expertToDelete.id);
      toast.success(`Expert "${expertToDelete.name}" deleted`);
      setDeleteModalOpen(false);
      setExpertToDelete(null);
      await loadExperts();
    } catch (err: any) { toast.error(err?.message || "Failed to delete expert"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Experts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the expert panel shown on charity profiles.</p>
        </div>
        {canCreate && (
          <Link href="/admin/experts/new">
            <Button><Plus className="h-4 w-4 mr-2" />New Expert</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <Input placeholder="Search by name, role or country..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} expert{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>{search ? "No experts match your search." : "No experts yet."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left">
                  <th className="pb-3 pr-4 font-medium">Expert</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Country</th>
                  <th className="pb-3 pr-4 font-medium">Active</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map((expert: any) => (
                    <tr key={expert.id} className="hover:bg-muted/40">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                            {expert.name?.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                          </div>
                          <p className="font-medium">{expert.title ? `${expert.title} ` : ""}{expert.name}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{expert.role}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{expert.country ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${expert.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                          {expert.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && <Link href={`/admin/experts/${expert.id}/edit`}><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button></Link>}
                          {canDelete && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setExpertToDelete(expert); setDeleteModalOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expert</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{expertToDelete?.name}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
