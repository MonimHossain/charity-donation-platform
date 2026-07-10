export const IMAGE_SLIDER_ATTR = "data-image-slider";
export const IMAGE_SLIDER_IMAGES_ATTR = "data-images";

export const IMAGE_SLIDER_TAG_REGEX =
  /<div\b[^>]*\bdata-image-slider\b[^>]*>[\s\S]*?<\/div>/gi;

export function decodeHtmlEntities(value: string): string {
  if (!value) return "";
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseImageUrlsFromSliderTag(tag: string): string[] {
  const attrMatch = tag.match(
    new RegExp(`\\b${IMAGE_SLIDER_IMAGES_ATTR}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i")
  );
  const raw = attrMatch?.[2];
  if (!raw) return [];
  try {
    const decoded = decodeHtmlEntities(raw);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function buildImageSliderEmbedHtml(images: string[]): string {
  const json = JSON.stringify(images.map((u) => u.trim()).filter(Boolean));
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
  return `<div ${IMAGE_SLIDER_ATTR}="" ${IMAGE_SLIDER_IMAGES_ATTR}="${escaped}" class="image-slider-embed"></div>`;
}

export function richContentHasImageSliders(html: string): boolean {
  return /<div\b[^>]*\bdata-image-slider\b/i.test(html || "");
}
