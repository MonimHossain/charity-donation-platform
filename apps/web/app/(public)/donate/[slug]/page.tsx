import type { Metadata } from "next";
import CampaignDetailPageClient from "../../campaigns/[slug]/CampaignDetailPageClient";
import { absoluteOgImageUrl, getServerCampaignBySlug } from "@/lib/server/campaigns";
import { getCampaignCardImage } from "@/lib/campaign-media";
import {
  buildEntitySchemaScripts,
  buildMetadataFromEntitySeo,
  resolveEntitySeoForDisplay,
} from "@/lib/entity-seo-metadata";
import { campaignPublicPath } from "@/lib/public-paths";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getServerCampaignBySlug(slug);
  if (!campaign) {
    return { title: "Campaign Not Found" };
  }

  const canonicalPath = campaignPublicPath(slug);
  const imagePath =
    campaign.seoSettings?.ogImage ||
    campaign.seoSettings?.seoFeaturedImage ||
    getCampaignCardImage(campaign) ||
    "/images/hero-1.webp";

  const seo = resolveEntitySeoForDisplay(campaign.seoSettings, {
    title: campaign.title || "Campaign",
    description: campaign.shortDescription || campaign.description,
    excerpt: campaign.shortDescription,
    image: absoluteOgImageUrl(imagePath),
    canonicalPath,
  });

  return buildMetadataFromEntitySeo(seo, appUrl, {
    title: campaign.title || "Campaign",
    description: campaign.shortDescription || campaign.description,
    canonicalPath,
  });
}

export default async function DonateCampaignDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const campaign = await getServerCampaignBySlug(slug);
  const canonicalPath = campaignPublicPath(slug);
  const pageUrl = `${appUrl.replace(/\/$/, "")}${canonicalPath}`;
  const schemaScripts = campaign
    ? buildEntitySchemaScripts({
        seoSettings: campaign.seoSettings,
        faqs: campaign.faqs || [],
        pageUrl,
        defaultSchema: {
          "@type": campaign.seoSettings?.schemaType?.trim() || "WebPage",
          name: campaign.title,
          description: campaign.shortDescription || campaign.description,
        },
      })
    : [];

  return (
    <>
      {schemaScripts.map((schema, index) => (
        <script
          key={`campaign-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CampaignDetailPageClient />
    </>
  );
}
