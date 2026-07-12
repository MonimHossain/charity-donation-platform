import { redirect } from "next/navigation";
import { campaignPublicPath } from "@/lib/public-paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy /campaigns/:slug URLs → /donate/:slug */
export default async function LegacyCampaignDetailRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(campaignPublicPath(slug));
}
