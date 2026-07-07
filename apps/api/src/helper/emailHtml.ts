/** Public site origin for links and media in outbound email (no trailing slash). */
export function getPublicAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
  return raw.replace(/\/$/, "");
}

function charityMediaPath(pathname: string): string | null {
  const idx = pathname.indexOf("/charity-media/");
  if (idx === -1) return null;
  return pathname.slice(idx);
}

function toAbsoluteAssetUrl(src: string, base: string): string {
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("cid:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const mediaPath = charityMediaPath(u.pathname);
      if (mediaPath) {
        return `${base}${mediaPath}${u.search}${u.hash}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    try {
      const u = new URL(`https:${trimmed}`);
      const mediaPath = charityMediaPath(u.pathname);
      if (mediaPath) {
        return `${base}${mediaPath}${u.search}${u.hash}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  if (trimmed.startsWith("/charity-media/")) {
    return `${base}${trimmed}`;
  }
  if (trimmed.startsWith("charity-media/")) {
    return `${base}/${trimmed}`;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `${base}${trimmed}`;
  }

  return trimmed;
}

function rewriteSrcset(srcset: string, base: string): string {
  return srcset
    .split(",")
    .map((part) => {
      const tokens = part.trim().split(/\s+/);
      if (tokens[0]) tokens[0] = toAbsoluteAssetUrl(tokens[0], base);
      return tokens.join(" ");
    })
    .join(", ");
}

/**
 * Email clients cannot resolve site-relative URLs. Rewrite img/srcset and css url()
 * for on-site assets (especially /charity-media/) to absolute HTTPS URLs.
 */
export function prepareEmailHtmlForSend(html: string, baseUrl?: string): string {
  if (!html?.trim()) return html || "";

  const base = (baseUrl || getPublicAppUrl()).replace(/\/$/, "");

  let out = html.replace(
    /(<img\b[^>]*\ssrc\s*=\s*)(["'])([^"']+)\2/gi,
    (_match, prefix: string, quote: string, src: string) =>
      `${prefix}${quote}${toAbsoluteAssetUrl(src, base)}${quote}`
  );

  out = out.replace(
    /\ssrcset\s*=\s*(["'])([^"']+)\1/gi,
    (_match, quote: string, srcset: string) => ` srcset=${quote}${rewriteSrcset(srcset, base)}${quote}`
  );

  out = out.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_match, quote: string, url: string) => {
    const abs = toAbsoluteAssetUrl(url.trim(), base);
    const q = quote || "";
    return `url(${q}${abs}${q})`;
  });

  return out;
}
