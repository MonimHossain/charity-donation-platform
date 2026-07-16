import type { DonationCartItem } from "@/lib/stores/donationCartStore";
import { resolveGtmCampaignMeta } from "./campaign-gtm-mapping";
import { mapFrequencyToGtm } from "./donation-data";
import { pushDonationEvent } from "./push-donation-event";

function cartLineFrequency(line: DonationCartItem): string {
  if (line.kind === "ramadan_split") return "ramadan_split";
  if (line.recurringFrequency) return line.recurringFrequency;
  return "single";
}

function cartLineDonationType(line: DonationCartItem, metaDonationType: string): string {
  if (line.kind === "ramadan_split") return "ramadan";
  if (line.kind === "fidya_kaffarah") return "fidya_kaffarah";
  return metaDonationType;
}

export function buildGtmItemsFromCart(lines: DonationCartItem[]) {
  return lines.map((line) => {
    const slug = line.campaignSlug || line.donationPageSlug;
    const meta = resolveGtmCampaignMeta({
      slug,
      title: line.title,
      category: line.category,
      campaignMode: line.kind,
      donationType: line.donationType,
    });
    const frequency = mapFrequencyToGtm(cartLineFrequency(line));
    const quantity = Math.max(1, Number(line.quantity || 1));
    const unitPrice =
      line.unitPrice != null
        ? Number(line.unitPrice)
        : Number(line.amount || 0) / quantity;
    return {
      item_id: meta.appealId,
      item_name: meta.appealName,
      item_category: meta.category,
      // line.amount is the line total; GA4 multiplies price × quantity
      price: +unitPrice.toFixed(2),
      quantity,
      donation_type: cartLineDonationType(line, meta.donationType),
      donation_frequency: frequency,
      appeal_id: meta.appealId,
    };
  });
}

/** Fire on checkout payment step (after Gift Aid), not on cart entry. */
export function pushBeginCheckoutFromCart(input: {
  items: DonationCartItem[];
  giftAid: boolean;
  amount: number;
  currency: string;
}) {
  const primary = input.items[0];
  if (!primary) return;

  const slug = primary.campaignSlug || primary.donationPageSlug;
  void pushDonationEvent(
    "begin_checkout",
    {
      appealId: slug,
      appealName: primary.title,
      category: primary.category,
      campaignMode: primary.kind,
      donationType: primary.donationType,
      amount: input.amount,
      currency: input.currency,
      frequency: cartLineFrequency(primary),
      giftAid: input.giftAid,
    },
    { items: buildGtmItemsFromCart(input.items) }
  );
}
