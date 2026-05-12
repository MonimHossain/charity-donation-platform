"use client";

import { hasAdminPermission, useAdminSession } from "@/components/admin/AdminSessionProvider";
import { CertificationStatusBadge } from "@/components/common/CharityStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchAdminCertifications,
  deleteAdminCertification,
  manuallyExpireAdminCertification,
  toggleAdminCertificationBadge,
  regenerateAdminCertificationBadge,
} from "@/lib/api";
import { CERTIFICATION_RECORD_STATUS_OPTIONS } from "@/lib/charity-status";
import { formatDate } from "@/lib/format";
import { CertificationStatus } from "@/lib/shared-types";
import { BadgeCheck, CalendarX2, Eye, Loader2, Pencil, RefreshCw, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type QueryState = {
  search: string;
  status: CertificationStatus | "";
  expiryState: "" | "EXPIRED" | "EXPIRING_SOON" | "ACTIVE";
  isCurrent: "" | "true" | "false";
  page: number;
  limit: number;
};

function parsePositiveInt(v: string | null, fb: number) { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : fb; }

export default function CertificationsPage() {
  const session = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<QueryState>(() => ({
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as any) ?? "",
    expiryState: (searchParams.get("expiryState") as any) ?? "",
    isCurrent: (searchParams.get("isCurrent") as any) ?? "",
    page: parsePositiveInt(searchParams.get("page"), 1),
    limit: parsePositiveInt(searchParams.get("limit"), 25),
  }));
  const [searchInput, setSearchInput] = useState(query.search);
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingBadgeId, setTogglingBadgeId] = useState<number | null>(null);
  const [regeneratingBadgeId, setRegeneratingBadgeId] = useState<number | null>(null);
  const [expiringId, setExpiringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = hasAdminPermission(session, "certifications.create");
  const canUpdate = hasAdminPermission(session, "certifications.update");
  const canRenew = hasAdminPermission(session, "certifications.renew");
  const canExpire = hasAdminPermission(session, "certifications.expire");
  const canToggleBadge = hasAdminPermission(session, "certifications.toggle_badge");
  const canDelete = hasAdminPermission(session, "certifications.delete");

  const syncUrl = useCallback((next: QueryState) => {
    const p = new URLSearchParams();
    if (next.search.trim()) p.set("search", next.search.trim());
    if (next.status) p.set("status", next.status);
    if (next.expiryState) p.set("expiryState", next.expiryState);
    if (next.isCurrent) p.set("isCurrent", next.isCurrent);
    if (next.page > 1) p.set("page", String(next.page));
    if (next.limit !== 25) p.set("limit", String(next.limit));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((prev) => {
        if (prev.search === searchInput) return prev;
        const next = { ...prev, search: searchInput, page: 1 };
        syncUrl(next);
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, syncUrl]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminCertifications({
        search: query.search || undefined,
        status: query.status || undefined,
        expiryState: query.expiryState || undefined,
        isCurrent: query.isCurrent ? query.isCurrent === "true" : undefined,
        page: query.page,
        limit: query.limit,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch {
      setError("Failed to load certifications");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateQuery(patch: Partial<QueryState>) {
    setQuery((prev) => { const next = { ...prev, ...patch }; syncUrl(next); return next; });
  }

  async function handleToggleBadge(row: any) {
    setTogglingBadgeId(row.id);
    try { await toggleAdminCertificationBadge(row.id); toast.success("Badge state updated."); await loadData(); } catch { toast.error("Failed to update badge."); } finally { setTogglingBadgeId(null); }
  }
  async function handleRegenerateBadge(row: any) {
    setRegeneratingBadgeId(row.id);
    try { await regenerateAdminCertificationBadge(row.id); toast.success("Badge regenerated."); await loadData(); } catch { toast.error("Failed to regenerate badge."); } finally { setRegeneratingBadgeId(null); }
  }
  async function handleManualExpire(row: any) {
    if (!window.confirm(`Manually expire "${row.certificateId}"?`)) return;
    setExpiringId(row.id);
    try { await manuallyExpireAdminCertification(row.id); toast.success("Certification expired."); await loadData(); } catch { toast.error("Failed to expire."); } finally { setExpiringId(null); }
  }
  async function handleDelete(row: any) {
    if (!window.confirm(`Delete certification "${row.certificateId}"? This cannot be undone.`)) return;
    setDeletingId(row.id);
    try { await deleteAdminCertification(row.id); toast.success("Certification deleted."); await loadData(); } catch { toast.error("Failed to delete."); } finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Certifications</h1>
          <p className="text-sm text-muted-foreground">Track issued certificates, expiry states, and badge validity.</p>
        </div>
        {canCreate && <Button asChild><Link href="/admin/certifications/new">New Certification</Link></Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          <CardDescription className="text-xs">Search by certificate ID or charity name.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Certificate ID or charity" className="h-9 text-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select value={query.status} onChange={(e) => updateQuery({ status: e.target.value as any, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Statuses</option>
            {CERTIFICATION_RECORD_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={query.expiryState} onChange={(e) => updateQuery({ expiryState: e.target.value as any, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Expiry States</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon (30d)</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select value={query.isCurrent} onChange={(e) => updateQuery({ isCurrent: e.target.value as any, page: 1 })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Current + Historical</option>
            <option value="true">Current Only</option>
            <option value="false">Historical Only</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Certification Records</CardTitle>
          <CardDescription className="text-xs">{meta.total} record{meta.total !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-left">Certificate ID</th>
                  <th className="py-2 text-left">Charity</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Issue Date</th>
                  <th className="py-2 text-left">Expiry Date</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No certifications found.</td></tr>
                ) : rows.map((row: any) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{row.certificateId}</td>
                    <td className="py-3">{row.charityName}<br /><span className="text-xs text-muted-foreground">{row.charityCountry ?? "Global"}</span></td>
                    <td className="py-3"><CertificationStatusBadge status={row.effectiveStatus} /></td>
                    <td className="py-3">{formatDate(row.issueDate)}</td>
                    <td className="py-3">{formatDate(row.expiryDate)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {canUpdate && <Button asChild size="icon" variant="ghost" title="Edit"><Link href={`/admin/certifications/${row.id}/edit`}><Pencil size={16} /></Link></Button>}
                        {canRenew && <Button asChild size="icon" variant="ghost" title="Renew"><Link href={`/admin/certifications/${row.id}/renew`}><RefreshCw size={16} /></Link></Button>}
                        {canToggleBadge && <Button size="icon" variant="ghost" disabled={togglingBadgeId === row.id} onClick={() => handleToggleBadge(row)} title="Toggle badge">{togglingBadgeId === row.id ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}</Button>}
                        {canUpdate && <Button size="icon" variant="ghost" disabled={regeneratingBadgeId === row.id} onClick={() => handleRegenerateBadge(row)} title="Regenerate badge">{regeneratingBadgeId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}</Button>}
                        {canExpire && <Button size="icon" variant="ghost" className="text-orange-600" disabled={row.effectiveStatus === CertificationStatus.EXPIRED || expiringId === row.id} onClick={() => handleManualExpire(row)} title="Expire">{expiringId === row.id ? <Loader2 size={16} className="animate-spin" /> : <CalendarX2 size={16} />}</Button>}
                        <Button asChild size="icon" variant="ghost" title="Verify"><Link href={`/verify/${row.certificateId}`} target="_blank"><Eye size={16} /></Link></Button>
                        {canDelete && <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50" disabled={deletingId === row.id} onClick={() => handleDelete(row)} title="Delete">{deletingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && rows.length > 0 && (
            <div className="mt-6 border-t pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <select value={query.limit} onChange={(e) => updateQuery({ limit: Number(e.target.value), page: 1 })} className="rounded-lg border px-3 py-2 text-xs">{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
              <div className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} &bull; Total: {meta.total}</div>
              {meta.totalPages > 1 && <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={query.page === 1} onClick={() => updateQuery({ page: query.page - 1 })}>Previous</Button>
                <Button variant="outline" size="sm" disabled={query.page >= meta.totalPages} onClick={() => updateQuery({ page: query.page + 1 })}>Next</Button>
              </div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
