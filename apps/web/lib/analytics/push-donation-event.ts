import {
  buildDonationData,
  mapFrequencyToGtm,
  mapPaymentTypeToGtm,
  type DonationDataInput,
} from "./donation-data";
import { hashUserData } from "./pii-hash";

export type DonationEcommerceEvent =
  | "view_item"
  | "begin_checkout"
  | "purchase";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function getDataLayer(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function buildItem(d: ReturnType<typeof buildDonationData>) {
  const frequency = mapFrequencyToGtm(d.frequency);
  return {
    item_id: d.appealId,
    item_name: d.appealName,
    item_category: d.category,
    price: +d.amount.toFixed(2),
    quantity: 1,
    donation_type: d.donationType,
    donation_frequency: frequency,
    appeal_id: d.appealId,
  };
}

export async function pushDonationEvent(
  eventName: DonationEcommerceEvent,
  raw: DonationDataInput,
  ecommerceParams: Record<string, unknown> = {},
  rootParams: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const d = buildDonationData(raw);
  const frequency = mapFrequencyToGtm(d.frequency);
  const item = buildItem(d);

  const ecommerce: Record<string, unknown> = {
    currency: d.currency.toUpperCase(),
    value: d.value,
    gift_aid: d.giftAid ? 1 : 0,
    gift_aid_amount: d.giftAidAmount,
    donation_frequency: frequency,
    items: [item],
    ...ecommerceParams,
  };

  if (d.paymentType) {
    ecommerce.payment_type = mapPaymentTypeToGtm(d.paymentType);
  }

  const payload: Record<string, unknown> = {
    event: eventName,
    ecommerce,
    ...rootParams,
  };

  if (eventName === "purchase") {
    const user_data = {
      external_id: d.externalId,
      first_name: d.firstName || undefined,
      last_name: d.lastName || undefined,
      email: d.email || undefined,
      phone: d.phone || undefined,
    };
    payload.user_data = user_data;
    payload.user_data_hashed = await hashUserData(user_data);
  }

  const dataLayer = getDataLayer();
  dataLayer.push({ ecommerce: null });
  dataLayer.push(payload);
}
