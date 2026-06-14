export function isPublicIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, "").trim();
  if (!normalized || normalized === "::1") return false;
  if (normalized.startsWith("127.")) return false;
  if (normalized.startsWith("10.")) return false;
  if (normalized.startsWith("192.168.")) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(normalized)) return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  return true;
}

/** Prefer the visitor IP from nginx/proxy headers; fall back to the socket peer. */
export function resolveClientIp(
  forwardedFor: string | string[] | undefined,
  fallback?: string | null
): string {
  const raw =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.trim()
        : null) ||
    fallback?.trim() ||
    "unknown";
  return raw.replace(/^::ffff:/, "");
}

/** Public routable IP for geo lookups; null for private/local addresses. */
export function resolvePublicClientIp(
  forwardedFor: string | string[] | undefined,
  fallback?: string | null
): string | null {
  const ip = resolveClientIp(forwardedFor, fallback);
  return isPublicIp(ip) ? ip : null;
}
