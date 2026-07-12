/** Single URL segment for public /donate/:slug routes. */
export function normalizeCampaignSlug(raw: string, fallbackTitle?: string): string {
  let s = raw.trim();
  if (!s && fallbackTitle?.trim()) {
    s = fallbackTitle.trim();
  }
  if (s.includes("/")) {
    const parts = s.split("/").filter(Boolean);
    s = parts[parts.length - 1] ?? s;
  }
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}
