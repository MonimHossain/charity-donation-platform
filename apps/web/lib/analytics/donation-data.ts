import { resolveGtmCampaignMeta } from "./campaign-gtm-mapping";
import { getDonorExternalId } from "./donor-external-id";
import { splitDonorName } from "./pii-hash";

export type GtmFrequency = "one_time" | "monthly" | "quarterly" | "annually" | "ramadan_split";

export interface DonationDataInput {
  appealId?: string;
  appealName?: string;
  category?: string;
  donationType?: string;
  campaignMode?: string;
  amount: number;
  currency: string;
  frequency?: string;
  giftAid?: boolean;
  paymentType?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  donorName?: string;
}

export interface DonationData extends DonationDataInput {
  appealId: string;
  appealName: string;
  category: string;
  donationType: string;
  giftAidAmount: number;
  value: number;
}

export function mapFrequencyToGtm(frequency?: string): GtmFrequency {
  const f = (frequency || "single").toLowerCase();
  if (f === "single" || f === "one_time") return "one_time";
  if (f === "monthly" || f === "quarterly" || f === "annually" || f === "ramadan_split") {
    return f as GtmFrequency;
  }
  return "one_time";
}

export function mapPaymentTypeToGtm(paymentMethod?: string): string {
  const p = (paymentMethod || "card").toLowerCase();
  if (p === "stripe") return "card";
  if (p === "apple_pay" || p === "google_pay" || p === "paypal" || p === "card") return p;
  if (p === "telr" || p === "paytabs") return "card";
  return p;
}

function roundMoney(n: number): number {
  return +n.toFixed(2);
}

export function computeGiftAidAmount(amount: number, currency: string, giftAid?: boolean): number {
  if (currency.toUpperCase() === "GBP" && giftAid) {
    return roundMoney(amount * 0.25);
  }
  return 0;
}

export function buildDonationData(input: DonationDataInput): DonationData {
  const meta = resolveGtmCampaignMeta({
    slug: input.appealId,
    title: input.appealName,
    category: input.category,
    campaignMode: input.campaignMode,
    donationType: input.donationType,
  });

  const nameParts =
    input.firstName || input.lastName
      ? { firstName: input.firstName || "", lastName: input.lastName || "" }
      : splitDonorName(input.donorName || "");

  const giftAidAmount = computeGiftAidAmount(input.amount, input.currency, input.giftAid);
  const value = roundMoney(input.amount + giftAidAmount);

  return {
    ...input,
    appealId: meta.appealId,
    appealName: meta.appealName,
    category: meta.category,
    donationType: meta.donationType,
    firstName: nameParts.firstName || input.firstName,
    lastName: nameParts.lastName || input.lastName,
    externalId: input.externalId || getDonorExternalId(),
    giftAidAmount,
    value,
  };
}
