import { DataSource } from "typeorm";
import { Campaign } from "../../components/campaign/campaign.entity.js";

export async function seedCampaigns(ds: DataSource) {
  const repo = ds.getRepository(Campaign);
  const count = await repo.count();
  if (count > 0) return;

  const campaigns = [
    {
      title: "Gaza Emergency Relief",
      slug: "gaza-emergency-relief",
      shortDescription: "Urgent humanitarian aid for families affected by the crisis in Gaza.",
      description: "<p>Provide emergency food, water, medical supplies and shelter to families in Gaza.</p>",
      category: "emergency",
      status: "active",
      goalAmount: 500000,
      raisedAmount: 234567,
      currency: "GBP",
      isFeatured: true,
      isEmergency: true,
      isUrgent: true,
      donorCount: 3456,
      startDate: new Date("2024-01-01"),
    },
    {
      title: "Clean Water Wells",
      slug: "clean-water-wells",
      shortDescription: "Build sustainable water wells in communities without clean water access.",
      description: "<p>Fund the construction of deep water wells to provide clean, safe drinking water.</p>",
      category: "water",
      status: "active",
      goalAmount: 100000,
      raisedAmount: 67890,
      currency: "GBP",
      isFeatured: true,
      donorCount: 1234,
      startDate: new Date("2024-03-01"),
    },
    {
      title: "Orphan Sponsorship Programme",
      slug: "orphan-sponsorship",
      shortDescription: "Sponsor an orphan and provide education, food, and shelter.",
      description: "<p>Monthly sponsorship covering education, nutrition, healthcare and emotional support.</p>",
      category: "orphan",
      status: "active",
      goalAmount: 200000,
      raisedAmount: 145000,
      currency: "GBP",
      isFeatured: true,
      donorCount: 2100,
      startDate: new Date("2024-02-01"),
    },
    {
      title: "Food Aid Distribution",
      slug: "food-aid-distribution",
      shortDescription: "Deliver nutritious food parcels to families facing hunger.",
      description: "<p>Provide monthly food parcels including rice, flour, oil, and essential items.</p>",
      category: "food",
      status: "active",
      goalAmount: 150000,
      raisedAmount: 89000,
      currency: "GBP",
      isFeatured: false,
      donorCount: 1567,
      startDate: new Date("2024-04-01"),
    },
    {
      title: "Education for All",
      slug: "education-for-all",
      shortDescription: "Fund schools and educational resources in underserved communities.",
      description: "<p>Build classrooms, provide books, and train teachers in rural areas.</p>",
      category: "education",
      status: "active",
      goalAmount: 250000,
      raisedAmount: 112000,
      currency: "GBP",
      donorCount: 890,
      startDate: new Date("2024-05-01"),
    },
    {
      title: "Medical Aid Response",
      slug: "medical-aid-response",
      shortDescription: "Deliver critical medical supplies and healthcare services.",
      description: "<p>Fund mobile clinics, medical equipment, and healthcare professionals.</p>",
      category: "health",
      status: "active",
      goalAmount: 300000,
      raisedAmount: 178000,
      currency: "GBP",
      isEmergency: true,
      donorCount: 1890,
      startDate: new Date("2024-01-15"),
    },
  ];

  for (const c of campaigns) {
    const campaign = repo.create(c);
    await repo.save(campaign);
  }
  console.log("Campaigns seeded");
}
