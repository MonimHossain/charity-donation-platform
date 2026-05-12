"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import { SubmissionStatusBadge } from "@/components/common/SubmissionStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchAdminApplyReviewSubmissions, updateAdminApplyReview, deleteAdminApplyReview } from "@/lib/api";
import { SUBMISSION_STATUS_OPTIONS } from "@/lib/dashboard-status";
import { SubmissionStatus } from "@/lib/shared-types";
import { Eye, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ApplicationsPage() {
  const session = useAdminSession();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [selectedLimit, setSelectedLimit] = useState(25);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusDraft, setStatusDraft] = useState<SubmissionStatus | "">("");
  const [notesDraft, setNotesDraft] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const canReview = hasAdminPermission(session, "applications.review");
  const canDelete = hasAdminPermission(session, "applications.delete");

  const loadApps = useCallback(async (page = 1, limit = selectedLimit) => {
    setLoading(true); setError(null);
    try { const r = await fetchAdminApplyReviewSubmissions({ page, limit }); setApplications(r.data); setPagination(r.meta); }
    catch { setError("Failed to load applications"); } finally { setLoading(false); }
  }, [selectedLimit]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); } catch { return d; } };

  const handleView = (app: any) => { setSelectedApp(app); setStatusDraft(app.submissionStatus); setNotesDraft(app.internalNotes ?? ""); setViewOpen(true); };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    setDeleting(true);
    try { await deleteAdminApplyReview(appToDelete.id); setDeleteOpen(false); setAppToDelete(null); await loadApps(applications.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page); }
    catch { setError("Failed to delete"); } finally { setDeleting(false); }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setSavingStatus(true);
    try {
      const updated = await updateAdminApplyReview(selectedApp.id, { submissionStatus: statusDraft || undefined, internalNotes: notesDraft.trim() || null });
      setApplications((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedApp(updated);
      toast.success("Application updated.");
    } catch { toast.error("Failed to update."); } finally { setSavingStatus(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Apply for Review</h1>
        <p className="text-sm text-muted-foreground">Submissions from charities requesting an audit.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Review Applications</CardTitle>
          <CardDescription className="text-xs">{pagination.total} submission{pagination.total !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
                <th className="text-left py-2">Organisation</th><th className="text-left py-2">Country</th><th className="text-left py-2">Contact</th>
                <th className="text-left py-2">Status</th><th className="text-left py-2">Submitted</th><th className="text-left py-2">Actions</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                : applications.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No applications received.</td></tr>
                : applications.map((app: any) => (
                  <tr key={app.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">{app.organisationName}</td>
                    <td className="py-3">{app.country ?? "-"}</td>
                    <td className="py-3">{app.contactName} ({app.email})</td>
                    <td className="py-3"><SubmissionStatusBadge status={app.submissionStatus} /></td>
                    <td className="py-3 whitespace-nowrap">{fmtDate(app.createdAt)}</td>
                    <td className="py-3"><div className="flex gap-2">
                      <button onClick={() => handleView(app)} className="p-2 rounded-lg text-primary hover:bg-muted"><Eye size={18} /></button>
                      {canDelete && <button onClick={() => { setAppToDelete(app); setDeleteOpen(true); }} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && applications.length > 0 && (
            <div className="mt-6 border-t pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <select value={selectedLimit} onChange={(e) => { setSelectedLimit(Number(e.target.value)); loadApps(1, Number(e.target.value)); }} className="rounded-lg border px-3 py-2 text-xs">{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
              <div className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</div>
              {pagination.totalPages > 1 && <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => loadApps(pagination.page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadApps(pagination.page + 1)}>Next</Button>
              </div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Application Details</DialogTitle><DialogDescription>Review the complete application</DialogDescription></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-muted-foreground">Organisation</label><p className="mt-1 text-sm">{selectedApp.organisationName}</p></div>
                <div><label className="text-xs font-semibold text-muted-foreground">Country</label><p className="mt-1 text-sm">{selectedApp.country ?? "-"}</p></div>
                <div><label className="text-xs font-semibold text-muted-foreground">Contact</label><p className="mt-1 text-sm">{selectedApp.contactName}</p></div>
                <div><label className="text-xs font-semibold text-muted-foreground">Email</label><p className="mt-1 text-sm">{selectedApp.email}</p></div>
              </div>
              {selectedApp.message && <div><label className="text-xs font-semibold text-muted-foreground">Message</label><p className="mt-1 text-sm">{selectedApp.message}</p></div>}
              {canReview && <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Update Status</label>
                  <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as SubmissionStatus)} className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-xs">
                    {SUBMISSION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Internal Notes</label>
                  <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={3} className="mt-2 w-full rounded-md border px-3 py-2 text-xs" placeholder="Add internal notes" />
                </div>
                <Button onClick={handleUpdateStatus} disabled={savingStatus} size="sm">{savingStatus ? "Saving..." : "Save Update"}</Button>
              </div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Application</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          {appToDelete && <div className="rounded-lg bg-muted p-3"><p className="text-sm font-medium">{appToDelete.organisationName}</p><p className="text-xs text-muted-foreground">{appToDelete.email}</p></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
