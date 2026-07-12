import { redirect } from "next/navigation";
import { campaignPublicPath } from "@/lib/public-paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy /causes/:slug URLs → /donate/:slug */
export default async function CausesCampaignRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(campaignPublicPath(slug));
}
