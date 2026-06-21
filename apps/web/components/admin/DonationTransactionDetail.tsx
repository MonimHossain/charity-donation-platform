"use client";

import Link from "next/link";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";
import {
  DONATION_STATUS_STYLES,
  stripeDashboardPaymentUrl,
  formatPaymentProvider,
} from "@/lib/payment-utils";
import PaymentLogsTable, { type PaymentLogRow } from "@/components/admin/PaymentLogsTable";

export type DonationDetail = {
  id: string;
  receiptNumber?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  amount?: number;
  totalAmount?: number;
  giftAidAmount?: number;
  currency?: string;
  status?: string;
  frequency?: string;
  giftAid?: boolean;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  campaignTitle?: string;
  campaign?: { title?: string };
  donationType?: string;
  createdAt?: string;
  message?: string;
  paymentLogs?: PaymentLogRow[];
};

export default function DonationTransactionDetail({
  donation,
  backHref,
  backLabel = "Back",
  showStripeLink = true,
  receiptHref,
}: {
  donation: DonationDetail;
  backHref: string;
  backLabel?: string;
  showStripeLink?: boolean;
  receiptHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const currency = normalizeCurrencyCode(donation.currency);
  const campaignTitle =
    donation.campaignTitle || donation.campaign?.title || "General";
  const stripeUrl = stripeDashboardPaymentUrl(donation.stripePaymentIntentId);
  const failedLogs =
    donation.paymentLogs?.filter((l) =>
      ["failed", "pending", "cancelled"].includes(l.status || "")
    ) || [];

  const copyId = () => {
    navigator.clipboard.writeText(donation.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link href={backHref}>← {backLabel}</Link>
        </Button>
        {receiptHref && donation.status === "completed" && (
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href={receiptHref}>View receipt</Link>
          </Button>
        )}
      </div>

      {/* Amount header — Stripe-like */}
      <div className="rounded-2xl border bg-card shadow-soft p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-serif text-4xl font-bold text-primary tabular-nums mt-1">
              {formatMoney(Number(donation.totalAmount ?? donation.amount ?? 0), {
                from: currency,
                code: currency,
              })}
            </p>
            {donation.giftAid && Number(donation.giftAidAmount) > 0 && (
              <p className="text-sm text-accent-deep mt-1">
                Includes Gift Aid:{" "}
                {formatMoney(Number(donation.giftAidAmount), {
                  from: currency,
                  code: currency,
                })}
              </p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex self-start rounded-full px-3 py-1 text-sm font-semibold capitalize",
              DONATION_STATUS_STYLES[donation.status || ""] || "bg-secondary"
            )}
          >
            {donation.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
          <h3 className="font-semibold text-primary">Customer</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-right">{donation.donorName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-right break-all">{donation.donorEmail || "—"}</dd>
            </div>
            {donation.donorPhone && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{donation.donorPhone}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
          <h3 className="font-semibold text-primary">Payment details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Transaction ID</dt>
              <dd className="flex items-center gap-1 font-mono text-xs">
                {donation.id.slice(0, 12)}…
                <button type="button" onClick={copyId} className="p-1 hover:bg-muted rounded">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </dd>
            </div>
            {donation.receiptNumber && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Receipt #</dt>
                <dd className="font-medium">{donation.receiptNumber}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="font-medium capitalize">{formatPaymentProvider(donation.paymentMethod)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">
                {donation.createdAt
                  ? new Date(donation.createdAt).toLocaleString("en-GB")
                  : "—"}
              </dd>
            </div>
            {donation.stripePaymentIntentId && (
              <div className="flex justify-between gap-4 items-center">
                <dt className="text-muted-foreground">Stripe PI</dt>
                <dd className="font-mono text-xs">{donation.stripePaymentIntentId}</dd>
              </div>
            )}
          </dl>
          {showStripeLink && stripeUrl && (
            <Button variant="outline" size="sm" asChild className="rounded-full gap-2 mt-2">
              <a href={stripeUrl} target="_blank" rel="noopener noreferrer">
                Open in Stripe <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-primary">Donation</h3>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
              <dt className="text-muted-foreground">Campaign</dt>
              <dd className="font-medium">{campaignTitle}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
              <dt className="text-muted-foreground">Frequency</dt>
              <dd className="font-medium capitalize">{donation.frequency || "single"}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
              <dt className="text-muted-foreground">Base amount</dt>
              <dd className="font-medium tabular-nums">
                {formatMoney(Number(donation.amount || 0), { from: currency, code: currency })}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
              <dt className="text-muted-foreground">Gift Aid</dt>
              <dd className="font-medium">{donation.giftAid ? "Yes" : "No"}</dd>
            </div>
          </dl>
          {donation.message && (
            <p className="text-sm text-muted-foreground border-t pt-3">{donation.message}</p>
          )}
        </div>
      </div>

      {(donation.status === "failed" || donation.status === "pending" || failedLogs.length > 0) && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 space-y-4">
          <h3 className="font-semibold text-red-800">Failed / incomplete payment</h3>
          <PaymentLogsTable
            logs={failedLogs.length ? failedLogs : donation.paymentLogs || []}
            emptyMessage="No failure details recorded yet."
          />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-primary">Payment history</h3>
        <PaymentLogsTable logs={donation.paymentLogs || []} />
      </div>
    </div>
  );
}
