"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Clock,
  Globe,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  bulk_delete: "bg-red-100 text-red-700",
  login: "bg-violet-100 text-violet-700",
  logout: "bg-slate-100 text-slate-600",
  export: "bg-amber-100 text-amber-700",
  refund: "bg-orange-100 text-orange-700",
  upload: "bg-cyan-100 text-cyan-700",
  upload_batch: "bg-cyan-100 text-cyan-700",
  reorder: "bg-indigo-100 text-indigo-700",
  change_password: "bg-purple-100 text-purple-700",
  cancel: "bg-rose-100 text-rose-700",
};

const ENTITY_FILTER_OPTIONS = [
  { value: "all", label: "All entities" },
  { value: "campaign", label: "Campaigns" },
  { value: "blog_post", label: "Blog posts" },
  { value: "donation_page", label: "Donation pages" },
  { value: "donation", label: "Donations" },
  { value: "charity", label: "Charities" },
  { value: "certification", label: "Certifications" },
  { value: "media", label: "Media" },
  { value: "site_settings", label: "Site settings" },
  { value: "quick_donate_option", label: "Quick donate" },
  { value: "admin", label: "Admin account" },
];

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applied, setApplied] = useState({
    action: "all",
    entity: "all",
    user: "",
    search: "",
    from: "",
    to: "",
  });
  const limit = 25;

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (applied.action !== "all") params.action = applied.action;
      if (applied.entity !== "all") params.entityType = applied.entity;
      if (applied.user.trim()) params.user = applied.user.trim();
      if (applied.search.trim()) params.search = applied.search.trim();
      if (applied.from) params.from = applied.from;
      if (applied.to) params.to = applied.to;

      const data = await fetchActivityLogs(params);
      const items = data.items || [];
      setEntries(Array.isArray(items) ? items : []);
      setTotal(data.total ?? items.length);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  function handleFilter() {
    setApplied({
      action: actionFilter,
      entity: entityFilter,
      user: userFilter,
      search: searchFilter,
      from: dateFrom,
      to: dateTo,
    });
    setPage(1);
  }

  function clearFilters() {
    setActionFilter("all");
    setEntityFilter("all");
    setUserFilter("");
    setSearchFilter("");
    setDateFrom("");
    setDateTo("");
    setApplied({ action: "all", entity: "all", user: "", search: "", from: "", to: "" });
    setPage(1);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function formatEntityType(entityType?: string) {
    if (!entityType) return "—";
    return entityType.replace(/_/g, " ");
  }

  const hasActiveFilters =
    applied.action !== "all" ||
    applied.entity !== "all" ||
    applied.user.trim() !== "" ||
    applied.search.trim() !== "" ||
    applied.from !== "" ||
    applied.to !== "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Track admin actions across campaigns, donations, content, and settings
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="refund">Refund</option>
            <option value="export">Export</option>
            <option value="upload">Upload</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Entity</Label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
          >
            {ENTITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">User</Label>
          <Input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Email..."
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Details, ID..."
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Button variant="outline" onClick={handleFilter}>
          <Filter className="h-4 w-4" /> Apply
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {!loading && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "entry" : "entries"}
          {hasActiveFilters ? " matching filters" : " total"}
        </p>
      )}

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
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Entity</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Details</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length > 0 ? (
                    entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {e.createdAt ? formatDate(e.createdAt) : "—"}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                              actionStyles[e.action] || "bg-slate-100 text-slate-600"
                            )}
                          >
                            {e.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{e.user || "System"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground capitalize whitespace-nowrap">
                          {formatEntityType(e.entityType)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground max-w-[360px]">
                          <span className="line-clamp-2">{e.details || "—"}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Globe className="h-3.5 w-3.5" />
                            {e.ipAddress || "—"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-40" />
                          <p>No activity found</p>
                          {hasActiveFilters && (
                            <Button variant="link" size="sm" onClick={clearFilters}>
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
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
