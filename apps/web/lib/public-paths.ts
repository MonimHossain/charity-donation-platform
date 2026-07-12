/** Public campaign detail URL (client requirement: /donate/:slug). */
export function campaignPublicPath(slug: string): string {
  const segment = slug.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() ?? slug;
  return `/donate/${segment}`;
}

/** Public blog post URL (client requirement: /:slug, no /blog/ prefix). */
export function blogPostPublicPath(slug: string): string {
  const segment = slug.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() ?? slug;
  return `/${segment}`;
}
