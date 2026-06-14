import { DataSource } from "typeorm";
import { QuickDonateOption } from "../../components/donation/quickDonateOption.entity.js";
import { QuickDonateSettings } from "../../components/donation/quickDonateSettings.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";

const DEFAULT_OPTIONS = [
  {
    label: "Gaza Emergency",
    slug: "gaza-emergency-relief",
    prices: [20, 40, 50],
    sortOrder: 0,
  },
  {
    label: "Food Aid",
    slug: "food",
    prices: [20, 40, 50],
    sortOrder: 1,
  },
  {
    label: "Emergency Aid",
    slug: "emergency",
    prices: [20, 40, 50],
    sortOrder: 2,
  },
  {
    label: "Zakat Appeal",
    slug: "zakat",
    prices: [20, 40, 50],
    sortOrder: 3,
  },
  {
    label: "Water Projects",
    slug: "water",
    prices: [20, 40, 50],
    sortOrder: 4,
  },
  {
    label: "Livelihood Projects",
    slug: "livelihood",
    prices: [20, 40, 50],
    sortOrder: 5,
  },
  {
    label: "Orphan Sponsorship",
    slug: "orphans",
    prices: [20, 40, 50],
    sortOrder: 6,
  },
  {
    label: "Need Is Greatest",
    slug: "where-needed-most",
    prices: [20, 40, 50],
    sortOrder: 7,
  },
];

export async function seedQuickDonate(ds: DataSource) {
  const optionRepo = ds.getRepository(QuickDonateOption);
  const settingsRepo = ds.getRepository(QuickDonateSettings);
  const campaignRepo = ds.getRepository(Campaign);

  let settings = await settingsRepo.findOne({ where: { key: "default" } });
  if (!settings) {
    settings = settingsRepo.create({
      key: "default",
      donationCategories: [
        { value: "general", label: "General Donation", sortOrder: 0, isActive: true },
        { value: "zakat", label: "Zakat", sortOrder: 1, isActive: true },
        { value: "sadaqah", label: "Sadaqah", sortOrder: 2, isActive: true },
      ],
      showSingleFrequency: true,
      showRegularFrequency: true,
    });
    await settingsRepo.save(settings);
    console.log("Quick donate settings seeded");
  }

  const count = await optionRepo.count();
  if (count > 0) return;

  for (const item of DEFAULT_OPTIONS) {
    const campaign = await campaignRepo.findOne({ where: { slug: item.slug } });
    const option = optionRepo.create({
      label: item.label,
      campaignId: campaign?.id,
      campaignSlug: campaign?.slug ?? item.slug,
      campaignTitle: campaign?.title ?? item.label,
      prices: item.prices.map((amount, sortOrder) => ({ amount, sortOrder })),
      sortOrder: item.sortOrder,
      isActive: true,
    });
    await optionRepo.save(option);
  }
  console.log("Quick donate options seeded");
}
