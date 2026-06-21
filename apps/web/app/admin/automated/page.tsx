"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Pause,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchAdminAutomatedSchedules } from "@/lib/api";
import { SCHEDULE_STATUS_STYLES } from "@/lib/payment-utils";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";

interface Schedule {
  id: string;
  donorName: string;
  donorEmail: string;
  totalAmount: number;
  dailyAmount: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  completedDays: number;
  paidAmount: number;
  status: string;
  currency: string;
  campaign?: { title: string };
  createdAt: string;
}

const statusIcons: Record<string, React.ElementType> = {
  scheduled: Clock,
  active: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  paused: Pause,
  awaiting_payment_method: Pause,
};

type Tab = "all" | "failed";

export default function AutomatedDonationsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { limit: "500" };
        if (tab === "failed") params.failedOnly = "true";
        const data = await fetchAdminAutomatedSchedules(params);
        setSchedules(data.items || data || []);
      } catch {
        toast.error("Failed to load automated donations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  const filtered = schedules.filter(
    (s) =>
      s.donorName.toLowerCase().includes(search.toLowerCase()) ||
      s.donorEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Automated Donations</h1>
        <p className="text-muted-foreground mt-1">
          Scheduled daily splits — {schedules.length} {tab === "failed" ? "with issues" : "total"}
        </p>
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
              {t === "all" ? "All schedules" : "Failed & incomplete"}
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

      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Progress</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pct = s.totalDays > 0 ? Math.round((s.completedDays / s.totalDays) * 100) : 0;
                  const StatusIcon = statusIcons[s.status] || Clock;
                  const currency = normalizeCurrencyCode(s.currency);
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium">{s.donorName}</p>
                        <p className="text-xs text-muted-foreground">{s.donorEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{s.campaign?.title || "General"}</td>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {formatMoney(s.totalAmount, { from: currency, code: currency })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {s.completedDays}/{s.totalDays} days ({pct}%)
                          </p>
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <p>{new Date(s.startDate).toLocaleDateString("en-GB")}</p>
                        <p>→ {new Date(s.endDate).toLocaleDateString("en-GB")}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            SCHEDULE_STATUS_STYLES[s.status] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
                          <Link href={`/admin/automated/${s.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      No automated donations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
