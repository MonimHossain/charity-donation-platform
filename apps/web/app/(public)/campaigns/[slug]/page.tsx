import type { Metadata } from "next";
import CampaignDetailPageClient from "./CampaignDetailPageClient";
import { absoluteOgImageUrl, getServerCampaignBySlug } from "@/lib/server/campaigns";
import { getCampaignCardImage } from "@/lib/campaign-media";
import {
  buildMetadataFromEntitySeo,
  resolveEntitySeoForDisplay,
} from "@/lib/entity-seo-metadata";

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
    canonicalPath: `/campaigns/${slug}`,
  });

  return buildMetadataFromEntitySeo(seo, appUrl, {
    title: campaign.title || "Campaign",
    description: campaign.shortDescription || campaign.description,
    canonicalPath: `/campaigns/${slug}`,
  });
}

export default function CampaignDetailPage() {
  return <CampaignDetailPageClient />;
}
