import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { sendDonationReceiptEmail } from "../../helper/mailer.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const campaignRepo = () => AppDataSource.getRepository(Campaign);

async function sendReceiptEmailIfNeeded(donation: Donation): Promise<void> {
  if (donation.receiptEmailSent || !donation.donorEmail) return;
  let campaignTitle: string | undefined;
  if (donation.campaignId) {
    const campaign = await campaignRepo().findOne({
      where: { id: donation.campaignId },
      select: ["title"],
    });
    campaignTitle = campaign?.title;
  }
  try {
    await sendDonationReceiptEmail(donation, campaignTitle);
    donation.receiptEmailSent = true;
    await donationRepo().save(donation);
  } catch (err) {
    console.error("[completeDonation] Receipt email failed:", err);
  }
}

/** Mark donation completed and bump campaign totals (idempotent). */
export async function completeDonation(donationId: string): Promise<Donation | null> {
  const donation = await donationRepo().findOne({
    where: { id: donationId },
    relations: ["campaign"],
  });
  if (!donation) return null;
  if (donation.status === "completed") {
    await sendReceiptEmailIfNeeded(donation);
    return donation;
  }

  donation.status = "completed";
  await donationRepo().save(donation);

  if (donation.campaignId) {
    const totalAmount = Number(donation.totalAmount);
    const campaign = await campaignRepo().findOne({ where: { id: donation.campaignId } });
    if (campaign?.fundraiserSettings) {
      const fs = { ...campaign.fundraiserSettings };
      fs.raisedAmount = Number(fs.raisedAmount || 0) + totalAmount;
      campaign.fundraiserSettings = fs;
      campaign.donorCount = (campaign.donorCount || 0) + 1;
      await campaignRepo().save(campaign);
    } else {
      await campaignRepo().increment({ id: donation.campaignId }, "donorCount", 1);
    }
  }

  await sendReceiptEmailIfNeeded(donation);
  return donation;
}

export async function failDonation(donationId: string): Promise<void> {
  const donation = await donationRepo().findOne({ where: { id: donationId } });
  if (!donation || donation.status === "completed") return;
  donation.status = "failed";
  await donationRepo().save(donation);
}
