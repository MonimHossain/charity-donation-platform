"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";
import { DONATION_STATUS_STYLES, type ReceiptData } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";

export default function DonationReceiptView({
  receipt,
  showPrint = true,
}: {
  receipt: ReceiptData;
  showPrint?: boolean;
}) {
  const currency = normalizeCurrencyCode(receipt.currency);
  const dateLabel = receipt.date
    ? new Date(receipt.date).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
            Donation receipt
          </p>
          <h2 className="font-serif text-2xl text-primary mt-1">
            {receipt.receiptNumber || "Receipt"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{dateLabel}</p>
        </div>
        {showPrint && (
          <Button
            type="button"
            variant="outline"
            className="rounded-full gap-2 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5 print:shadow-none">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Donor</p>
            <p className="font-medium mt-1">{receipt.donorName || "—"}</p>
            <p className="text-sm text-muted-foreground">{receipt.donorEmail || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <span
              className={cn(
                "inline-flex mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                DONATION_STATUS_STYLES[receipt.status || ""] || "bg-secondary text-secondary-foreground"
              )}
            >
              {receipt.status || "—"}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium text-right">{receipt.campaignTitle || "General"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-medium capitalize">{receipt.frequency || "single"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment method</span>
            <span className="font-medium capitalize">{receipt.paymentMethod || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Donation amount</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(Number(receipt.amount || 0), { from: currency, code: currency })}
            </span>
          </div>
          {receipt.giftAid && Number(receipt.giftAidAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gift Aid (25%)</span>
              <span className="font-semibold tabular-nums text-accent-deep">
                +{formatMoney(Number(receipt.giftAidAmount || 0), { from: currency, code: currency })}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-4 flex justify-between items-center">
          <span className="font-semibold text-primary">Total</span>
          <span className="font-serif text-2xl font-bold text-primary tabular-nums">
            {formatMoney(Number(receipt.totalAmount ?? receipt.amount ?? 0), {
              from: currency,
              code: currency,
            })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Thank you for your generous support. This receipt confirms your donation. Please retain
          it for your records.
          {receipt.giftAid
            ? " Gift Aid has been claimed where applicable."
            : ""}
        </p>
      </div>
    </div>
  );
}
