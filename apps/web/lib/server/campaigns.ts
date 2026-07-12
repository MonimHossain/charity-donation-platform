/** Server-only campaign fetch for metadata generation. */
import { normalizeCampaignSlug } from "@/lib/campaign-slug";

export async function getServerCampaignBySlug(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const candidates = [slug.trim()];
  const normalized = normalizeCampaignSlug(slug);
  if (normalized && !candidates.includes(normalized)) {
    candidates.push(normalized);
  }

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${base}/campaigns/${encodeURIComponent(candidate)}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      return (await res.json()) as {
        title?: string;
        shortDescription?: string;
        description?: string;
        thumbnail?: string;
        banner?: string;
        image?: string;
        faqs?: import("@repo/shared-types").EntityFaqItem[];
        seoSettings?: import("@repo/shared-types").EntitySeoSettings & {
          metaTitle?: string;
          metaDescription?: string;
          ogTitle?: string;
          ogDescription?: string;
          ogImage?: string;
        };
      };
    } catch {
      continue;
    }
  }

  return null;
}

export function absoluteOgImageUrl(imagePath?: string | null): string | undefined {
  if (!imagePath?.trim()) return undefined;
  const trimmed = imagePath.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com").replace(/\/$/, "");
  return `${appUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
