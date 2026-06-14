/** Fallback when a campaign has no uploaded image. */
export const CAMPAIGN_PLACEHOLDER_IMAGE = "/images/hero-1.webp";

export type CampaignImageSource = {
  banner?: string | null;
  thumbnail?: string | null;
  featuredImage?: string | null;
  image?: string | null;
};

const PUBLIC_APP = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
const PUBLIC_MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/$/, "") ||
  (PUBLIC_APP ? `${PUBLIC_APP}/charity-media` : "");

/** Rewrite legacy direct MinIO URLs (port 9002) to nginx proxy path. */
export function rewriteLegacyMediaUrl(url: string): string {
  if (!PUBLIC_MEDIA_BASE) return url;
  return url
    .replace(/^https?:\/\/[^/]+:9002\/charity-media\//, `${PUBLIC_MEDIA_BASE}/`)
    .replace(/^https?:\/\/127\.0\.0\.1:9002\/charity-media\//, `${PUBLIC_MEDIA_BASE}/`)
    .replace(/^https?:\/\/localhost:9002\/charity-media\//, `${PUBLIC_MEDIA_BASE}/`);
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
