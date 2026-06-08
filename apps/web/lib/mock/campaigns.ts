import type { DemoCampaign } from "./types";

const img = (name: string) => `/images/${name}`;

export const demoCampaigns: DemoCampaign[] = [
  {
    id: "c-gaza",
    slug: "gaza",
    title: "Gaza Famine Emergency",
    summary:
      "A vast majority of Gaza's population faces acute food insecurity. Urgent support saves lives.",
    description:
      "More than two million people are trapped in unimaginable conditions. Our local partners are running community kitchens, distributing flour, rice, oil and clean water — and treating the wounded under siege.",
    image: img("appeal-gaza.jpg"),
    tag: "Emergency",
    urgent: true,
    featured: true,
    goal: 750000,
    raised: 482350,
    currency: "GBP",
    donors: 6420,
    deadline: "2026-12-31",
    status: "published",
  },
  {
    id: "c-orphans",
    slug: "orphans",
    title: "Orphan Sponsorship",
    summary:
      "Stand beside a child. Restore dignity, education and a hopeful future from just £30/month.",
    description:
      "Every child deserves stability, education and love. Our sponsorship programme pairs you with one orphaned child whose life you can transform.",
    image: img("appeal-orphan.jpg"),
    tag: "Long-term",
    featured: true,
    goal: 400000,
    raised: 218400,
    currency: "GBP",
    donors: 1284,
    status: "published",
  },
  {
    id: "c-water",
    slug: "water",
    title: "Build a Water Well",
    summary: "One donation. Clean water for life. A well that rewards you for generations to come.",
    description:
      "Across Africa and Asia, women and children walk hours every day to collect water that is often unsafe.",
    image: img("appeal-water.jpg"),
    tag: "Sadaqah Jariyah",
    goal: 300000,
    raised: 156780,
    currency: "GBP",
    donors: 932,
    status: "published",
  },
  {
    id: "c-food",
    slug: "food",
    title: "Food Aid Programme",
    summary: "Emergency food parcels and hot meals for families in Gaza, Sudan, Yemen and beyond.",
    description:
      "Hunger is the silent emergency. We work with trusted local partners to deliver dignified, halal food where it is needed most.",
    image: img("appeal-food.jpg"),
    tag: "Essentials",
    goal: 200000,
    raised: 92450,
    currency: "GBP",
    donors: 540,
    status: "published",
  },
  {
    id: "c-livelihood",
    slug: "livelihood",
    title: "Livelihood Projects",
    summary: "Tools, training and small-business support so families can earn with dignity.",
    description:
      "True dignity comes from independence. Our livelihood programme equips families with skills and tools to stand on their own.",
    image: img("appeal-livelihood.jpg"),
    tag: "Sustainable",
    goal: 150000,
    raised: 64210,
    currency: "GBP",
    donors: 318,
    status: "published",
  },
  {
    id: "c-emergency",
    slug: "emergency",
    title: "Emergency Aid",
    summary: "When disaster strikes — earthquake, flood, conflict — we move within 24 hours.",
    description:
      "From earthquakes to floods, our rapid response teams are first on the ground with food, water, blankets and mobile medical clinics.",
    image: img("appeal-emergency.jpg"),
    tag: "Rapid response",
    urgent: true,
    goal: 500000,
    raised: 312800,
    currency: "GBP",
    donors: 2104,
    status: "published",
  },
];

export const getCampaignBySlug = (slug: string) =>
  demoCampaigns.find((c) => c.slug === slug);

export const getCampaignById = (id: string) => demoCampaigns.find((c) => c.id === id);
