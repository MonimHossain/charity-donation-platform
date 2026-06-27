export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export function buildAuthHref(path: string, returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return path;
  const url = new URL(path, "http://local");
  url.searchParams.set("returnTo", safe);
  return `${url.pathname}${url.search}`;
}
