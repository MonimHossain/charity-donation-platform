"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Download,
  Loader2,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchAdminDonations } from "@/lib/api";
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

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { limit: "500" };
        if (tab === "failed") params.failedOnly = "true";
        const data = await fetchAdminDonations(params);
        setDonations(data.items || data || []);
      } catch {
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  const filtered = donations.filter((d) => {
    const name = d.donorName || d.donor || "";
    const id = d.id || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase())
    );
  });

  function handleExport() {
    const rows = [
      ["Donor", "Email", "Amount", "Currency", "Campaign", "Source", "Frequency", "Status", "Gift Aid", "Date"],
      ...filtered.map((d) => [
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
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            Donations
          </h1>
          <p className="text-muted-foreground mt-1">
            Transaction dashboard — {donations.length} {tab === "failed" ? "issues" : "total"}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "failed"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "All transactions" : "Failed & incomplete"}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm flex-1 sm:flex-none sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by donor or ID..."
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
                {filtered.map((d) => {
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
        )}
      </div>
    </div>
  );
}
