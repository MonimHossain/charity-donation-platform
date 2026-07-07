import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import type { FundraiserSettings } from "../../components/campaign/campaign.entity.js";
import { dispatchEvent } from "../notifications/notification.service.js";
import { ensureDonorUserForDonation, refreshUserDonationStats } from "../user-auth/userAuth.service.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const campaignRepo = () => AppDataSource.getRepository(Campaign);

const DEFAULT_FUNDRAISER_SETTINGS: FundraiserSettings = {
  targetAmount: 0,
  raisedAmount: 0,
  startDate: "",
  endDate: "",
  showProgressBar: true,
  autoCloseAfterDeadline: false,
  allowOverfunding: true,
};

async function sendDonationNotificationsIfNeeded(donation: Donation): Promise<void> {
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
    const result = await dispatchEvent("donation_success", { donation, campaignTitle });
    if (result.donationEmailStatus === "sent") {
      donation.receiptEmailSent = true;
      await donationRepo().save(donation);
    }
  } catch (err) {
    console.error("[completeDonation] Notification dispatch failed:", err);
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
    await sendDonationNotificationsIfNeeded(donation);
    return donation;
  }

  if (!donation.userId && donation.donorEmail) {
    const user = await ensureDonorUserForDonation({
      donorEmail: donation.donorEmail,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      marketingConsent: donation.marketingConsent,
      smsConsent: donation.smsConsent,
    });
    donation.userId = user.id;
  }

  donation.status = "completed";
  await donationRepo().save(donation);

  if (donation.campaignId) {
    const totalAmount = Number(donation.totalAmount);
    const campaign = await campaignRepo().findOne({ where: { id: donation.campaignId } });
    if (campaign) {
      const fs: FundraiserSettings = {
        ...DEFAULT_FUNDRAISER_SETTINGS,
        ...campaign.fundraiserSettings,
      };
      fs.raisedAmount = Number(fs.raisedAmount || 0) + totalAmount;
      campaign.fundraiserSettings = fs;
      campaign.donorCount = (campaign.donorCount || 0) + 1;
      await campaignRepo().save(campaign);
    }
  }

  await sendDonationNotificationsIfNeeded(donation);

  if (donation.userId) {
    await refreshUserDonationStats(donation.userId);
  }

  return donation;
}

export async function failDonation(donationId: string): Promise<void> {
  const donation = await donationRepo().findOne({ where: { id: donationId } });
  if (!donation || donation.status === "completed") return;
  donation.status = "failed";
  await donationRepo().save(donation);

  try {
    await dispatchEvent("payment_failed", {
      donorEmail: donation.donorEmail,
      donorName: donation.donorName,
      amount: Number(donation.totalAmount),
      currency: donation.currency,
      userId: donation.userId,
      isRecurring: false,
      donationId: donation.id,
    });
  } catch (err) {
    console.error("[failDonation] Notification dispatch failed:", err);
  }
}
