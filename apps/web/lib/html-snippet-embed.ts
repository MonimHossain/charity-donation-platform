export const HTML_SNIPPET_ATTR = "data-html-snippet";
export const HTML_SNIPPET_LABEL_ATTR = "data-label";
export const HTML_SNIPPET_B64_ATTR = "data-html-b64";

export const HTML_SNIPPET_TAG_REGEX =
  /<div\b[^>]*\bdata-html-snippet\b[^>]*(?:\/>|>[\s\S]*?<\/div>)/gi;

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function encodeHtmlSnippetPayload(html: string): string {
  return bytesToBase64(new TextEncoder().encode(html));
}

export function decodeHtmlSnippetPayload(b64: string): string {
  try {
    return new TextDecoder().decode(base64ToBytes(b64));
  } catch {
    return "";
  }
}

function readAttr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match?.[2];
}

function decodeHtmlEntities(value: string): string {
  if (!value) return "";
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseHtmlSnippetFromTag(tag: string): { html: string; label: string } | null {
  const b64 = readAttr(tag, HTML_SNIPPET_B64_ATTR);
  if (!b64) return null;
  const html = decodeHtmlSnippetPayload(decodeHtmlEntities(b64));
  if (!html.trim()) return null;
  const label = decodeHtmlEntities(readAttr(tag, HTML_SNIPPET_LABEL_ATTR) || "") || "HTML snippet";
  return { html, label };
}

export function richContentHasHtmlSnippets(html: string): boolean {
  return /<div\b[^>]*\bdata-html-snippet\b/i.test(html || "");
}

export function buildHtmlSnippetEmbedHtml(html: string, label = "HTML snippet"): string {
  const b64 = encodeHtmlSnippetPayload(html);
  const safeLabel = label
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
  return `<div ${HTML_SNIPPET_ATTR}="" ${HTML_SNIPPET_LABEL_ATTR}="${safeLabel}" ${HTML_SNIPPET_B64_ATTR}="${b64}" class="html-snippet-embed"></div>`;
}
