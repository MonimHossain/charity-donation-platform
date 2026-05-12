"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface RecurringDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  frequency: string;
  campaignTitle: string;
  status: string;
  nextPaymentDate: string;
  totalPaid: number;
  createdAt: string;
}

type StatusFilter = "all" | "active" | "paused" | "cancelled" | "failed";

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function loadRecurring() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/admin/recurring", { params });
      setDonations(data.items || data || []);
    } catch {
      toast.error("Failed to load recurring donations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecurring();
  }, [statusFilter]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this recurring donation?")) return;
    setCancelling(id);
    try {
      await api.put(`/recurring/${id}/cancel`);
      toast.success("Recurring donation cancelled");
      loadRecurring();
    } catch {
      toast.error("Failed to cancel donation");
    } finally {
      setCancelling(null);
    }
  }

  const filtered = donations.filter((d) => {
    const name = d.donorName || "";
    const email = d.donorEmail || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const totalActive = donations.filter((d) => d.status === "active").length;
  const totalMonthly = donations.filter((d) => d.status === "active").reduce((sum, d) => sum + d.amount, 0);

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
          <p className="text-2xl font-bold">{filtered.length}</p>
          <p className="text-sm text-muted-foreground">Total Recurring</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-2xl font-bold">{totalActive}</p>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-2xl font-bold">£{totalMonthly.toLocaleString("en-GB")}</p>
          <p className="text-sm text-muted-foreground">Active Monthly Value</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by donor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
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
                {filtered.length > 0 ? filtered.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{d.donorName || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{d.donorEmail || "—"}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {d.currency === "USD" ? "$" : "£"}{Number(d.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{d.frequency}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.campaignTitle || "—"}</td>
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
