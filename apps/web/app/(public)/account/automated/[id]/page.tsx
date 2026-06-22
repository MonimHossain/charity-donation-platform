"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { fetchMyAutomatedScheduleById } from "@/lib/api";
import PaymentLogsTable, { type PaymentLogRow } from "@/components/admin/PaymentLogsTable";
import { DONATION_STATUS_STYLES, SCHEDULE_STATUS_STYLES } from "@/lib/payment-utils";

interface Installment {
  id: string;
  amount: number;
  totalAmount?: number;
  currency: string;
  status: string;
  receiptNumber?: string;
  createdAt: string;
}

export default function UserAutomatedDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { formatMoney } = useCurrency();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAutomatedScheduleById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-16">Plan not found.</p>;
  }

  const donations = (data.donations as Installment[]) || [];
  const paymentLogs = (data.paymentLogs as PaymentLogRow[]) || [];
  const failedLogs = paymentLogs.filter((l) =>
    ["failed", "pending", "cancelled"].includes(l.status || "")
  );
  const failedDonations = donations.filter((d) =>
    ["failed", "pending"].includes(d.status)
  );
  const currency = String(data.currency || "GBP");
  const pct =
    Number(data.totalDays) > 0
      ? Math.round((Number(data.completedDays) / Number(data.totalDays)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-full -ml-2">
        <Link href="/account/automated">← Automated donations</Link>
      </Button>

      <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total commitment</p>
            <p className="font-serif text-3xl font-bold text-primary tabular-nums">
              {formatMoney(Number(data.totalAmount), { from: currency })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Paid: {formatMoney(Number(data.paidAmount || 0), { from: currency })} ·{" "}
              {Number(data.completedDays)}/{Number(data.totalDays)} days ({pct}%)
            </p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize",
              SCHEDULE_STATUS_STYLES[String(data.status)] || "bg-secondary"
            )}
          >
            {String(data.status).replace(/_/g, " ")}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {(data.campaignTitle as string) || "General"} ·{" "}
          {new Date(String(data.startDate)).toLocaleDateString("en-GB")} –{" "}
          {new Date(String(data.endDate)).toLocaleDateString("en-GB")}
        </p>
      </div>

      {(failedDonations.length > 0 || failedLogs.length > 0) && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 space-y-4">
          <h3 className="font-semibold text-red-800">Failed & incomplete payments</h3>
          {failedLogs.length > 0 ? (
            <PaymentLogsTable logs={failedLogs} />
          ) : (
            <p className="text-sm text-muted-foreground">No detailed failure logs yet.</p>
          )}
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
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {formatMoney(d.amount, { from: d.currency || currency })}
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
                  <td className="px-4 py-3 text-right">
                    {d.status === "completed" ? (
                      <Link
                        href={`/account/receipt/${d.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Receipt
                      </Link>
                    ) : d.status === "failed" || d.status === "pending" ? (
                      <Link
                        href={`/account/donations/${d.id}`}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Details
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
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

      {paymentLogs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-primary">Payment history</h3>
          <PaymentLogsTable logs={paymentLogs} />
        </div>
      )}
    </div>
  );
}
