import type { RamadanSplitConfig } from "@/lib/campaign-experience";
import type { PresetAmount, RegularPaymentConfig, SinglePaymentConfig } from "@/lib/campaign-payment-config";
import {
  normalizeCampaignAttribute,
  type CampaignAttribute,
} from "@/components/campaigns/campaign-detail-types";
import { sortCampaignAttributes } from "@/lib/campaign-attributes";
import { defaultQuickDonateAmount } from "@/lib/quick-donate";

export interface QuickDonateCampaignPayload {
  id: string;
  slug: string;
  title: string;
  currency: string;
  campaignMode: string;
  category?: string;
  experienceConfig?: RamadanSplitConfig | Record<string, unknown>;
  attributes: CampaignAttribute[];
}

export function isQuickDonateRamadanCampaign(
  campaign: QuickDonateCampaignPayload | null | undefined
): boolean {
  return campaign?.campaignMode === "ramadan_split";
}

export function quickDonateHasRamadanConfig(
  campaign: QuickDonateCampaignPayload | null | undefined
): boolean {
  if (!campaign?.experienceConfig || typeof campaign.experienceConfig !== "object") return false;
  const exp = campaign.experienceConfig as RamadanSplitConfig;
  if (Array.isArray(exp.startChoices) && exp.startChoices.length > 0) return true;
  return Boolean(exp.ramadanStartDate);
}

export type QuickDonatePaymentConfig = SinglePaymentConfig | RegularPaymentConfig;

export function normalizeQuickDonateCampaign(
  raw: Record<string, unknown> | null | undefined
): QuickDonateCampaignPayload | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  const attributes = sortCampaignAttributes(
    (Array.isArray(raw.attributes) ? raw.attributes : []).map((attr) =>
      normalizeCampaignAttribute(attr as CampaignAttribute)
    )
  );
  return {
    id: String(raw.id),
    slug: String(raw.slug || ""),
    title: String(raw.title || ""),
    currency: String(raw.currency || "GBP"),
    campaignMode: String(raw.campaignMode || "standard"),
    category: String(raw.category || "general"),
    experienceConfig:
      raw.experienceConfig && typeof raw.experienceConfig === "object"
        ? (raw.experienceConfig as RamadanSplitConfig)
        : {},
    attributes,
  };
}

/** Payment type follows the selected campaign attribute (not a separate single/monthly toggle). */
export function getQuickDonatePaymentType(
  attr: CampaignAttribute | undefined
): "single" | "regular" {
  if (!attr) return "single";
  if (attr.enableRegularPayment) return "regular";
  return "single";
}

export function getQuickDonatePaymentConfig(
  attr: CampaignAttribute | undefined,
  paymentType: "single" | "regular"
): QuickDonatePaymentConfig | null {
  if (!attr) return null;
  return paymentType === "regular" ? attr.regularPaymentConfig : attr.singlePaymentConfig;
}

export function getQuickDonatePresets(
  attr: CampaignAttribute | undefined,
  paymentType: "single" | "regular"
): PresetAmount[] {
  const config = getQuickDonatePaymentConfig(attr, paymentType);
  if (!config) return [];
  return [...(config.presetAmounts || [])].sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
}

export function quickDonateShowsPresets(config: QuickDonatePaymentConfig | null): boolean {
  if (!config) return false;
  return (
    (config.priceType === "preset" || config.priceType === "both") &&
    (config.presetAmounts?.length ?? 0) > 0
  );
}

export function quickDonateAllowsCustomAmount(config: QuickDonatePaymentConfig | null): boolean {
  if (!config) return false;
  return config.priceType === "custom" || config.priceType === "both";
}

export function defaultAmountForAttribute(
  attr: CampaignAttribute | undefined,
  paymentType: "single" | "regular"
): number {
  const config = getQuickDonatePaymentConfig(attr, paymentType);
  if (!config) return 0;

  if (quickDonateShowsPresets(config)) {
    const presets = getQuickDonatePresets(attr, paymentType);
    if (!presets.length) return 0;
    return defaultQuickDonateAmount(
      presets.map((p, i) => ({ amount: p.amount, sortOrder: i }))
    );
  }

  return 0;
}

export function quickDonateStartsWithCustomInput(config: QuickDonatePaymentConfig | null): boolean {
  return Boolean(config && quickDonateAllowsCustomAmount(config) && !quickDonateShowsPresets(config));
}
