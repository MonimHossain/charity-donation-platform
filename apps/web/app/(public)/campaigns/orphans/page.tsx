import CampaignLanding from "@/components/site/CampaignLanding";
import { getCampaignBySlug } from "@/lib/mock/campaigns";

export default function OrphansCampaignPage() {
  const c = getCampaignBySlug("orphans")!;
  return (
    <CampaignLanding
      slug="orphans"
      eyebrow="Long-term sponsorship"
      title={c.title}
      hero={c.image}
      intro={c.summary}
      raised={c.raised}
      goal={c.goal}
      stats={[
        { value: "1,284", label: "Children sponsored" },
        { value: "£30", label: "Per month from" },
        { value: "100%", label: "To the child" },
        { value: "4×", label: "Updates per year" },
      ]}
      bullets={[
        "Education, healthcare and nutritious meals",
        "Quarterly progress reports with photos",
        "Dedicated caseworker for each child",
        "Sponsor letters welcomed",
      ]}
    />
  );
}
