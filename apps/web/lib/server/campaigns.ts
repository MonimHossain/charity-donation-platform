/** Server-only campaign fetch for metadata generation. */
export async function getServerCampaignBySlug(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      title?: string;
      shortDescription?: string;
      description?: string;
      thumbnail?: string;
      banner?: string;
      image?: string;
      seoSettings?: {
        metaTitle?: string;
        metaDescription?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
      };
    };
  } catch {
    return null;
  }
}

export function absoluteOgImageUrl(imagePath?: string | null): string | undefined {
  if (!imagePath?.trim()) return undefined;
  const trimmed = imagePath.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com").replace(/\/$/, "");
  return `${appUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
