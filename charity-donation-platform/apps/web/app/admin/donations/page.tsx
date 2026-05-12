"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchAdminDonations } from "@/lib/api";

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
  frequency?: string;
  status: string;
  giftAid?: boolean;
  createdAt?: string;
  date?: string;
}

const statusStyles: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  refunded: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAdminDonations();
        setDonations(data.items || data || []);
      } catch {
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = donations.filter((d) => {
    const name = d.donorName || d.donor || "";
    const id = d.id || "";
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleExport() {
    const rows = [
      ["Donor", "Email", "Amount", "Currency", "Campaign", "Frequency", "Status", "Gift Aid", "Date"],
      ...filtered.map((d) => [
        d.donorName || d.donor || "Anonymous",
        d.donorEmail || d.email || "",
        String(d.amount),
        d.currency || "GBP",
        d.campaignTitle || d.campaign?.title || "",
        d.frequency || "one-time",
        d.status,
        d.giftAid ? "Yes" : "No",
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.date || "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading donations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            Donations
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all donations ({donations.length} total)
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by donor or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Frequency</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Gift Aid</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium">{d.donorName || d.donor || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{d.donorEmail || d.email || "—"}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {d.currency === "USD" ? "$" : "£"}
                    {Number(d.amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {d.campaignTitle || d.campaign?.title || "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">
                    {d.frequency || "one-time"}
                  </td>
                  <td className="px-5 py-3">
                    {d.giftAid ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.date || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusStyles[d.status] || "bg-slate-100 text-slate-600"
                      )}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No donations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
