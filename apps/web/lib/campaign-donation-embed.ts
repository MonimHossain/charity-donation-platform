export const CAMPAIGN_DONATION_EMBED_ATTR = "data-campaign-donation-embed";

export interface CampaignDonationEmbedRef {
  slug: string;
  title?: string;
}

export type BlogContentPart =
  | { type: "html"; content: string }
  | { type: "embed"; slug: string; title?: string };

const EMBED_TAG_REGEX =
  /<div\b[^>]*\bdata-campaign-donation-embed\b[^>]*>[\s\S]*?<\/div>/gi;

function readDataAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1];
}

export function buildCampaignDonationEmbedHtml(ref: CampaignDonationEmbedRef): string {
  const titleAttr = ref.title ? ` data-title="${escapeHtmlAttr(ref.title)}"` : "";
  return `<div ${CAMPAIGN_DONATION_EMBED_ATTR}="" data-slug="${escapeHtmlAttr(ref.slug)}"${titleAttr} class="campaign-donation-embed"></div>`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function parseBlogContentParts(html: string): BlogContentPart[] {
  const source = html || "";
  const parts: BlogContentPart[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(EMBED_TAG_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "html", content: source.slice(lastIndex, index) });
    }

    const tag = match[0];
    const slug = readDataAttribute(tag, "data-slug");
    if (slug) {
      parts.push({
        type: "embed",
        slug,
        title: readDataAttribute(tag, "data-title"),
      });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < source.length) {
    parts.push({ type: "html", content: source.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "html", content: source });
  }

  return parts;
}

export function blogContentHasEmbeds(html: string): boolean {
  return /<div\b[^>]*\bdata-campaign-donation-embed\b[^>]*>[\s\S]*?<\/div>/i.test(
    html || ""
  );
}
