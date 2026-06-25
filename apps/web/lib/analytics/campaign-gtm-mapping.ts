export interface GtmCampaignMeta {
  appealId: string;
  appealName: string;
  category: string;
  donationType: string;
}

/** Client-specified static overrides (slug → GTM metadata). */
const STATIC_CAMPAIGN_MAP: Record<string, Omit<GtmCampaignMeta, "appealId">> = {
  "where-needed-most": {
    appealName: "Where Needed Most",
    category: "General",
    donationType: "general",
  },
  gaza: {
    appealName: "Gaza Emergency",
    category: "Emergency",
    donationType: "sadaqah",
  },
  orphans: {
    appealName: "Orphan Sponsorship",
    category: "Sponsorship",
    donationType: "sadaqah",
  },
  water: {
    appealName: "Water Wells",
    category: "Sadaqah Jariyah",
    donationType: "sadaqah_jariyah",
  },
  food: {
    appealName: "Food Aid",
    category: "Essentials",
    donationType: "sadaqah",
  },
  zakat: {
    appealName: "Zakat",
    category: "Zakat",
    donationType: "zakat",
  },
};

function titleCaseCategory(category: string): string {
  if (!category) return "General";
  return category
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function inferDonationType(
  category?: string,
  campaignMode?: string,
  donationType?: string
): string {
  if (donationType) return donationType.toLowerCase();
  const c = (category || "").toLowerCase();
  const mode = (campaignMode || "").toLowerCase();
  if (c === "zakat" || mode === "zakat") return "zakat";
  if (c.includes("jariyah") || c === "water") return "sadaqah_jariyah";
  if (["sadaqah", "lillah", "general", "emergency", "food", "education", "health", "shelter", "orphan"].includes(c)) {
    return c === "general" ? "general" : "sadaqah";
  }
  return c || "general";
}

export function resolveGtmCampaignMeta(input: {
  slug?: string;
  title?: string;
  category?: string;
  campaignMode?: string;
  donationType?: string;
}): GtmCampaignMeta {
  const slug = (input.slug || "").trim();
  const staticEntry = slug ? STATIC_CAMPAIGN_MAP[slug] : undefined;

  if (staticEntry) {
    return {
      appealId: slug,
      appealName: input.title?.trim() || staticEntry.appealName,
      category: staticEntry.category,
      donationType: staticEntry.donationType,
    };
  }

  const category = titleCaseCategory(input.category || "general");
  const donationType = inferDonationType(input.category, input.campaignMode, input.donationType);

  return {
    appealId: slug || "unknown",
    appealName: input.title?.trim() || slug || "Donation",
    category,
    donationType,
  };
}
