import type { Metadata } from "next";
import type { EntityFaqItem, EntitySeoSettings } from "@repo/shared-types";
import { normalizeEntitySeoSettings } from "@repo/shared-types";
import { resolveMediaUrl } from "@/lib/campaign-media";

export type EntitySeoFallbacks = {
  title: string;
  description?: string;
  excerpt?: string;
  image?: string;
  tags?: string[];
  canonicalPath?: string;
};

export function resolveEntitySeoForDisplay(
  seo: Partial<EntitySeoSettings> | undefined | null,
  fallbacks: EntitySeoFallbacks,
  legacy?: { metaTitle?: string; metaDescription?: string }
): EntitySeoSettings {
  const normalized = normalizeEntitySeoSettings(seo, legacy);
  const title = normalized.metaTitle?.trim() || fallbacks.title;
  const description =
    normalized.metaDescription?.trim() ||
    normalized.seoExcerpt?.trim() ||
    fallbacks.description ||
    fallbacks.excerpt ||
    "";
  const image =
    resolveMediaUrl(normalized.seoFeaturedImage) ||
    resolveMediaUrl(normalized.ogImage) ||
    resolveMediaUrl(fallbacks.image) ||
    undefined;

  return {
    ...normalized,
    metaTitle: title,
    metaDescription: description,
    seoFeaturedImage: image,
    ogTitle: normalized.ogTitle?.trim() || title,
    ogDescription: normalized.ogDescription?.trim() || description,
    ogImage: resolveMediaUrl(normalized.ogImage) || image,
    twitterTitle: normalized.twitterTitle?.trim() || normalized.ogTitle?.trim() || title,
    twitterDescription:
      normalized.twitterDescription?.trim() || normalized.ogDescription?.trim() || description,
    twitterImage: resolveMediaUrl(normalized.twitterImage) || resolveMediaUrl(normalized.ogImage) || image,
    seoTags:
      normalized.seoTags && normalized.seoTags.length > 0
        ? normalized.seoTags
        : fallbacks.tags || [],
  };
}

export function buildMetadataFromEntitySeo(
  seo: EntitySeoSettings,
  appUrl: string,
  fallbacks: EntitySeoFallbacks
): Metadata {
  const canonical =
    seo.canonicalUrl?.trim() ||
    (fallbacks.canonicalPath ? `${appUrl.replace(/\/$/, "")}${fallbacks.canonicalPath}` : undefined);

  const noIndex = seo.robotsIndex === "noindex";
  const noFollow = seo.robotsFollow === "nofollow";

  const ogImage = seo.ogImage || seo.seoFeaturedImage;
  const twitterImage = seo.twitterImage || ogImage;

  return {
    title: seo.metaTitle || fallbacks.title,
    description: seo.metaDescription || fallbacks.description,
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index: !noIndex,
      follow: !noFollow,
    },
    openGraph: {
      title: seo.ogTitle || seo.metaTitle || fallbacks.title,
      description: seo.ogDescription || seo.metaDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: twitterImage ? "summary_large_image" : "summary",
      title: seo.twitterTitle || seo.ogTitle || seo.metaTitle,
      description: seo.twitterDescription || seo.ogDescription || seo.metaDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}

export function buildFaqSchemaJsonLd(
  faqs: EntityFaqItem[],
  pageUrl: string
): Record<string, unknown> | null {
  const active = faqs.filter((f) => f.isActive && f.question?.trim() && f.answer?.trim());
  if (!active.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: active.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      },
    })),
    url: pageUrl,
  };
}

export function parseCustomSchemaJson(raw?: string): Record<string, unknown> | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
