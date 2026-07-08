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

function formatLogDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <div className="space-y-3 min-w-0">
      {/* Mobile: stacked cards — no horizontal scroll */}
      <div className="space-y-3 md:hidden">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-xl border bg-card p-4 space-y-2 text-sm min-w-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium capitalize">{log.type || "Payment"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatLogDate(log.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  DONATION_STATUS_STYLES[log.status || ""] || "bg-secondary"
                )}
              >
                {log.status}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {formatPaymentProvider(log.provider)}
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(Number(log.amount || 0), {
                  from: normalizeCurrencyCode(log.currency),
                  code: normalizeCurrencyCode(log.currency),
                })}
              </span>
            </div>
            {(log.errorMessage || log.providerTransactionId) && (
              <p className="text-xs text-muted-foreground break-all">
                {log.errorMessage || log.providerTransactionId}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[18%]">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[12%]">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[14%]">
                Provider
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[14%]">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[12%]">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-muted-foreground">
                  {formatLogDate(log.createdAt)}
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
                <td className="px-4 py-3 text-xs text-muted-foreground break-words">
                  {log.errorMessage || log.providerTransactionId || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
