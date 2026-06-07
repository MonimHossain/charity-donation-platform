import { redirect } from "next/navigation";

/** Legacy donation-page URLs — giving now lives on campaign pages. */
export default async function LegacyDonationPageRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/campaigns/${slug}`);
}
