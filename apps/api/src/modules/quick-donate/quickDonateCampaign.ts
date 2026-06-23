import type { Campaign } from "../../components/campaign/campaign.entity.js";

type CampaignAttribute = Campaign["attributes"][number];

export function sortCampaignAttributes<T extends { sortOrder?: number }>(
  attributes: T[]
): T[] {
  return [...attributes].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function serializeCampaignForQuickDonate(campaign: Campaign) {
  const attributes = sortCampaignAttributes(campaign.attributes || []).map((attr) => ({
    id: attr.id,
    name: attr.name,
    description: attr.description ?? "",
    sortOrder: attr.sortOrder ?? 0,
    enableSinglePayment: Boolean(attr.enableSinglePayment),
    enableRegularPayment: Boolean(attr.enableRegularPayment),
    enableQuantity: Boolean(attr.enableQuantity),
    singlePaymentConfig: attr.singlePaymentConfig,
    regularPaymentConfig: attr.regularPaymentConfig,
  }));

  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    currency: campaign.currency || "GBP",
    campaignMode: campaign.campaignMode || "standard",
    attributes,
  };
}

export function attributeHasDonationOptions(attr: CampaignAttribute): boolean {
  const singlePresets = attr.singlePaymentConfig?.presetAmounts?.length ?? 0;
  const regularPresets = attr.regularPaymentConfig?.presetAmounts?.length ?? 0;
  return singlePresets > 0 || regularPresets > 0;
}

export function campaignUsableInQuickDonate(campaign: Campaign): boolean {
  if (campaign.status !== "published") return false;
  if (campaign.campaignMode === "fundraiser") return false;
  const attrs = sortCampaignAttributes(campaign.attributes || []);
  if (attrs.length === 0) return false;
  return attrs.some(attributeHasDonationOptions);
}
