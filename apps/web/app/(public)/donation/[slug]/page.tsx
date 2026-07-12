import { redirect } from "next/navigation";
import { campaignPublicPath } from "@/lib/public-paths";

/** Legacy donation-page URLs — giving now lives on campaign pages. */
export default async function LegacyDonationPageRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(campaignPublicPath(slug));
}
