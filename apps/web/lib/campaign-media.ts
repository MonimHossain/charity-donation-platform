/** Fallback when a campaign has no uploaded image. */
export const CAMPAIGN_PLACEHOLDER_IMAGE = "/images/hero-1.webp";

export type CampaignImageSource = {
  banner?: string | null;
  thumbnail?: string | null;
  featuredImage?: string | null;
  image?: string | null;
};

/** Normalize stored media URLs for use in img src. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

/** Card / grid thumbnail — prefer thumbnail, then banner. */
export function getCampaignCardImage(campaign: CampaignImageSource): string {
  return (
    resolveMediaUrl(campaign.thumbnail) ??
    resolveMediaUrl(campaign.banner) ??
    resolveMediaUrl(campaign.featuredImage) ??
    resolveMediaUrl(campaign.image) ??
    CAMPAIGN_PLACEHOLDER_IMAGE
  );
}

/** Detail hero — prefer full-width banner, then thumbnail. */
export function getCampaignHeroImage(campaign: CampaignImageSource): string {
  return (
    resolveMediaUrl(campaign.banner) ??
    resolveMediaUrl(campaign.thumbnail) ??
    resolveMediaUrl(campaign.featuredImage) ??
    resolveMediaUrl(campaign.image) ??
    CAMPAIGN_PLACEHOLDER_IMAGE
  );
}
