import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const campaignRepo = () => AppDataSource.getRepository(Campaign);

/** Mark donation completed and bump campaign totals (idempotent). */
export async function completeDonation(donationId: string): Promise<Donation | null> {
  const donation = await donationRepo().findOne({ where: { id: donationId } });
  if (!donation) return null;
  if (donation.status === "completed") return donation;

  donation.status = "completed";
  await donationRepo().save(donation);

  if (donation.campaignId) {
    const totalAmount = Number(donation.totalAmount);
    await campaignRepo()
      .createQueryBuilder()
      .update(Campaign)
      .set({
        raisedAmount: () => `"raisedAmount" + ${totalAmount}`,
        donorCount: () => `"donorCount" + 1`,
      })
      .where("id = :id", { id: donation.campaignId })
      .execute();
  }

  return donation;
}

export async function failDonation(donationId: string): Promise<void> {
  const donation = await donationRepo().findOne({ where: { id: donationId } });
  if (!donation || donation.status === "completed") return;
  donation.status = "failed";
  await donationRepo().save(donation);
}
