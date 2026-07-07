import type { EntitySeoSettings } from "@repo/shared-types";
import { normalizeOptionalMediaUrl, normalizeStoredMediaUrl } from "../../helper/storage.js";

const SEO_IMAGE_KEYS = ["seoFeaturedImage", "ogImage", "twitterImage"] as const;

export function normalizeSeoSettingsPayload(raw: unknown): EntitySeoSettings {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: EntitySeoSettings = { ...(input as EntitySeoSettings) };
  for (const key of SEO_IMAGE_KEYS) {
    const val = out[key];
    if (typeof val === "string" && val.trim()) {
      out[key] = normalizeStoredMediaUrl(val);
    }
  }
  if (out.canonicalUrl && typeof out.canonicalUrl === "string") {
    out.canonicalUrl = out.canonicalUrl.trim();
  }
  if (!Array.isArray(out.seoTags)) out.seoTags = [];
  return out;
}

export function normalizeEntityFaqs(raw: unknown): Array<{
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  libraryFaqId?: string | null;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id || `faq-${index}`),
        question: String(row.question || ""),
        answer: String(row.answer || ""),
        sortOrder: Number(row.sortOrder ?? index),
        isActive: row.isActive !== false,
        libraryFaqId: row.libraryFaqId ? String(row.libraryFaqId) : null,
      };
    });
}

export function mapBlogPostForClient(post: {
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoSettings?: unknown;
  featuredImage?: string | null;
  faqs?: unknown;
}) {
  const seoSettings = normalizeSeoSettingsPayload(post.seoSettings);
  if (!seoSettings.metaTitle?.trim() && post.metaTitle) seoSettings.metaTitle = post.metaTitle;
  if (!seoSettings.metaDescription?.trim() && post.metaDescription) {
    seoSettings.metaDescription = post.metaDescription;
  }
  return {
    seoSettings,
    faqs: normalizeEntityFaqs(post.faqs),
    featuredImage: normalizeOptionalMediaUrl(post.featuredImage),
  };
}
