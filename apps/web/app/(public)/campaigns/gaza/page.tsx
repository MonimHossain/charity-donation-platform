import CampaignLanding from "@/components/site/CampaignLanding";
import { getCampaignBySlug } from "@/lib/mock/campaigns";

export default function GazaCampaignPage() {
  const c = getCampaignBySlug("gaza")!;
  return (
    <CampaignLanding
      slug="gaza"
      eyebrow="Emergency Appeal"
      title={c.title}
      urgent
      hero={c.image}
      intro="Famine has been declared. Children are dying of hunger. Every hour matters — your gift today delivers food, water and medical aid into Gaza."
      raised={c.raised}
      goal={c.goal}
      stats={[
        { value: "2.2M", label: "People in crisis" },
        { value: "96%", label: "Face acute food insecurity" },
        { value: "100%", label: "Donation policy" },
        { value: "24h", label: "Average aid dispatch" },
      ]}
      bullets={[
        "Hot meals from community kitchens inside Gaza",
        "Emergency food parcels for displaced families",
        "Clean drinking water and hygiene kits",
        "Medical supplies for hospitals operating under siege",
      ]}
    />
  );
}
