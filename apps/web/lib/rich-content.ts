import {
  blogContentHasEmbeds,
  parseBlogContentParts,
  type BlogContentPart,
} from "@/lib/campaign-donation-embed";
import {
  parseImageUrlsFromSliderTag,
  richContentHasImageSliders,
} from "@/lib/image-slider-embed";
import {
  parseHtmlSnippetFromTag,
  richContentHasHtmlSnippets,
} from "@/lib/html-snippet-embed";

export type RichContentPart =
  | BlogContentPart
  | { type: "imageSlider"; images: string[] }
  | { type: "htmlSnippet"; html: string; label: string };

const SPECIAL_BLOCK_REGEX =
  /<div\b[^>]*\b(?:data-campaign-donation-embed|data-image-slider|data-html-snippet)\b[^>]*(?:\/>|>[\s\S]*?<\/div>)/gi;

function readDataAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1];
}

export function hasRichTextVisualContent(html: string): boolean {
  const source = html || "";
  if (
    richContentHasImageSliders(source) ||
    blogContentHasEmbeds(source) ||
    richContentHasHtmlSnippets(source)
  ) {
    return true;
  }
  if (/<(img|video|iframe)\b/i.test(source)) return true;
  const text = source.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length > 0;
}

export function richContentHasSpecialBlocks(html: string): boolean {
  return (
    blogContentHasEmbeds(html) ||
    richContentHasImageSliders(html) ||
    richContentHasHtmlSnippets(html)
  );
}

export function parseRichContentParts(html: string): RichContentPart[] {
  const source = html || "";
  if (!richContentHasImageSliders(source) && !richContentHasHtmlSnippets(source)) {
    return parseBlogContentParts(source) as RichContentPart[];
  }

  const parts: RichContentPart[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(SPECIAL_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const chunk = source.slice(lastIndex, index);
      if (chunk.trim()) {
        parts.push(...(parseBlogContentParts(chunk) as RichContentPart[]));
      }
    }

    const tag = match[0];
    if (/data-image-slider/i.test(tag)) {
      const images = parseImageUrlsFromSliderTag(tag);
      if (images.length > 0) {
        parts.push({ type: "imageSlider", images });
      }
    } else if (/data-campaign-donation-embed/i.test(tag)) {
      const slug = readDataAttribute(tag, "data-slug");
      if (slug) {
        parts.push({
          type: "embed",
          slug,
          title: readDataAttribute(tag, "data-title"),
        });
      }
    } else if (/data-html-snippet/i.test(tag)) {
      const snippet = parseHtmlSnippetFromTag(tag);
      if (snippet) {
        parts.push({ type: "htmlSnippet", html: snippet.html, label: snippet.label });
      }
    }

    lastIndex = index + tag.length;
  }

  if (lastIndex < source.length) {
    const tail = source.slice(lastIndex);
    if (tail.trim()) {
      parts.push(...(parseBlogContentParts(tail) as RichContentPart[]));
    }
  }

  if (parts.length === 0) {
    return parseBlogContentParts(source) as RichContentPart[];
  }

  return parts;
}

/** @deprecated use parseRichContentParts */
export function parseBlogContentPartsWithSliders(html: string): RichContentPart[] {
  return parseRichContentParts(html);
}
