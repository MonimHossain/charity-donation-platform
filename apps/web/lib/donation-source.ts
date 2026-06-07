/** Shared context for donation experiences (campaign or legacy donation page). */
export type DonationSource = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  category: string;
  currency?: string;
  campaignId?: string;
};

export function campaignToDonationSource(campaign: {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  category: string;
  currency?: string;
}): DonationSource {
  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    shortDescription: campaign.shortDescription,
    category: campaign.category,
    currency: campaign.currency,
    campaignId: campaign.id,
  };
}
