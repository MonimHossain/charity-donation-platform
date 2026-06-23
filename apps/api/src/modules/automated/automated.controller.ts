import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { logAudit } from "../../helper/auditLog.js";
import { ensureDonorUserForDonation, normalizeEmail } from "../user-auth/userAuth.service.js";
import {
  isUpcomingAutomatedStatus,
  serializeAutomatedSchedule,
  serializeRecurringAsAutomation,
} from "./automation.helpers.js";

const repo = () => AppDataSource.getRepository(AutomatedDonationSchedule);
const recurringRepo = () => AppDataSource.getRepository(RecurringDonation);
const donationRepo = () => AppDataSource.getRepository(Donation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

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

    const authUserId = (req as { user?: { id?: string } }).user?.id;
    const donorUser = await ensureDonorUserForDonation({
      donorEmail,
      donorName,
      existingUserId: authUserId,
    });

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
      userId: donorUser.id,
      status: req.body.status || (installmentRows?.length ? "awaiting_payment_method" : "scheduled"),
    });

    await repo().save(schedule);
    return res.status(201).json(schedule);
  } catch (error) {
    console.error("createAutomatedSchedule error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
    });
  }
}

export async function getMyAutomatedSchedules(req: Request, res: Response) {
  try {
    const user = (req as { user?: { id?: string; email?: string } }).user;
    if (!user?.id) return res.status(401).json({ message: "Unauthorized" });

    const email = normalizeEmail(user.email || "");
    const schedules = await repo()
      .createQueryBuilder("schedule")
      .leftJoinAndSelect("schedule.campaign", "campaign")
      .where("(schedule.userId = :userId OR LOWER(schedule.donorEmail) = :email)", {
        userId: user.id,
        email,
      })
      .orderBy("schedule.createdAt", "DESC")
      .getMany();

    const recurring = await recurringRepo()
      .createQueryBuilder("recurring")
      .leftJoinAndSelect("recurring.campaign", "campaign")
      .where("(recurring.userId = :userId OR LOWER(recurring.donorEmail) = :email)", {
        userId: user.id,
        email,
      })
      .andWhere("recurring.status IN (:...statuses)", {
        statuses: ["active", "paused", "failed"],
      })
      .orderBy("recurring.createdAt", "DESC")
      .getMany();

    const installmentItems = schedules.map(serializeAutomatedSchedule);
    const recurringItems = recurring.map(serializeRecurringAsAutomation);
    const items = [...installmentItems, ...recurringItems].sort((a, b) => {
      const aDate = a.nextScheduledDate ? new Date(a.nextScheduledDate).getTime() : 0;
      const bDate = b.nextScheduledDate ? new Date(b.nextScheduledDate).getTime() : 0;
      if (aDate !== bDate) return aDate - bDate;
      return new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime();
    });

    return res.json({ items });
  } catch (error) {
    console.error("getMyAutomatedSchedules error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function cancelAutomatedSchedule(req: Request, res: Response) {
  try {
    const schedule = await repo().findOne({
      where: { id: routeParam(req, 'id') },
      relations: ["campaign"],
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    schedule.status = "cancelled";
    await repo().save(schedule);
    await logAudit(req, {
      action: "cancel",
      entityType: "automated_schedule",
      entityId: schedule.id,
      details: { donorEmail: schedule.donorEmail, title: schedule.campaign?.title },
    });
    return res.json(schedule);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminAutomatedSchedules(req: Request, res: Response) {
  try {
    const { status, page = "1", limit = "20", failedOnly } = req.query;
    const where: Record<string, string> = {};
    if (status) where.status = String(status);

    const [items, total] = await repo().findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      relations: ["campaign"],
    });

    let filtered = items;
    if (failedOnly === "true" || failedOnly === "1") {
      const scheduleIds = items.map((s) => s.id);
      if (scheduleIds.length) {
        const failedDonations = await donationRepo()
          .createQueryBuilder("d")
          .select("d.automatedScheduleId", "scheduleId")
          .where("d.automatedScheduleId IN (:...ids)", { ids: scheduleIds })
          .andWhere("d.status IN (:...bad)", { bad: ["failed", "pending"] })
          .getRawMany();
        const failedSet = new Set(
          failedDonations.map((r: { scheduleId?: string }) => r.scheduleId).filter(Boolean)
        );
        filtered = items.filter(
          (s) =>
            failedSet.has(s.id) ||
            s.status === "awaiting_payment_method" ||
            s.status === "paused"
        );
      } else {
        filtered = [];
      }
    }

    const recurringWhere: Record<string, string> = {};
    if (status) recurringWhere.status = String(status);
    const recurringItems = await recurringRepo().find({
      where: recurringWhere,
      order: { createdAt: "DESC" },
      take: Number(limit),
      relations: ["campaign"],
    });

    let recurringFiltered = recurringItems;
    if (failedOnly === "true" || failedOnly === "1") {
      recurringFiltered = recurringItems.filter((r) =>
        ["failed", "paused", "cancelled"].includes(r.status)
      );
    } else if (!status) {
      recurringFiltered = recurringItems.filter((r) => isUpcomingAutomatedStatus(r.status) || r.status === "failed");
    }

    const scheduleRows = filtered.map(serializeAutomatedSchedule);
    const recurringRows = recurringFiltered.map(serializeRecurringAsAutomation);
    const merged = [...scheduleRows, ...recurringRows].sort((a, b) => {
      const aDate = a.nextScheduledDate ? new Date(a.nextScheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.nextScheduledDate ? new Date(b.nextScheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime();
    });

    return res.json({
      items: merged,
      total: failedOnly ? merged.length : total + recurringFiltered.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("getAdminAutomatedSchedules error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminAutomatedScheduleById(req: Request, res: Response) {
  try {
    const schedule = await repo().findOne({
      where: { id: routeParam(req, "id") },
      relations: ["campaign"],
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const donations = await donationRepo().find({
      where: { automatedScheduleId: schedule.id },
      order: { createdAt: "DESC" },
      relations: ["campaign"],
    });

    const donationIds = donations.map((d) => d.id);
    const paymentLogs = donationIds.length
      ? await paymentLogRepo()
          .createQueryBuilder("p")
          .where("p.donationId IN (:...ids)", { ids: donationIds })
          .orderBy("p.createdAt", "DESC")
          .getMany()
      : [];

    return res.json({
      ...schedule,
      totalAmount: Number(schedule.totalAmount),
      dailyAmount: Number(schedule.dailyAmount),
      paidAmount: Number(schedule.paidAmount),
      campaignTitle: schedule.campaign?.title,
      donations: donations.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        totalAmount: Number(d.totalAmount),
        currency: d.currency,
        status: d.status,
        receiptNumber: d.receiptNumber,
        stripePaymentIntentId: d.stripePaymentIntentId,
        createdAt: d.createdAt,
      })),
      paymentLogs: paymentLogs.map((p) => ({
        id: p.id,
        donationId: p.donationId,
        type: p.type,
        provider: p.provider,
        providerTransactionId: p.providerTransactionId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        errorMessage: p.errorMessage,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("getAdminAutomatedScheduleById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyAutomatedScheduleById(req: Request, res: Response) {
  try {
    const user = (req as { user?: { id?: string; email?: string } }).user;
    if (!user?.id) return res.status(401).json({ message: "Unauthorized" });

    const email = normalizeEmail(user.email || "");
    const schedule = await repo()
      .createQueryBuilder("schedule")
      .leftJoinAndSelect("schedule.campaign", "campaign")
      .where("schedule.id = :id", { id: routeParam(req, "id") })
      .andWhere("(schedule.userId = :userId OR LOWER(schedule.donorEmail) = :email)", {
        userId: user.id,
        email,
      })
      .getOne();
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const donations = await donationRepo().find({
      where: { automatedScheduleId: schedule.id },
      order: { createdAt: "DESC" },
    });

    const donationIds = donations.map((d) => d.id);
    const paymentLogs = donationIds.length
      ? await paymentLogRepo()
          .createQueryBuilder("p")
          .where("p.donationId IN (:...ids)", { ids: donationIds })
          .orderBy("p.createdAt", "DESC")
          .getMany()
      : [];

    return res.json({
      ...serializeAutomatedSchedule(schedule),
      campaignTitle: schedule.campaign?.title,
      donations: donations.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        totalAmount: Number(d.totalAmount),
        currency: d.currency,
        status: d.status,
        receiptNumber: d.receiptNumber,
        createdAt: d.createdAt,
      })),
      paymentLogs: paymentLogs.map((p) => ({
        id: p.id,
        donationId: p.donationId,
        type: p.type,
        provider: p.provider,
        providerTransactionId: p.providerTransactionId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        errorMessage: p.errorMessage,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
