import { resolveMediaUrl } from "@/lib/campaign-media";
import { imageAltFromSrc } from "@/lib/utils";

const YOUTUBE_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "youtu.be",
]);
const VIMEO_EMBED_HOSTS = new Set(["player.vimeo.com", "vimeo.com"]);

export function isAllowedVideoEmbedSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed, "https://example.invalid");
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (YOUTUBE_EMBED_HOSTS.has(host)) {
      if (host === "youtu.be") return url.pathname.length > 1;
      return url.pathname.startsWith("/embed/");
    }
    if (VIMEO_EMBED_HOSTS.has(host)) {
      return host === "player.vimeo.com" && url.pathname.startsWith("/video/");
    }
    return false;
  } catch {
    return false;
  }
}

function applyImgAltFromFilename(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/\ssrc\s*=\s*(["'])([^"']*)\1/i);
    if (!srcMatch) return `<img${attrs}>`;
    const alt = imageAltFromSrc(srcMatch[2]).replace(/"/g, "&quot;");
    if (/\salt\s*=/i.test(attrs)) {
      return `<img${attrs.replace(/\salt\s*=\s*(["'])[\s\S]*?\1/i, ` alt="${alt}"`)}>`;
    }
    return `<img${attrs} alt="${alt}">`;
  });
}

/** Rewrite img/video/source src attributes to same-origin `/charity-media/...` paths. */
export function normalizeRichHtmlMediaUrls(html: string): string {
  if (!html?.trim()) return html || "";

  const withResolvedSrc = html.replace(
    /(<(?:video|img|source)\b[^>]*\ssrc\s*=\s*)(["'])([^"']+)\2/gi,
    (_match, prefix: string, quote: string, src: string) => {
      const resolved = resolveMediaUrl(src) ?? src;
      return `${prefix}${quote}${resolved}${quote}`;
    }
  );

  return applyImgAltFromFilename(withResolvedSrc);
}

/** Block-level <video> inside <p> breaks playback in many browsers. */
export function unwrapParagraphWrappedVideos(html: string): string {
  return html.replace(/<p\b[^>]*>(\s*<video\b[\s\S]*?<\/video>\s*)<\/p>/gi, "$1");
}

export function normalizeRichHtmlForDisplay(html: string): string {
  return unwrapParagraphWrappedVideos(normalizeRichHtmlMediaUrls(html));
}
