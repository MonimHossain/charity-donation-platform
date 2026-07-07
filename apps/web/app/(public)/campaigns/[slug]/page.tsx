import type { Metadata } from "next";
import CampaignDetailPageClient from "./CampaignDetailPageClient";
import { absoluteOgImageUrl, getServerCampaignBySlug } from "@/lib/server/campaigns";
import { getCampaignCardImage } from "@/lib/campaign-media";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getServerCampaignBySlug(slug);
  if (!campaign) {
    return { title: "Campaign" };
  }

  const title = campaign.seoSettings?.metaTitle || campaign.title || "Campaign";
  const description =
    campaign.seoSettings?.metaDescription ||
    campaign.shortDescription ||
    campaign.description ||
    "Support this charity appeal.";

  const ogTitle = campaign.seoSettings?.ogTitle || title;
  const ogDescription = campaign.seoSettings?.ogDescription || description;
  const imagePath =
    campaign.seoSettings?.ogImage ||
    getCampaignCardImage(campaign) ||
    "/images/hero-1.webp";
  const ogImage = absoluteOgImageUrl(imagePath);

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function CampaignDetailPage() {
  return <CampaignDetailPageClient />;
}
