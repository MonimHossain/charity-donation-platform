export const DONATION_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
};

export const SCHEDULE_STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  paused: "bg-amber-100 text-amber-700",
  awaiting_payment_method: "bg-amber-100 text-amber-700",
};

export function stripeDashboardPaymentUrl(
  paymentIntentId?: string | null,
  testMode = true
): string | null {
  if (!paymentIntentId) return null;
  const base = testMode
    ? "https://dashboard.stripe.com/test/payments"
    : "https://dashboard.stripe.com/payments";
  return `${base}/${paymentIntentId}`;
}

export function formatPaymentProvider(provider?: string): string {
  if (!provider) return "—";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export type ReceiptData = {
  receiptNumber?: string;
  donorName?: string;
  donorEmail?: string;
  amount?: number;
  currency?: string;
  giftAid?: boolean;
  giftAidAmount?: number;
  totalAmount?: number;
  campaignTitle?: string;
  frequency?: string;
  date?: string;
  status?: string;
  paymentMethod?: string;
  donationId?: string;
};
