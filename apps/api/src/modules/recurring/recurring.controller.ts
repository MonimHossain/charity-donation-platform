import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";

const repo = () => AppDataSource.getRepository(RecurringDonation);

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

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Get recurring donations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserRecurringDonations(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const items = await repo().find({
      where: { userId },
      order: { createdAt: "DESC" },
      relations: ["campaign"],
    });

    return res.json(items);
  } catch (error) {
    console.error("Get user recurring donations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createRecurringDonation(req: Request, res: Response) {
  try {
    const {
      donorName, donorEmail, amount, currency, frequency,
      campaignId, paymentMethod, giftAid,
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

    const recurring = repo().create({
      userId: (req as any).userId,
      donorName,
      donorEmail,
      amount,
      currency: currency || "GBP",
      frequency: frequency || "monthly",
      campaignId,
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
    const { id } = req.params;
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status !== "active") {
      return res.status(400).json({ message: "Only active subscriptions can be paused" });
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
    const { id } = req.params;
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status !== "paused") {
      return res.status(400).json({ message: "Only paused subscriptions can be resumed" });
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
    const { id } = req.params;
    const recurring = await repo().findOneBy({ id });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }
    if (recurring.status === "cancelled") {
      return res.status(400).json({ message: "Subscription is already cancelled" });
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

export async function updateRecurringPaymentMethod(req: Request, res: Response) {
  try {
    const { id } = req.params;
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
