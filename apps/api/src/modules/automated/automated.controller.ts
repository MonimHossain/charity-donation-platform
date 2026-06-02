import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";
import { logAudit } from "../../helper/auditLog.js";

const repo = () => AppDataSource.getRepository(AutomatedDonationSchedule);

export async function createAutomatedSchedule(req: Request, res: Response) {
  try {
    const {
      donorName,
      donorEmail,
      campaignId,
      totalAmount,
      startDate,
      totalDays,
      dailyBreakdown,
      installments,
      recurringPlanId,
      currency = "GBP",
      paymentMethod = "stripe",
      giftAid = false,
      notes,
    } = req.body;

    if (!donorName || !donorEmail || !totalAmount || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const total = Number(totalAmount);
    const installmentRows = Array.isArray(installments)
      ? installments.map((row: { scheduledDate?: string; amount?: number; weight?: number; currency?: string; status?: string; id?: string }, i: number) => ({
          id: row.id || `inst-${i + 1}`,
          scheduledDate: String(row.scheduledDate || ""),
          amount: Math.round(Number(row.amount) * 100) / 100,
          weight: Math.max(0, Number(row.weight ?? 1)),
          currency: String(row.currency || currency || "GBP").toUpperCase(),
          status: row.status || "pending",
        }))
      : null;

    const breakdownArr: number[] | null = installmentRows?.length
      ? installmentRows.map((r) => r.amount)
      : Array.isArray(dailyBreakdown)
        ? dailyBreakdown.map((n) => Math.max(0, Math.round(Number(n) * 100) / 100))
        : null;

    const days = breakdownArr?.length ? breakdownArr.length : Number(totalDays);

    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ message: "Invalid amount or days" });
    }

    if (breakdownArr) {
      if (breakdownArr.some((n) => !Number.isFinite(n) || n < 0)) {
        return res.status(400).json({ message: "Invalid daily breakdown (weights cannot be negative)" });
      }
      // Allow small rounding differences (e.g. pennies).
      const sum = breakdownArr.reduce((s, n) => s + n, 0);
      if (Math.abs(sum - total) > 0.05) {
        return res.status(400).json({ message: "Daily breakdown must sum to total amount" });
      }
    }

    const dailyAmount = Math.round((total / days) * 100) / 100;

    const start = installmentRows?.[0]?.scheduledDate
      ? new Date(installmentRows[0].scheduledDate)
      : new Date(startDate);
    const end = installmentRows?.length
      ? new Date(installmentRows[installmentRows.length - 1].scheduledDate)
      : new Date(start);
    if (!installmentRows?.length) {
      end.setDate(end.getDate() + Number(days) - 1);
    }

    const schedule = repo().create({
      donorName,
      donorEmail,
      campaignId: campaignId || undefined,
      totalAmount: total,
      dailyAmount,
      dailyBreakdown: breakdownArr || undefined,
      installments: installmentRows || undefined,
      startDate: start,
      endDate: end,
      totalDays: Number(days),
      currency,
      paymentMethod,
      giftAid,
      notes: recurringPlanId
        ? `${notes || ""} recurringPlanId=${recurringPlanId}`.trim()
        : notes,
      userId: (req as any).user?.id,
      status: "scheduled",
    });

    await repo().save(schedule);
    return res.status(201).json(schedule);
  } catch (error) {
    console.error("createAutomatedSchedule error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyAutomatedSchedules(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const items = await repo().find({
      where: { userId: user.id },
      order: { createdAt: "DESC" },
      relations: ["campaign"],
    });
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function cancelAutomatedSchedule(req: Request, res: Response) {
  try {
    const schedule = await repo().findOne({ where: { id: req.params.id } });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    schedule.status = "cancelled";
    await repo().save(schedule);
    return res.json(schedule);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminAutomatedSchedules(req: Request, res: Response) {
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
    return res.status(500).json({ message: "Internal server error" });
  }
}
