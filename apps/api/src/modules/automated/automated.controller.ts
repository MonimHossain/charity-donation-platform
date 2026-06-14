import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
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
      currency = "GBP",
      paymentMethod = "stripe",
      giftAid = false,
      notes,
    } = req.body;

    if (!donorName || !donorEmail || !totalAmount || !startDate || !totalDays) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const dailyAmount =
      Math.round((Number(totalAmount) / Number(totalDays)) * 100) / 100;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(totalDays) - 1);

    const schedule = repo().create({
      donorName,
      donorEmail,
      campaignId: campaignId || undefined,
      totalAmount: Number(totalAmount),
      dailyAmount,
      startDate: start,
      endDate: end,
      totalDays: Number(totalDays),
      currency,
      paymentMethod,
      giftAid,
      notes,
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
    const schedule = await repo().findOne({ where: { id: routeParam(req, 'id') } });
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
