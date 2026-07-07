"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { DonorSegmentParams } from "@repo/shared-types";
import {
  Search,
  Download,
  Loader2,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchAdminDonations } from "@/lib/api";
import DonorAudienceFilter, {
  segmentParamsToQuery,
} from "@/components/admin/DonorAudienceFilter";
import {
  formatDonationTypeLabel,
  QUICK_DONATION_TYPE,
  resolveDonationCampaignName,
} from "@/lib/quick-donate";
import { DONATION_STATUS_STYLES } from "@/lib/payment-utils";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";

interface Donation {
  id?: string;
  donorName?: string;
  donor?: string;
  donorEmail?: string;
  email?: string;
  amount: number;
  currency?: string;
  campaignTitle?: string;
  campaign?: { title?: string };
  donationType?: string;
  frequency?: string;
  status: string;
  giftAid?: boolean;
  createdAt?: string;
  date?: string;
}

type Tab = "all" | "failed";

const PAGE_SIZE = 50;

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [segment, setSegment] = useState<DonorSegmentParams | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tab, segment, debouncedSearch]);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
      };

      if (segment) {
        if (segment.segment === "campaign" && !segment.campaignId) {
          setDonations([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        Object.assign(params, segmentParamsToQuery(segment));
        if (segment.segment === "recent") {
          params.sort = "createdAt:desc";
        }
      } else if (tab === "failed") {
        params.failedOnly = "true";
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const data = await fetchAdminDonations(params);
      setDonations(data.items || data || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? (Math.ceil((data.total ?? 0) / PAGE_SIZE) || 1));
    } catch {
      toast.error("Failed to load donations");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [tab, segment, page, debouncedSearch]);

  useEffect(() => {
    void loadDonations();
  }, [loadDonations]);

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === "failed") setSegment(null);
  }

  function handleSegmentChange(next: DonorSegmentParams | null) {
    setSegment(next);
    if (next) setTab("all");
  }

  async function handleExport() {
    try {
      const params: Record<string, string> = { limit: "5000", page: "1" };
      if (segment) {
        if (segment.segment === "campaign" && !segment.campaignId) {
          toast.error("Select a campaign first");
          return;
        }
        Object.assign(params, segmentParamsToQuery(segment));
      } else if (tab === "failed") {
        params.failedOnly = "true";
      }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const data = await fetchAdminDonations(params);
      const rows = data.items || [];

      const csvRows = [
        ["Donor", "Email", "Amount", "Currency", "Campaign", "Source", "Frequency", "Status", "Gift Aid", "Date"],
        ...rows.map((d: Donation) => [
          d.donorName || d.donor || "Anonymous",
          d.donorEmail || d.email || "",
          String(d.amount),
          d.currency || "GBP",
          resolveDonationCampaignName(d) || "",
          formatDonationTypeLabel(d.donationType),
          d.frequency || "one-time",
          d.status,
          d.giftAid ? "Yes" : "No",
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.date || "",
        ]),
      ];
      const csv = csvRows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donations-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Donations</h1>
          <p className="text-muted-foreground mt-1">
            Transaction dashboard — {total.toLocaleString()}{" "}
            {tab === "failed" && !segment ? "issues" : "results"}
          </p>
        </div>
        <Button variant="outline" onClick={() => void handleExport()}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <DonorAudienceFilter value={segment} onChange={handleSegmentChange} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "failed"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabChange(t)}
              disabled={Boolean(segment)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                tab === t && !segment
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
                segment && "opacity-50 cursor-not-allowed"
              )}
            >
              {t === "all" ? "All transactions" : "Failed & incomplete"}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm flex-1 sm:flex-none sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by donor or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading donations...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => {
                  const currency = normalizeCurrencyCode(d.currency);
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium">{d.donorName || d.donor || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{d.donorEmail || d.email || "—"}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {formatMoney(Number(d.amount || 0), { from: currency, code: currency })}
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const campaignName = resolveDonationCampaignName(d);
                          if (!campaignName) {
                            return <span className="text-muted-foreground">—</span>;
                          }
                          return (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20">
                              {campaignName}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            d.donationType === QUICK_DONATION_TYPE
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {formatDonationTypeLabel(d.donationType)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {d.createdAt
                          ? new Date(d.createdAt).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : d.date || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            DONATION_STATUS_STYLES[d.status] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
                            <Link href={`/admin/donations/${d.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </Button>
                          {d.status === "completed" && (
                            <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
                              <Link href={`/admin/donations/${d.id}?tab=receipt`}>
                                <FileText className="h-3.5 w-3.5" />
                                Receipt
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      No donations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
