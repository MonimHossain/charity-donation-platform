"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { DonorSegmentParams } from "@repo/shared-types";
import { Search, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import DonorAudienceFilter, {
  segmentParamsToQuery,
} from "@/components/admin/DonorAudienceFilter";
import { resolveDonationCampaignName } from "@/lib/quick-donate";
import {
  recurringAmountToMonthlyEquivalent,
  recurringIntervalLabel,
} from "@/lib/stripe-recurring";

interface RecurringDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  frequency: string;
  campaignTitle?: string;
  campaign?: { title?: string };
  status: string;
  nextPaymentDate: string;
  totalPaid: number;
  createdAt: string;
}

type Tab = "all" | "failed";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

export default function RecurringPage() {
  const [donations, setDonations] = useState<RecurringDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [segment, setSegment] = useState<DonorSegmentParams | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadRecurring = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "500" };

      if (segment) {
        if (segment.segment === "campaign" && !segment.campaignId) {
          setDonations([]);
          return;
        }
        Object.assign(params, segmentParamsToQuery(segment));
      } else if (tab === "failed") {
        params.failedOnly = "true";
      }

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const { data } = await api.get("/admin/recurring", { params });
      setDonations(data.items || data || []);
    } catch {
      toast.error("Failed to load recurring donations");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [tab, segment, debouncedSearch]);

  useEffect(() => {
    void loadRecurring();
  }, [loadRecurring]);

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === "failed") setSegment(null);
  }

  function handleSegmentChange(next: DonorSegmentParams | null) {
    setSegment(next);
    if (next) setTab("all");
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this recurring donation?")) return;
    setCancelling(id);
    try {
      await api.put(`/recurring/${id}/cancel`);
      toast.success("Recurring donation cancelled");
      void loadRecurring();
    } catch {
      toast.error("Failed to cancel donation");
    } finally {
      setCancelling(null);
    }
  }

  const totalActive = donations.filter((d) => d.status === "active").length;
  const estimatedMonthlyRecurring = donations
    .filter((d) => d.status === "active")
    .reduce((sum, d) => sum + recurringAmountToMonthlyEquivalent(Number(d.amount), d.frequency), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Recurring Donations</h1>
          <p className="text-muted-foreground mt-1">Manage all recurring donation subscriptions</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-2xl font-bold">{donations.length}</p>
          <p className="text-sm text-muted-foreground">Total Recurring</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-2xl font-bold">{totalActive}</p>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-2xl font-bold">
            £
            {estimatedMonthlyRecurring.toLocaleString("en-GB", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-muted-foreground">Est. monthly recurring</p>
          <p className="text-xs text-muted-foreground mt-1">
            Active subscriptions normalised to a monthly equivalent
          </p>
        </div>
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
              {t === "all" ? "All subscriptions" : "Failed & incomplete"}
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

      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Frequency</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Next Payment</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Total Paid</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.length > 0 ? donations.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{d.donorName || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{d.donorEmail || "—"}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {d.currency === "USD" ? "$" : "£"}{Number(d.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">
                      {recurringIntervalLabel(d.frequency)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{resolveDonationCampaignName(d) || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[d.status] || "bg-slate-100 text-slate-600")}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {d.nextPaymentDate ? new Date(d.nextPaymentDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      £{Number(d.totalPaid || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {d.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleCancel(d.id)}
                          disabled={cancelling === d.id}
                        >
                          {cancelling === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No recurring donations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
