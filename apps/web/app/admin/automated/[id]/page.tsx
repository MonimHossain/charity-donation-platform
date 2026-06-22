"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAdminAutomatedScheduleById } from "@/lib/api";
import PaymentLogsTable, { type PaymentLogRow } from "@/components/admin/PaymentLogsTable";
import {
  DONATION_STATUS_STYLES,
  SCHEDULE_STATUS_STYLES,
  stripeDashboardPaymentUrl,
} from "@/lib/payment-utils";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";

interface Installment {
  id: string;
  amount: number;
  totalAmount?: number;
  currency: string;
  status: string;
  receiptNumber?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

export default function AdminAutomatedDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminAutomatedScheduleById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-16">Schedule not found.</p>;
  }

  const donations = (data.donations as Installment[]) || [];
  const paymentLogs = (data.paymentLogs as PaymentLogRow[]) || [];
  const failedLogs = paymentLogs.filter((l) =>
    ["failed", "pending", "cancelled"].includes(l.status || "")
  );
  const currency = normalizeCurrencyCode(String(data.currency || "GBP"));
  const pct =
    Number(data.totalDays) > 0
      ? Math.round((Number(data.completedDays) / Number(data.totalDays)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild className="rounded-full">
        <Link href="/admin/automated">← All automated donations</Link>
      </Button>

      <div className="rounded-2xl border bg-card shadow-soft p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total commitment</p>
            <p className="font-serif text-4xl font-bold text-primary tabular-nums mt-1">
              {formatMoney(Number(data.totalAmount), { from: currency, code: currency })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.donorName as string} · {data.donorEmail as string}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex self-start rounded-full px-3 py-1 text-sm font-semibold capitalize",
              SCHEDULE_STATUS_STYLES[String(data.status)] || "bg-secondary"
            )}
          >
            {String(data.status).replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-3 text-sm">
          <h3 className="font-semibold text-primary">Schedule</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium">{(data.campaignTitle as string) || "General"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily amount</span>
            <span className="font-medium tabular-nums">
              {formatMoney(Number(data.dailyAmount), { from: currency, code: currency })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid so far</span>
            <span className="font-medium tabular-nums">
              {formatMoney(Number(data.paidAmount || 0), { from: currency, code: currency })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {Number(data.completedDays)}/{Number(data.totalDays)} days ({pct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium text-right">
              {new Date(String(data.startDate)).toLocaleDateString("en-GB")} –{" "}
              {new Date(String(data.endDate)).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-3 text-sm">
          <h3 className="font-semibold text-primary">Customer</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{data.donorName as string}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium break-all text-right">{data.donorEmail as string}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment method</span>
            <span className="font-medium capitalize">{String(data.paymentMethod || "stripe")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {data.createdAt
                ? new Date(String(data.createdAt)).toLocaleString("en-GB")
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {failedLogs.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 space-y-4">
          <h3 className="font-semibold text-red-800">Failed & incomplete payments</h3>
          <PaymentLogsTable logs={failedLogs} />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-primary">Installments</h3>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => {
                const stripeUrl = stripeDashboardPaymentUrl(d.stripePaymentIntentId);
                return (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatMoney(d.amount, {
                        from: normalizeCurrencyCode(d.currency || currency),
                        code: normalizeCurrencyCode(d.currency || currency),
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          DONATION_STATUS_STYLES[d.status] || "bg-secondary"
                        )}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/admin/donations/${d.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                      {stripeUrl && (
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-0.5"
                        >
                          Stripe <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No installments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-primary">Payment history</h3>
        <PaymentLogsTable logs={paymentLogs} />
      </div>
    </div>
  );
}
