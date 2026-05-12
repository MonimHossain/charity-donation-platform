"use client";

import RequirePermission from "@/components/admin/RequirePermission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAdminHistory } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function formatDetails(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "-";
  const changes = metadata.changes;
  if (changes && typeof changes === "object" && !Array.isArray(changes)) {
    const keys = Object.keys(changes as Record<string, unknown>);
    if (keys.length > 0) return `Changed: ${keys.join(", ")}`;
  }
  const json = JSON.stringify(metadata);
  return json && json.length > 160 ? `${json.slice(0, 157)}...` : (json || "-");
}

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const r = await fetchAdminHistory({ page: targetPage, limit: 25, actionType: actionType.trim() || undefined, entityType: entityType.trim() || undefined });
      setHistory(r.data); setMeta(r.meta);
    } catch { toast.error("Failed to load history."); } finally { setLoading(false); }
  }, [actionType, entityType]);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <RequirePermission permission="history.view">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Admin Action History</h1>
          <p className="text-sm text-muted-foreground">Audit trail for admin-level actions.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={actionType} onChange={(e) => { setPage(1); setActionType(e.target.value); }} placeholder="Action type (e.g. admin.update)" />
              <Input value={entityType} onChange={(e) => { setPage(1); setEntityType(e.target.value); }} placeholder="Entity type (e.g. AdminUser)" />
              <Button variant="outline" onClick={() => { setPage(1); setActionType(""); setEntityType(""); }}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Events</CardTitle><CardDescription className="text-xs">{meta ? `${meta.total} events` : "Loading..."}</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
                  <th className="py-2 text-left">Time</th><th className="py-2 text-left">Admin</th><th className="py-2 text-left">Action</th>
                  <th className="py-2 text-left">Target</th><th className="py-2 text-left">Description</th><th className="py-2 text-left">Details</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  : history.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No history found.</td></tr>
                  : history.map((e: any) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">{new Date(e.createdAt).toLocaleString()}</td>
                      <td className="py-3">{e.adminUser?.email ?? "System"}</td>
                      <td className="py-3 font-medium">{e.actionType}</td>
                      <td className="py-3">{e.entityType || "-"}{e.entityId ? `:${e.entityId}` : ""}</td>
                      <td className="py-3">{e.description ?? "-"}</td>
                      <td className="py-3 max-w-xs truncate">{formatDetails(e.metadata)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {page}{meta ? ` of ${meta.totalPages}` : ""}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!meta || page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
