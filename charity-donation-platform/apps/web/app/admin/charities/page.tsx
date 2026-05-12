"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import { AuditStatusBadge, CertificationStatusBadge } from "@/components/common/CharityStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchAdminCharities,
  deleteAdminCharity,
  updateAdminCharity,
} from "@/lib/api";
import { AUDIT_STATUS_OPTIONS, CERTIFICATION_STATUS_OPTIONS, CERTIFICATION_STATUS_LABELS } from "@/lib/charity-status";
import { formatDate } from "@/lib/format";
import { AuditStatus, CertificationStatus } from "@/lib/shared-types";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type QueryState = {
  search: string;
  country: string;
  auditStatus: AuditStatus | "";
  certificationStatus: CertificationStatus | "";
  page: number;
  limit: number;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function initialStateFromSearchParams(params: URLSearchParams): QueryState {
  return {
    search: params.get("search") ?? "",
    country: params.get("country") ?? "",
    auditStatus: (params.get("auditStatus") as AuditStatus | "") ?? "",
    certificationStatus: (params.get("certificationStatus") as CertificationStatus | "") ?? "",
    page: parsePositiveInt(params.get("page"), 1),
    limit: parsePositiveInt(params.get("limit"), 25),
  };
}

export default function CharitiesPage() {
  const session = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<QueryState>(() => initialStateFromSearchParams(searchParams));
  const [searchInput, setSearchInput] = useState(query.search);
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [charityToDelete, setCharityToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishUpdatingId, setPublishUpdatingId] = useState<number | null>(null);

  const canCreate = hasAdminPermission(session, "charities.create");
  const canUpdate = hasAdminPermission(session, "charities.update");
  const canDelete = hasAdminPermission(session, "charities.delete");

  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    charities.forEach((item: any) => { if (item.country) countries.add(item.country); });
    if (query.country) countries.add(query.country);
    return Array.from(countries).sort();
  }, [charities, query.country]);

  const syncUrl = useCallback((next: QueryState) => {
    const params = new URLSearchParams();
    if (next.search.trim()) params.set("search", next.search.trim());
    if (next.country.trim()) params.set("country", next.country.trim());
    if (next.auditStatus) params.set("auditStatus", next.auditStatus);
    if (next.certificationStatus) params.set("certificationStatus", next.certificationStatus);
    if (next.page > 1) params.set("page", String(next.page));
    if (next.limit !== 25) params.set("limit", String(next.limit));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => {
        if (prev.search === searchInput) return prev;
        const next = { ...prev, search: searchInput, page: 1 };
        syncUrl(next);
        return next;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, syncUrl]);

  const loadCharities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminCharities({
        search: query.search || undefined,
        country: query.country || undefined,
        auditStatus: query.auditStatus || undefined,
        certificationStatus: query.certificationStatus || undefined,
        page: query.page,
        limit: query.limit,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setCharities(result.data);
      setMeta(result.meta);
    } catch {
      setError("Failed to load charities");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadCharities(); }, [loadCharities]);

  function updateQuery(patch: Partial<QueryState>) {
    setQuery((prev) => {
      const next = { ...prev, ...patch };
      syncUrl(next);
      return next;
    });
  }

  async function handleConfirmDelete() {
    if (!charityToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminCharity(charityToDelete.id);
      toast.success("Charity archived successfully.");
      setDeleteModalOpen(false);
      setCharityToDelete(null);
      if (charities.length === 1 && meta.page > 1) {
        updateQuery({ page: meta.page - 1 });
      } else {
        await loadCharities();
      }
    } catch {
      toast.error("Failed to archive charity.");
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublished(charity: any) {
    setPublishUpdatingId(charity.id);
    try {
      await updateAdminCharity(charity.id, { isPublished: !charity.isPublished });
      toast.success(`Charity ${charity.isPublished ? "unpublished" : "published"} successfully.`);
      await loadCharities();
    } catch {
      toast.error("Failed to update publish status.");
    } finally {
      setPublishUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Charities</h1>
          <p className="text-sm text-muted-foreground">Manage charity profiles, audit status, and publication.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/admin/charities/new">New Charity</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Directory Controls</CardTitle>
          <CardDescription className="text-xs">Search and filter charities.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Search by name or certificate ID" className="h-9 text-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select value={query.country} onChange={(e) => updateQuery({ country: e.target.value, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Countries</option>
            {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={query.auditStatus} onChange={(e) => updateQuery({ auditStatus: e.target.value as any, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Audit Statuses</option>
            {AUDIT_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={query.certificationStatus} onChange={(e) => updateQuery({ certificationStatus: e.target.value as any, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Certifications</option>
            {CERTIFICATION_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Charity Directory</CardTitle>
          <CardDescription className="text-xs">{meta.total} record{meta.total !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-left">Charity</th>
                  <th className="py-2 text-left">Country</th>
                  <th className="py-2 text-left">Audit Status</th>
                  <th className="py-2 text-left">Certification</th>
                  <th className="py-2 text-left">Expiry</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading charities...</td></tr>
                ) : charities.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No charities found.</td></tr>
                ) : charities.map((charity: any) => (
                  <tr key={charity.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{charity.name}</p>
                      <p className="text-xs text-muted-foreground">/{charity.slug}</p>
                    </td>
                    <td className="py-3">{charity.country ?? "-"}</td>
                    <td className="py-3"><AuditStatusBadge status={charity.auditStatus} /></td>
                    <td className="py-3">
                      <CertificationStatusBadge status={charity.certification?.certificationStatus || charity.certification?.status} />
                      <p className="text-xs text-muted-foreground">{charity.certification?.certificateId ?? CERTIFICATION_STATUS_LABELS[CertificationStatus.NOT_CERTIFIED]}</p>
                    </td>
                    <td className="py-3">{charity.certification?.expiryDate ? formatDate(charity.certification.expiryDate) : "-"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <Button asChild variant="ghost" size="icon" title="Edit charity">
                            <Link href={`/admin/charities/${charity.id}/edit`}><Pencil size={16} /></Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="View public profile" onClick={() => window.open(`/charities/${charity.slug}`, "_blank", "noopener,noreferrer")}>
                          <Eye size={16} />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => { setCharityToDelete(charity); setDeleteModalOpen(true); }} title="Archive">
                            <Trash2 size={16} />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button variant="ghost" size="icon" className={charity.isPublished ? "text-amber-600" : "text-primary"} disabled={publishUpdatingId === charity.id} onClick={() => togglePublished(charity)} title={charity.isPublished ? "Unpublish" : "Publish"}>
                            {publishUpdatingId === charity.id ? <Loader2 size={16} className="animate-spin" /> : charity.isPublished ? <X size={16} /> : <Check size={16} />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && charities.length > 0 && (
            <div className="mt-6 border-t pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Per page:</label>
                <select value={query.limit} onChange={(e) => updateQuery({ limit: Number(e.target.value), page: 1 })} className="rounded-lg border px-3 py-2 text-xs">
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} &bull; Total: {meta.total}</div>
              {meta.totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={query.page === 1} onClick={() => updateQuery({ page: Math.max(1, query.page - 1) })}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={query.page >= meta.totalPages} onClick={() => updateQuery({ page: Math.min(meta.totalPages, query.page + 1) })}>Next</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Charity</DialogTitle>
            <DialogDescription>This will remove the charity from public listings.</DialogDescription>
          </DialogHeader>
          {charityToDelete && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">{charityToDelete.name}</p>
              <p className="text-xs text-muted-foreground">/{charityToDelete.slug}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>{deleting ? "Archiving..." : "Archive"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
