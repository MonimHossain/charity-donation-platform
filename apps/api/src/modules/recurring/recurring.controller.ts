import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { ensureDonorUserForDonation, normalizeEmail } from "../user-auth/userAuth.service.js";
import { resolveCampaignId } from "../campaigns/resolveCampaignId.js";
import {
  pauseStripeSubscription,
  resumeStripeSubscription,
  cancelStripeSubscription,
  createStripeBillingPortalSession,
} from "../payments/stripeRecurring.js";

const repo = () => AppDataSource.getRepository(RecurringDonation);

function appReturnUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}${path}`;
}

async function syncStripePause(recurring: RecurringDonation, pause: boolean): Promise<void> {
  if (recurring.paymentMethod !== "stripe" || !recurring.stripeSubscriptionId) return;
  if (pause) {
    await pauseStripeSubscription(recurring.stripeSubscriptionId);
  } else {
    await resumeStripeSubscription(recurring.stripeSubscriptionId);
  }
}

async function syncStripeCancel(recurring: RecurringDonation): Promise<void> {
  if (recurring.paymentMethod !== "stripe" || !recurring.stripeSubscriptionId) return;
  await cancelStripeSubscription(recurring.stripeSubscriptionId);
}

export async function getRecurringDonations(req: Request, res: Response) {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await repo().findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      relations: ["campaign"],
    });

    return res.json({
      items: items.map((item) => ({
        id: item.id,
        donorName: item.donorName,
        donorEmail: item.donorEmail,
        amount: Number(item.amount),
        currency: item.currency,
        frequency: item.frequency,
        status: item.status,
        campaignTitle: item.campaign?.title,
        nextPaymentDate: item.nextPaymentDate,
        totalPaid: Number(item.totalPaid || 0),
        createdAt: item.createdAt,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Get recurring donations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserRecurringDonations(req: Request, res: Response) {
  try {
    const user = (req as { user?: { id?: string; email?: string } }).user;
    if (!user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const email = normalizeEmail(user.email || "");
    const items = await repo()
      .createQueryBuilder("recurring")
      .leftJoinAndSelect("recurring.campaign", "campaign")
      .where("(recurring.userId = :userId OR LOWER(recurring.donorEmail) = :email)", {
        userId: user.id,
        email,
      })
      .orderBy("recurring.createdAt", "DESC")
      .getMany();

    return res.json({
      items: items.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        currency: item.currency,
        frequency: item.frequency,
        status: item.status,
        campaign: item.campaign?.title,
        nextPaymentDate: item.nextPaymentDate,
        totalPaid: Number(item.totalPaid || 0),
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get user recurring donations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createRecurringDonation(req: Request, res: Response) {
  try {
    const {
      donorName, donorEmail, amount, currency, frequency,
      campaignId, campaignSlug, paymentMethod, giftAid,
      stripeSubscriptionId, stripeCustomerId, paypalSubscriptionId,
    } = req.body;

    if (!donorName || !donorEmail || !amount) {
      return res.status(400).json({ message: "Donor name, email, and amount are required" });
    }

    const nextPaymentDate = new Date();
    if (frequency === "weekly") {
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    } else if (frequency === "yearly") {
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    } else {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    const authUserId = (req as any).user?.id as string | undefined;
    const authUserEmail = (req as any).user?.email as string | undefined;
    if (authUserId && authUserEmail) {
      if (normalizeEmail(donorEmail) !== normalizeEmail(authUserEmail)) {
        return res.status(403).json({ message: "Donor email must match your account email" });
      }
    }

    const donorUser = await ensureDonorUserForDonation({
      donorEmail,
      donorName,
      existingUserId: authUserId,
    });

    const resolvedCampaignId = await resolveCampaignId(campaignId, campaignSlug);

    const recurring = repo().create({
      userId: donorUser.id,
      donorName,
      donorEmail,
      amount,
      currency: currency || "GBP",
      frequency: frequency || "monthly",
      campaignId: resolvedCampaignId,
      paymentMethod: paymentMethod || "stripe",
      giftAid: giftAid || false,
      stripeSubscriptionId,
      stripeCustomerId,
      paypalSubscriptionId,
      nextPaymentDate,
      status: "active",
    });

    await repo().save(recurring);
    return res.status(201).json(recurring);
  } catch (error) {
    console.error("Create recurring donation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function pauseRecurringDonation(req: Request, res: Response) {
  try {
    const id = routeParam(req, 'id');
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status !== "active") {
      return res.status(400).json({ message: "Only active subscriptions can be paused" });
    }

    try {
      await syncStripePause(recurring, true);
    } catch (err: any) {
      console.error("Stripe pause error:", err);
      return res.status(502).json({ message: err.message || "Failed to pause subscription with payment provider" });
    }

    recurring.status = "paused";
    recurring.pausedAt = new Date();
    await repo().save(recurring);

    return res.json(recurring);
  } catch (error) {
    console.error("Pause recurring donation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resumeRecurringDonation(req: Request, res: Response) {
  try {
    const id = routeParam(req, 'id');
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status !== "paused") {
      return res.status(400).json({ message: "Only paused subscriptions can be resumed" });
    }

    try {
      await syncStripePause(recurring, false);
    } catch (err: any) {
      console.error("Stripe resume error:", err);
      return res.status(502).json({ message: err.message || "Failed to resume subscription with payment provider" });
    }

    recurring.status = "active";
    recurring.pausedAt = undefined;
    await repo().save(recurring);

    return res.json(recurring);
  } catch (error) {
    console.error("Resume recurring donation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function cancelRecurringDonation(req: Request, res: Response) {
  try {
    const id = routeParam(req, 'id');
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status === "cancelled") {
      return res.status(400).json({ message: "Subscription is already cancelled" });
    }

    try {
      await syncStripeCancel(recurring);
    } catch (err: any) {
      console.error("Stripe cancel error:", err);
      return res.status(502).json({ message: err.message || "Failed to cancel subscription with payment provider" });
    }

    recurring.status = "cancelled";
    recurring.cancelledAt = new Date();
    await repo().save(recurring);

    return res.json(recurring);
  } catch (error) {
    console.error("Cancel recurring donation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createRecurringBillingPortal(req: Request, res: Response) {
  try {
    const id = routeParam(req, 'id');
    const recurring = await repo().findOneBy({ id });
    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (!recurring.stripeCustomerId) {
      return res.status(400).json({
        message:
          "This subscription cannot be updated online. Please contact support or use PayPal account settings.",
      });
    }
    const url = await createStripeBillingPortalSession(
      recurring.stripeCustomerId,
      appReturnUrl("/account/recurring")
    );
    return res.json({ url });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function updateRecurringPaymentMethod(req: Request, res: Response) {
  try {
    const id = routeParam(req, 'id');
    const { paymentMethod, stripeCustomerId, stripeSubscriptionId, paypalSubscriptionId } = req.body;

    const recurring = await repo().findOneBy({ id });
    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }

    if (paymentMethod) recurring.paymentMethod = paymentMethod;
    if (stripeCustomerId) recurring.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) recurring.stripeSubscriptionId = stripeSubscriptionId;
    if (paypalSubscriptionId) recurring.paypalSubscriptionId = paypalSubscriptionId;

    await repo().save(recurring);
    return res.json(recurring);
  } catch (error) {
    console.error("Update payment method error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
