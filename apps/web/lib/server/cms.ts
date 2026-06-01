/** Server-only CMS helpers (no client hooks). */
export async function getServerGtmId(): Promise<string | undefined> {
  const envId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  try {
    const res = await fetch(`${base}/cms/settings`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return envId || undefined;
    const data = (await res.json()) as { gtmId?: string };
    return data.gtmId?.trim() || envId || undefined;
  } catch {
    return envId || undefined;
  }
}
