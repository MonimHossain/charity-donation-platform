import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { logAudit } from "../../helper/auditLog.js";
import { ensureDonorUserForDonation } from "../user-auth/userAuth.service.js";

const repo = () => AppDataSource.getRepository(Donation);
const campaignRepo = () => AppDataSource.getRepository(Campaign);

function generateReceiptNumber(): string {
  const date = new Date();
  const prefix = `DON-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export async function createDonation(req: Request, res: Response) {
  try {
    const {
      amount, currency, frequency, campaignId, donorName, donorEmail, donorPhone,
      giftAid, isAnonymous, message, donationType, paymentMethod,
      marketingConsent, smsConsent, dedication,
      quantity, unitPrice, attributeSelections, upsellAmounts, upsellTotal,
    } = req.body;

    if (!amount || !donorName || !donorEmail) {
      return res.status(400).json({ message: "Amount, name, and email are required" });
    }

    const giftAidAmount = giftAid && currency === "GBP" ? +(amount * 0.25).toFixed(2) : 0;
    const totalAmount = +(amount + giftAidAmount).toFixed(2);

    const authUserId = (req as any).user?.id as string | undefined;
    const donorUser = await ensureDonorUserForDonation({
      donorEmail,
      donorName,
      donorPhone,
      marketingConsent,
      smsConsent,
      existingUserId: authUserId,
    });

    const donation = repo().create({
      amount,
      currency: currency || "GBP",
      frequency: frequency || "single",
      campaignId,
      userId: donorUser.id,
      donorName,
      donorEmail,
      donorPhone,
      giftAid: giftAid || false,
      giftAidAmount,
      totalAmount,
      isAnonymous: isAnonymous || false,
      message,
      donationType: donationType || "general",
      quantity: quantity || 1,
      unitPrice: unitPrice || amount,
      attributeSelections: attributeSelections || undefined,
      upsellAmounts: upsellAmounts || undefined,
      upsellTotal: upsellTotal || 0,
      paymentMethod: paymentMethod || "stripe",
      marketingConsent: marketingConsent || false,
      smsConsent: smsConsent || false,
      dedicationType: dedication?.type,
      dedicationRecipientName: dedication?.recipientName,
      dedicationRecipientEmail: dedication?.recipientEmail,
      dedicationMessage: dedication?.personalMessage,
      receiptNumber: generateReceiptNumber(),
      status: "pending",
    });

    await repo().save(donation);

    return res.status(201).json(donation);
  } catch (error) {
    console.error("Create donation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonations(req: Request, res: Response) {
  try {
    const { status, frequency, campaign, page = "1", limit = "20", search } = req.query;
    const qb = repo().createQueryBuilder("d")
      .leftJoinAndSelect("d.campaign", "campaign")
      .orderBy("d.createdAt", "DESC")
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit));

    if (status) qb.andWhere("d.status = :status", { status });
    if (frequency) qb.andWhere("d.frequency = :frequency", { frequency });
    if (campaign) qb.andWhere("d.campaignId = :campaign", { campaign });
    if (search) {
      qb.andWhere("(d.donorName ILIKE :search OR d.donorEmail ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("getDonations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationStats(_req: Request, res: Response) {
  try {
    const { RecurringDonation } = await import("../../components/recurringDonation/recurringDonation.entity.js");
    const recurringRepo = AppDataSource.getRepository(RecurringDonation);

    const totalDonations = await repo().count({ where: { status: "completed" } });

    const totalResult = await repo()
      .createQueryBuilder("d")
      .select("SUM(d.totalAmount)", "totalRaised")
      .addSelect("AVG(d.totalAmount)", "avgDonation")
      .where("d.status = :status", { status: "completed" })
      .getRawOne();

    const monthlyDonors = await recurringRepo.count({
      where: { status: "active", frequency: "monthly" },
    });

    const recurringActive = await recurringRepo.count({
      where: { status: "active" },
    });

    const failedPayments = await recurringRepo.count({
      where: { status: "active" },
    }).then(async () => {
      const result = await recurringRepo.createQueryBuilder("r")
        .select("COUNT(*)", "cnt")
        .where("r.failedAttempts > 0")
        .getRawOne();
      return Number(result?.cnt || 0);
    });

    const giftAidResult = await repo()
      .createQueryBuilder("d")
      .select("SUM(d.giftAidAmount)", "giftAidTotal")
      .where("d.status = :status AND d.giftAid = true", { status: "completed" })
      .getRawOne();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayDonations = await repo()
      .createQueryBuilder("d")
      .select("COUNT(*)", "count")
      .addSelect("SUM(d.totalAmount)", "total")
      .where("d.status = :status AND d.createdAt >= :today", {
        status: "completed",
        today: todayStart,
      })
      .getRawOne();

    const totalVisitors = await repo().count();
    const conversionRate = totalVisitors > 0
      ? Number(((totalDonations / totalVisitors) * 100).toFixed(1))
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentMonthResult = await repo()
      .createQueryBuilder("d")
      .select("COUNT(*)", "count")
      .addSelect("SUM(d.totalAmount)", "total")
      .where("d.status = :status AND d.createdAt >= :since", { status: "completed", since: thirtyDaysAgo })
      .getRawOne();
    const prevMonthResult = await repo()
      .createQueryBuilder("d")
      .select("COUNT(*)", "count")
      .addSelect("SUM(d.totalAmount)", "total")
      .where("d.status = :status AND d.createdAt >= :start AND d.createdAt < :end", {
        status: "completed", start: sixtyDaysAgo, end: thirtyDaysAgo,
      })
      .getRawOne();

    const currRaised = Number(currentMonthResult?.total || 0);
    const prevRaised = Number(prevMonthResult?.total || 0);
    const raisedChange = prevRaised > 0 ? `${((currRaised - prevRaised) / prevRaised * 100).toFixed(1)}%` : "+0%";
    const currCount = Number(currentMonthResult?.count || 0);
    const prevCount = Number(prevMonthResult?.count || 0);
    const donationsChange = prevCount > 0 ? `${((currCount - prevCount) / prevCount * 100).toFixed(1)}%` : "+0%";

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const result = await repo()
        .createQueryBuilder("d")
        .select("SUM(d.totalAmount)", "total")
        .where("d.status = :status AND d.createdAt >= :start AND d.createdAt < :end", {
          status: "completed", start, end,
        })
        .getRawOne();
      monthlyRevenue.push({
        month: start.toLocaleString("en", { month: "short" }),
        amount: Number(result?.total || 0),
      });
    }

    return res.json({
      totalDonations,
      totalRaised: Number(totalResult?.totalRaised || 0),
      avgDonation: Number(totalResult?.avgDonation || 0),
      monthlyDonors,
      recurringActive,
      failedPayments,
      conversionRate,
      giftAidTotal: Number(giftAidResult?.giftAidTotal || 0),
      todayCount: Number(todayDonations?.count || 0),
      todayTotal: Number(todayDonations?.total || 0),
      raisedChange,
      donationsChange,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("getDonationStats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationStatus(req: Request, res: Response) {
  try {
    const donation = await repo().findOne({
      where: { id: routeParam(req, 'id') },
      select: ["id", "status", "totalAmount", "currency", "receiptNumber"],
    });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    return res.json({
      id: donation.id,
      status: donation.status,
      totalAmount: donation.totalAmount,
      currency: donation.currency,
      receiptNumber: donation.receiptNumber,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationById(req: Request, res: Response) {
  try {
    const donation = await repo().findOne({
      where: { id: routeParam(req, 'id') },
      relations: ["campaign"],
    });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    return res.json(donation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function refundDonation(req: Request, res: Response) {
  try {
    const donation = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.status === "refunded") return res.status(400).json({ message: "Already refunded" });

    donation.status = "refunded";
    await repo().save(donation);

    if (donation.campaignId) {
      const campaign = await campaignRepo().findOne({ where: { id: donation.campaignId } });
      if (campaign?.fundraiserSettings) {
        const fs = { ...campaign.fundraiserSettings };
        fs.raisedAmount = Math.max(0, Number(fs.raisedAmount || 0) - donation.totalAmount);
        campaign.fundraiserSettings = fs;
        await campaignRepo().save(campaign);
      }
    }

    await logAudit(req, { action: "refund", entityType: "donation", entityId: donation.id, details: { amount: donation.totalAmount, donorEmail: donation.donorEmail } });
    return res.json(donation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRecentPublicDonations(_req: Request, res: Response) {
  try {
    const donations = await repo()
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.campaign", "campaign")
      .where("d.status = :status", { status: "completed" })
      .orderBy("d.createdAt", "DESC")
      .take(20)
      .getMany();

    const publicDonations = donations.map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      donorName: d.isAnonymous ? "Anonymous" : d.donorName,
      campaignTitle: d.campaign?.title,
      createdAt: d.createdAt,
    }));

    return res.json(publicDonations);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationReceipt(req: Request, res: Response) {
  try {
    const donation = await repo().findOne({
      where: { id: routeParam(req, 'id') },
      relations: ["campaign"],
    });
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const receipt = {
      receiptNumber: donation.receiptNumber || `DON-${donation.id.substring(0, 8).toUpperCase()}`,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      amount: donation.amount,
      currency: donation.currency,
      giftAid: donation.giftAid,
      giftAidAmount: donation.giftAidAmount,
      totalAmount: donation.totalAmount,
      campaignTitle: donation.campaign?.title || "General Donation",
      frequency: donation.frequency,
      date: donation.createdAt,
      status: donation.status,
    };

    return res.json(receipt);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
