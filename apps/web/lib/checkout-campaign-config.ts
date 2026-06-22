import { fetchCampaignBySlug } from "@/lib/api";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";
import type { DonationCartItem } from "@/lib/stores/donationCartStore";

export type CampaignUpsell = {
  id: string;
  name: string;
  amount: number;
  description?: string;
  image?: string;
  isActive?: boolean;
  /** @deprecated legacy inline upsell */
  label?: string;
};

export type CheckoutCampaignConfig = {
  checkoutSettings: CheckoutSettings;
  upsells: CampaignUpsell[];
};

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  allowAnonymous: true,
  enableGiftAid: false,
  enableDedication: true,
  enableComments: false,
  enableUpsell: false,
  enableFeeCoverage: false,
  enableAdminSavesLife: false,
  adminSavesLifeAmount: 0,
};

export const DEFAULT_CAMPAIGN_CONFIG: CheckoutCampaignConfig = {
  checkoutSettings: DEFAULT_CHECKOUT_SETTINGS,
  upsells: [],
};

function asBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

export function normalizeCheckoutSettings(raw?: Partial<CheckoutSettings> | null): CheckoutSettings {
  if (!raw) return { ...DEFAULT_CHECKOUT_SETTINGS };
  return {
    allowAnonymous: raw.allowAnonymous !== false,
    enableGiftAid: asBool(raw.enableGiftAid),
    enableDedication: raw.enableDedication !== false,
    enableComments: asBool(raw.enableComments),
    enableUpsell: asBool(raw.enableUpsell),
    enableFeeCoverage: asBool(raw.enableFeeCoverage),
    enableAdminSavesLife: asBool(raw.enableAdminSavesLife),
    adminSavesLifeAmount: Math.max(0, Number(raw.adminSavesLifeAmount ?? 0) || 0),
  };
}

function mergeCheckoutSettings(
  base: CheckoutSettings,
  next: CheckoutSettings
): CheckoutSettings {
  return {
    allowAnonymous: base.allowAnonymous && next.allowAnonymous,
    enableGiftAid: base.enableGiftAid || next.enableGiftAid,
    enableDedication: base.enableDedication || next.enableDedication,
    enableComments: base.enableComments || next.enableComments,
    enableUpsell: base.enableUpsell || next.enableUpsell,
    enableFeeCoverage: base.enableFeeCoverage || next.enableFeeCoverage,
    enableAdminSavesLife: base.enableAdminSavesLife || next.enableAdminSavesLife,
    adminSavesLifeAmount: next.enableAdminSavesLife
      ? next.adminSavesLifeAmount
      : base.adminSavesLifeAmount,
  };
}

export function resolveCheckoutConfigFromCart(items: DonationCartItem[]): CheckoutCampaignConfig {
  let checkoutSettings = { ...DEFAULT_CHECKOUT_SETTINGS };
  let upsells: CampaignUpsell[] = [];
  let hasEmbedded = false;

  for (const item of items) {
    if (item.checkoutSettings) {
      hasEmbedded = true;
      checkoutSettings = mergeCheckoutSettings(
        checkoutSettings,
        normalizeCheckoutSettings(item.checkoutSettings)
      );
    }
    if (item.checkoutUpsells?.length && !upsells.length) {
      upsells = item.checkoutUpsells.filter((u) => u.isActive !== false);
    }
  }

  if (!hasEmbedded) {
    return DEFAULT_CAMPAIGN_CONFIG;
  }

  return { checkoutSettings, upsells };
}

export async function fetchCheckoutCampaignConfig(
  slug: string,
  campaignId?: string
): Promise<CheckoutCampaignConfig> {
  try {
    const campaign = await fetchCampaignBySlug(slug);
    return {
      checkoutSettings: normalizeCheckoutSettings(campaign?.checkoutSettings),
      upsells: (campaign?.upsells ?? [])
        .filter((u: CampaignUpsell) => u.isActive !== false)
        .map((u: CampaignUpsell) => ({
          ...u,
          name: u.name || u.label || "",
          amount: Number(u.amount ?? 0),
        })),
    };
  } catch {
    if (campaignId && slug !== campaignId) {
      try {
        const campaign = await fetchCampaignBySlug(campaignId);
        return {
          checkoutSettings: normalizeCheckoutSettings(campaign?.checkoutSettings),
          upsells: (campaign?.upsells ?? [])
        .filter((u: CampaignUpsell) => u.isActive !== false)
        .map((u: CampaignUpsell) => ({
          ...u,
          name: u.name || u.label || "",
          amount: Number(u.amount ?? 0),
        })),
        };
      } catch {
        /* fall through */
      }
    }
    return DEFAULT_CAMPAIGN_CONFIG;
  }
}

export async function resolveCheckoutCampaignConfig(
  items: DonationCartItem[]
): Promise<CheckoutCampaignConfig> {
  const fromCart = resolveCheckoutConfigFromCart(items);
  const primary = items[0];

  if (!primary?.donationPageSlug && !primary?.campaignId) {
    return fromCart;
  }

  const fetched = await fetchCheckoutCampaignConfig(
    primary.donationPageSlug || primary.campaignId || "",
    primary.campaignId
  );

  return {
    checkoutSettings: mergeCheckoutSettings(
      fromCart.checkoutSettings,
      fetched.checkoutSettings
    ),
    upsells: fetched.upsells.length ? fetched.upsells : fromCart.upsells,
  };
}

export function isGiftAidCheckoutEnabled(checkoutSettings: CheckoutSettings): boolean {
  return normalizeCheckoutSettings(checkoutSettings).enableGiftAid;
}

export function giftAidBoostApplies(currency: string): boolean {
  return currency.toUpperCase() === "GBP";
}
