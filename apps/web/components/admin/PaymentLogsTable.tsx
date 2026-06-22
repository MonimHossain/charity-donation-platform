"use client";

import { cn } from "@/lib/utils";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";
import { DONATION_STATUS_STYLES, formatPaymentProvider } from "@/lib/payment-utils";

export type PaymentLogRow = {
  id: string;
  type?: string;
  provider?: string;
  providerTransactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  errorMessage?: string;
  createdAt?: string;
  donorName?: string;
  donationId?: string;
};

export default function PaymentLogsTable({
  logs,
  emptyMessage = "No payment events recorded.",
}: {
  logs: PaymentLogRow[];
  emptyMessage?: string;
}) {
  if (!logs.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b last:border-0">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 capitalize">{log.type || "—"}</td>
              <td className="px-4 py-3">{formatPaymentProvider(log.provider)}</td>
              <td className="px-4 py-3 font-medium tabular-nums">
                {formatMoney(Number(log.amount || 0), {
                  from: normalizeCurrencyCode(log.currency),
                  code: normalizeCurrencyCode(log.currency),
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    DONATION_STATUS_STYLES[log.status || ""] || "bg-secondary"
                  )}
                >
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">
                {log.errorMessage || log.providerTransactionId || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
