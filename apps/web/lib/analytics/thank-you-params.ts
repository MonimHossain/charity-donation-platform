import { resolveGtmCampaignMeta } from "./campaign-gtm-mapping";
import { splitDonorName } from "./pii-hash";
import { mapPaymentTypeToGtm } from "./donation-data";

export interface ThankYouAnalyticsParams {
  amount: string;
  currency: string;
  frequency: string;
  giftAid: string;
  donationId?: string;
  receiptNumber?: string;
  campaignSlug?: string;
  campaignName?: string;
  category?: string;
  donationType?: string;
  paymentType?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  commitmentTotal?: string;
  installmentCount?: string;
  installmentAmount?: string;
}

export function buildThankYouSearchParams(input: {
  amount: number | string;
  currency: string;
  frequency: string;
  giftAid: boolean;
  donationId?: string;
  receiptNumber?: string;
  campaignSlug?: string;
  campaignTitle?: string;
  category?: string;
  donationType?: string;
  campaignMode?: string;
  paymentMethod?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  commitmentTotal?: number | string;
  installmentCount?: number | string;
  installmentAmount?: number | string;
}): URLSearchParams {
  const meta = resolveGtmCampaignMeta({
    slug: input.campaignSlug,
    title: input.campaignTitle,
    category: input.category,
    campaignMode: input.campaignMode,
    donationType: input.donationType,
  });

  const { firstName, lastName } = splitDonorName(input.donorName || "");
  const params = new URLSearchParams({
    amount: String(input.amount),
    currency: input.currency,
    frequency: input.frequency,
    giftAid: String(input.giftAid),
  });

  if (input.donationId) params.set("donationId", input.donationId);
  if (input.receiptNumber) params.set("receiptNumber", input.receiptNumber);
  if (meta.appealId) params.set("campaignSlug", meta.appealId);
  if (meta.appealName) params.set("campaignName", meta.appealName);
  params.set("category", meta.category);
  params.set("donationType", meta.donationType);
  if (input.paymentMethod) params.set("paymentType", mapPaymentTypeToGtm(input.paymentMethod));
  if (firstName) params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);
  if (input.donorEmail) params.set("email", input.donorEmail);
  if (input.donorPhone) params.set("phone", input.donorPhone);
  if (input.commitmentTotal != null) params.set("commitmentTotal", String(input.commitmentTotal));
  if (input.installmentCount != null) params.set("installmentCount", String(input.installmentCount));
  if (input.installmentAmount != null) params.set("installmentAmount", String(input.installmentAmount));

  return params;
}

export function parseThankYouParams(params: URLSearchParams): ThankYouAnalyticsParams {
  return {
    amount: params.get("amount") || "0",
    currency: params.get("currency") || "GBP",
    frequency: params.get("frequency") || "single",
    giftAid: params.get("giftAid") || "false",
    donationId: params.get("donationId") || undefined,
    receiptNumber: params.get("receiptNumber") || undefined,
    campaignSlug: params.get("campaignSlug") || params.get("campaign") || undefined,
    campaignName: params.get("campaignName") || undefined,
    category: params.get("category") || undefined,
    donationType: params.get("donationType") || undefined,
    paymentType: params.get("paymentType") || params.get("provider") || undefined,
    firstName: params.get("firstName") || undefined,
    lastName: params.get("lastName") || undefined,
    email: params.get("email") || undefined,
    phone: params.get("phone") || undefined,
    commitmentTotal: params.get("commitmentTotal") || undefined,
    installmentCount: params.get("installmentCount") || undefined,
    installmentAmount: params.get("installmentAmount") || undefined,
  };
}
