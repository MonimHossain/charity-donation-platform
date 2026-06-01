import CampaignLanding from "@/components/site/CampaignLanding";
import { getCampaignBySlug } from "@/lib/mock/campaigns";

export default function WaterCampaignPage() {
  const c = getCampaignBySlug("water")!;
  return (
    <CampaignLanding
      slug="water"
      eyebrow="Sadaqah Jariyah"
      title={c.title}
      hero={c.image}
      intro={c.summary}
      raised={c.raised}
      goal={c.goal}
      stats={[
        { value: "300+", label: "People per well" },
        { value: "20yr", label: "Average well lifespan" },
        { value: "100%", label: "Donation policy" },
        { value: "£250", label: "From per well" },
      ]}
      bullets={[
        "Hand-pump or deep borehole wells in drought-affected regions",
        "Maintenance plans for 5+ years",
        "Named dedication plaques available",
        "Ongoing sadaqah jariyah for donors",
      ]}
    />
  );
}
