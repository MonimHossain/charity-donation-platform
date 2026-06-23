import type { Campaign } from "../../components/campaign/campaign.entity.js";

type CampaignAttribute = Campaign["attributes"][number];
type PaymentConfig = CampaignAttribute["singlePaymentConfig"];

export const QUICK_DONATE_CAMPAIGN_MODES = new Set([
  "standard",
  "fundraiser",
  "ramadan_split",
]);

export function sortCampaignAttributes<T extends { sortOrder?: number }>(
  attributes: T[]
): T[] {
  return [...attributes].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function hasRamadanExperienceConfig(campaign: Campaign): boolean {
  const exp = campaign.experienceConfig;
  if (!exp || typeof exp !== "object") return false;
  const record = exp as { startChoices?: unknown[]; ramadanStartDate?: string };
  if (Array.isArray(record.startChoices) && record.startChoices.length > 0) return true;
  return Boolean(record.ramadanStartDate);
}

/** Pass campaign fields needed by the public quick donate widget. */
export function serializeCampaignForQuickDonate(campaign: Campaign) {
  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    currency: campaign.currency || "GBP",
    campaignMode: campaign.campaignMode || "standard",
    category: campaign.category || "general",
    experienceConfig: campaign.experienceConfig ?? {},
    attributes: sortCampaignAttributes(campaign.attributes || []),
  };
}

function paymentConfigHasDonationOptions(config?: PaymentConfig | null): boolean {
  if (!config) return false;
  const hasPresets = (config.presetAmounts?.length ?? 0) > 0;
  const allowsCustom = config.priceType === "custom" || config.priceType === "both";
  return hasPresets || allowsCustom;
}

export function attributeHasDonationOptions(attr: CampaignAttribute): boolean {
  if (attr.enableSinglePayment && paymentConfigHasDonationOptions(attr.singlePaymentConfig)) {
    return true;
  }
  if (attr.enableRegularPayment && paymentConfigHasDonationOptions(attr.regularPaymentConfig)) {
    return true;
  }
  return false;
}

export function campaignUsableInQuickDonate(campaign: Campaign): boolean {
  if (campaign.status !== "published") return false;
  const mode = campaign.campaignMode || "standard";
  if (!QUICK_DONATE_CAMPAIGN_MODES.has(mode)) return false;

  const attrs = sortCampaignAttributes(campaign.attributes || []);

  if (mode === "ramadan_split") {
    const hasRamadan = hasRamadanExperienceConfig(campaign);
    if (attrs.length === 0) return hasRamadan;
    return hasRamadan || attrs.some(attributeHasDonationOptions);
  }

  if (attrs.length === 0) return false;
  return attrs.some(attributeHasDonationOptions);
}

export const QUICK_DONATE_CAMPAIGN_REQUIREMENTS =
  "Campaign must be published (Standard, Fundraiser, or Ramadan Split) with donation attributes and/or Ramadan start dates configured.";
