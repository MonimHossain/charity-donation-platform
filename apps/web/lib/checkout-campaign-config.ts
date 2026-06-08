import { fetchCampaignBySlug } from "@/lib/api";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";

export type CampaignUpsell = {
  id: string;
  label: string;
  amount: number;
  description?: string;
  isActive?: boolean;
};

export type CheckoutCampaignConfig = {
  checkoutSettings: CheckoutSettings;
  upsells: CampaignUpsell[];
};

const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  allowAnonymous: true,
  enableGiftAid: false,
  enableDedication: true,
  enableComments: false,
  enableUpsell: false,
  enableFeeCoverage: false,
};

export async function fetchCheckoutCampaignConfig(
  slug: string
): Promise<CheckoutCampaignConfig> {
  try {
    const campaign = await fetchCampaignBySlug(slug);
    return {
      checkoutSettings: {
        ...DEFAULT_CHECKOUT_SETTINGS,
        ...(campaign?.checkoutSettings ?? {}),
      },
      upsells: (campaign?.upsells ?? []).filter((u: CampaignUpsell) => u.isActive !== false),
    };
  } catch {
    return { checkoutSettings: DEFAULT_CHECKOUT_SETTINGS, upsells: [] };
  }
}
