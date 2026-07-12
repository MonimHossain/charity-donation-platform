import type { EntityFaqItem } from "@repo/shared-types";
import { buildFaqSchemaJsonLd, cmsLibraryFaqsToEntityItems } from "@/lib/entity-seo-metadata";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export async function fetchPublicCmsFaqs(): Promise<
  Array<{
    id?: string;
    question?: string;
    answer?: string;
    isPublished?: boolean;
    sortOrder?: number;
  }>
> {
  try {
    const res = await fetch(`${apiBase()}/cms/faqs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch {
    return [];
  }
}

export async function buildHomepageFaqSchemaScripts(): Promise<object[]> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com").replace(/\/$/, "");
  const rows = await fetchPublicCmsFaqs();
  const items: EntityFaqItem[] = cmsLibraryFaqsToEntityItems(rows);
  const faqSchema = buildFaqSchemaJsonLd(items, appUrl);
  return faqSchema ? [faqSchema] : [];
}
