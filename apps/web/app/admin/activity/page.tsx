"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  User,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchActivityLogs } from "@/lib/api";

interface ActivityEntry {
  id: string;
  action: string;
  user: string;
  userEmail?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

const actionStyles: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-violet-100 text-violet-700",
  logout: "bg-slate-100 text-slate-600",
  export: "bg-amber-100 text-amber-700",
};

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 25;

  async function loadActivity() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (actionFilter !== "all") params.action = actionFilter;
      if (userFilter) params.user = userFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const data = await fetchActivityLogs(params);
      const items = data.items || data.logs || data || [];
      setEntries(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || items.length) / limit));
    } catch {
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [page]);

  function handleFilter() {
    setPage(1);
    loadActivity();
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Track all admin actions and audit trail</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export">Export</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">User</Label>
          <Input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="Filter by user..." className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" onClick={handleFilter}>
          <Filter className="h-4 w-4" /> Apply
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading activity...
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Details</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length > 0 ? entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {e.createdAt ? formatDate(e.createdAt) : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", actionStyles[e.action] || "bg-slate-100 text-slate-600")}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{e.user || "System"}</span>
                        </div>
                        {e.userEmail && <p className="text-xs text-muted-foreground ml-5">{e.userEmail}</p>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[300px] truncate">{e.details || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Globe className="h-3.5 w-3.5" />
                          {e.ipAddress || "—"}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No activity found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
