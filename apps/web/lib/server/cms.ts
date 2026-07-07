/** Server-only CMS helpers (no client hooks). */

const SETTINGS_REVALIDATE_SECONDS = 120;

export type ServerSiteMetadata = {
  siteName: string;
  siteDescription: string;
  faviconUrl?: string;
  logoUrl?: string;
  gtmId?: string;
};

const DEFAULT_SITE_METADATA: ServerSiteMetadata = {
  siteName: "Charity Donation Platform — Making a Difference Together",
  siteDescription:
    "A trusted charity platform delivering food, water, education and emergency aid to communities worldwide. 100% donation policy on Zakat.",
  faviconUrl: "/images/favicon.png",
};

async function fetchPublicSiteSettings(): Promise<Record<string, unknown> | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  try {
    const res = await fetch(`${base}/cms/settings`, {
      next: { revalidate: SETTINGS_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getServerSiteMetadata(): Promise<ServerSiteMetadata> {
  const data = await fetchPublicSiteSettings();
  if (!data) return { ...DEFAULT_SITE_METADATA };

  const siteName = String(data.siteName ?? "").trim();
  const siteDescription = String(data.siteDescription ?? "").trim();
  const faviconUrl = String(data.faviconUrl ?? "").trim() || DEFAULT_SITE_METADATA.faviconUrl;
  const logoUrl = data.logoUrl ? String(data.logoUrl).trim() : undefined;
  const gtmId = data.gtmId ? String(data.gtmId).trim() : undefined;

  return {
    siteName: siteName || DEFAULT_SITE_METADATA.siteName,
    siteDescription: siteDescription || DEFAULT_SITE_METADATA.siteDescription,
    faviconUrl,
    logoUrl,
    gtmId,
  };
}

export async function getServerGtmId(): Promise<string | undefined> {
  const envId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const meta = await getServerSiteMetadata();
  return meta.gtmId || envId || undefined;
}
