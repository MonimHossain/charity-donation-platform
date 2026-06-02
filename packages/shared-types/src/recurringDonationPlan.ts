/**
 * Recurring donation plan — created at checkout, executed by payment provider later.
 * Payment integration can attach a mandate/subscription id to `paymentProfileId`.
 */
export type RecurringInstallmentStatus =
  | "pending"
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled";

export type RecurringInstallment = {
  id: string;
  /** ISO date (YYYY-MM-DD) when this charge should run */
  scheduledDate: string;
  amount: number;
  currency: string;
  weight: number;
  status: RecurringInstallmentStatus;
};

export type RecurringDonationPlanStatus =
  | "draft"
  | "awaiting_payment_method"
  | "active"
  | "completed"
  | "cancelled";

export type RecurringDonationPlan = {
  id: string;
  source: "ramadan_split";
  donationPageId: string;
  donationPageSlug: string;
  campaignId?: string;
  donorName?: string;
  donorEmail?: string;
  totalAmount: number;
  currency: string;
  installments: RecurringInstallment[];
  status: RecurringDonationPlanStatus;
  /** Set when Stripe/PayPal mandate or subscription is created */
  paymentProfileId?: string;
  paymentProvider?: string;
  automatedScheduleId?: string;
};
