import { DataSource } from "typeorm";
import { DonationPreset } from "../../components/donation/donationPreset.entity.js";

export async function seedDonationPresets(ds: DataSource) {
  const repo = ds.getRepository(DonationPreset);
  const count = await repo.count();
  if (count > 0) return;

  const presets = [
    { amount: 25, label: "£25", description: "Feed a family for a week", sortOrder: 1 },
    { amount: 50, label: "£50", description: "Provide clean water for a month", sortOrder: 2 },
    { amount: 100, label: "£100", description: "Emergency aid package", sortOrder: 3 },
    { amount: 250, label: "£250", description: "Sponsor an orphan for a month", sortOrder: 4 },
    { amount: 500, label: "£500", description: "Build a water well contribution", sortOrder: 5 },
  ];

  for (const p of presets) {
    const preset = repo.create({ ...p, currency: "GBP", isActive: true });
    await repo.save(preset);
  }
  console.log("Donation presets seeded");
}
