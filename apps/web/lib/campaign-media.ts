/** Fallback when a campaign has no uploaded image. */
export const CAMPAIGN_PLACEHOLDER_IMAGE = "/images/hero-1.webp";

export type CampaignImageSource = {
  banner?: string | null;
  thumbnail?: string | null;
  featuredImage?: string | null;
  image?: string | null;
};

/** Normalize any stored media URL to a same-origin `/charity-media/...` path. */
export function rewriteLegacyMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/charity-media/")) return trimmed;

  const objectMatch = trimmed.match(/\/charity-media\/(.+)$/);
  if (objectMatch?.[1]) {
    return `/charity-media/${objectMatch[1]}`;
  }

  return trimmed;
}

/** Normalize stored media URLs for use in img src. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  const normalized = rewriteLegacyMediaUrl(trimmed);
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("/")
  ) {
    return normalized;
  }
  if (normalized.startsWith("//")) return `https:${normalized}`;
  return normalized;
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
