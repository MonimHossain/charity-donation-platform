import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { ActivityLog } from "../../components/activityLog/activityLog.entity.js";
import { AuditLog } from "../../components/auditLog/auditLog.entity.js";
import { logAudit } from "../../helper/auditLog.js";
import { mapAuditLogForClient, parseDateFilter } from "../../helper/auditLogFormat.js";
import {
  analyticsQueryFromRequest,
  applyDonationCampaignFilter,
  applyDonationDateFilter,
} from "./analytics.helpers.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const campaignRepo = () => AppDataSource.getRepository(Campaign);
const recurringRepo = () => AppDataSource.getRepository(RecurringDonation);
const activityLogRepo = () => AppDataSource.getRepository(ActivityLog);
const auditLogRepo = () => AppDataSource.getRepository(AuditLog);

function donationBaseQb() {
  return donationRepo()
    .createQueryBuilder("d")
    .where("d.status = :status", { status: "completed" });
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    const qb = donationBaseQb();
    applyDonationDateFilter(qb, dateRange);
    applyDonationCampaignFilter(qb, campaignId);

    const totalDonations = await qb.clone().getCount();

    const revenueResult = await qb
      .clone()
      .select("SUM(d.totalAmount)", "totalRevenue")
      .getRawOne();

    const avgResult = await qb
      .clone()
      .select("AVG(d.totalAmount)", "avgDonation")
      .getRawOne();

    const monthlyDonorsQb = recurringRepo()
      .createQueryBuilder("r")
      .where("r.status = :active", { active: "active" })
      .andWhere("r.frequency = :freq", { freq: "monthly" });
    if (campaignId) {
      monthlyDonorsQb.andWhere("r.campaignId = :campaignId", { campaignId });
    }
    const monthlyDonors = await monthlyDonorsQb.getCount();

    const allDonationsQb = donationRepo().createQueryBuilder("d");
    applyDonationDateFilter(allDonationsQb, dateRange);
    applyDonationCampaignFilter(allDonationsQb, campaignId);
    const allDonations = await allDonationsQb.getCount();
    const completedDonations = totalDonations;
    const conversionRate =
      allDonations > 0 ? ((completedDonations / allDonations) * 100).toFixed(2) : "0.00";

    return res.json({
      totalDonations,
      totalRevenue: Number(revenueResult?.totalRevenue || 0),
      monthlyDonors,
      avgDonation: Number(Number(avgResult?.avgDonation || 0).toFixed(2)),
      conversionRate: Number(conversionRate),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCampaignReport(req: Request, res: Response) {
  try {
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    const qb = campaignRepo()
      .createQueryBuilder("c")
      .leftJoin(
        "donations",
        "d",
        "d.campaignId = c.id AND d.status = :status",
        { status: "completed" }
      )
      .select([
        "c.id AS id",
        'c.title AS "title"',
        'c.goalAmount AS "goalAmount"',
        'c.raisedAmount AS "raisedAmount"',
        'c.donorCount AS "donorCount"',
        'c.status AS "status"',
        'c.category AS "category"',
        'COUNT(d.id) AS "totalDonations"',
        'COALESCE(SUM(d.totalAmount), 0) AS "calculatedRevenue"',
        'COALESCE(AVG(d.totalAmount), 0) AS "avgDonation"',
      ])
      .groupBy("c.id");

    if (campaignId) {
      qb.andWhere("c.id = :campaignId", { campaignId });
    }
    if (dateRange) {
      qb.andWhere("d.createdAt >= :analyticsStart", { analyticsStart: dateRange.start });
      qb.andWhere("d.createdAt <= :analyticsEnd", { analyticsEnd: dateRange.end });
    }

    const campaigns = await qb.orderBy('"calculatedRevenue"', "DESC").getRawMany();

    return res.json(campaigns);
  } catch (error) {
    console.error("Campaign report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategoryReport(req: Request, res: Response) {
  try {
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    const qb = donationRepo()
      .createQueryBuilder("d")
      .innerJoin("campaigns", "c", "c.id = d.campaignId")
      .select('COALESCE(c.category, \'Uncategorised\')', "category")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(d.totalAmount)", "amount")
      .where("d.status = :status", { status: "completed" })
      .groupBy("c.category")
      .orderBy("amount", "DESC");

    applyDonationDateFilter(qb, dateRange);
    applyDonationCampaignFilter(qb, campaignId);

    const rows = await qb.getRawMany();
    return res.json(
      rows.map((r) => ({
        category: r.category || "Uncategorised",
        count: Number(r.count || 0),
        amount: Number(r.amount || 0),
      }))
    );
  } catch (error) {
    console.error("Category report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRecurringReport(_req: Request, res: Response) {
  try {
    const statusBreakdown = await recurringRepo()
      .createQueryBuilder("r")
      .select("r.status", "status")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(r.amount), 0)", "monthlyValue")
      .groupBy("r.status")
      .getRawMany();

    const totalActive = await recurringRepo().count({ where: { status: "active" } });

    const mrrResult = await recurringRepo()
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.amount), 0)", "mrr")
      .where("r.status = :status", { status: "active" })
      .andWhere("r.frequency = :freq", { freq: "monthly" })
      .getRawOne();

    const totalRecurringRevenue = await recurringRepo()
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.totalPaid), 0)", "total")
      .getRawOne();

    return res.json({
      totalActive,
      mrr: Number(mrrResult?.mrr || 0),
      totalRecurringRevenue: Number(totalRecurringRevenue?.total || 0),
      statusBreakdown,
    });
  } catch (error) {
    console.error("Recurring report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonorReport(req: Request, res: Response) {
  try {
    const { limit = "20" } = req.query;
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    const qb = donationRepo()
      .createQueryBuilder("d")
      .select([
        'd.donorEmail AS "donorEmail"',
        'd.donorName AS "donorName"',
        'COUNT(*) AS "totalDonations"',
        'SUM(d.totalAmount) AS "lifetimeValue"',
        'AVG(d.totalAmount) AS "avgDonation"',
        'MIN(d.createdAt) AS "firstDonation"',
        'MAX(d.createdAt) AS "lastDonation"',
      ])
      .where("d.status = :status", { status: "completed" })
      .groupBy("d.donorEmail")
      .addGroupBy("d.donorName")
      .orderBy('"lifetimeValue"', "DESC")
      .limit(Number(limit));

    applyDonationDateFilter(qb, dateRange);
    applyDonationCampaignFilter(qb, campaignId);

    const topDonors = await qb.getRawMany();
    return res.json(topDonors);
  } catch (error) {
    console.error("Donor report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getRevenueReport(req: Request, res: Response) {
  try {
    const { groupBy = "month" } = req.query;
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    let dateFormat: string;
    switch (groupBy) {
      case "day":
        dateFormat = "YYYY-MM-DD";
        break;
      case "week":
        dateFormat = "IYYY-IW";
        break;
      case "month":
      default:
        dateFormat = "YYYY-MM";
        break;
    }

    const qb = donationRepo()
      .createQueryBuilder("d")
      .select(`TO_CHAR(d.createdAt, '${dateFormat}')`, "period")
      .addSelect("COUNT(*)", "donations")
      .addSelect("SUM(d.totalAmount)", "revenue")
      .addSelect("AVG(d.totalAmount)", "avgDonation")
      .where("d.status = :status", { status: "completed" })
      .groupBy("period")
      .orderBy("period", "ASC");

    applyDonationDateFilter(qb, dateRange);
    applyDonationCampaignFilter(qb, campaignId);

    const revenue = await qb.getRawMany();
    return res.json(revenue);
  } catch (error) {
    console.error("Revenue report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getGiftAidReport(req: Request, res: Response) {
  try {
    const { dateRange, campaignId } = analyticsQueryFromRequest(req);

    const summaryQb = donationRepo()
      .createQueryBuilder("d")
      .select([
        'COUNT(*) FILTER (WHERE d.giftAid = true) AS "giftAidCount"',
        'COUNT(*) FILTER (WHERE d.giftAid = false) AS "nonGiftAidCount"',
        'COALESCE(SUM(d.totalAmount) FILTER (WHERE d.giftAid = true), 0) AS "giftAidRevenue"',
        'COALESCE(SUM(d.giftAidAmount) FILTER (WHERE d.giftAid = true), 0) AS "totalGiftAidClaimed"',
      ])
      .where("d.status = :status", { status: "completed" });

    applyDonationDateFilter(summaryQb, dateRange);
    applyDonationCampaignFilter(summaryQb, campaignId);
    const summary = await summaryQb.getRawOne();

    const monthlyQb = donationRepo()
      .createQueryBuilder("d")
      .select("TO_CHAR(d.createdAt, 'YYYY-MM')", "period")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(d.giftAidAmount)", "giftAidAmount")
      .where("d.status = :status AND d.giftAid = true", { status: "completed" })
      .groupBy("period")
      .orderBy("period", "ASC");

    applyDonationDateFilter(monthlyQb, dateRange);
    applyDonationCampaignFilter(monthlyQb, campaignId);
    const monthlyGiftAid = await monthlyQb.getRawMany();

    return res.json({ summary, monthlyGiftAid });
  } catch (error) {
    console.error("Gift aid report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function exportDonations(req: Request, res: Response) {
  try {
    const { startDate, endDate, status } = req.query;

    const qb = donationRepo()
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.campaign", "c")
      .orderBy("d.createdAt", "DESC");

    if (status) {
      qb.andWhere("d.status = :status", { status });
    }
    if (startDate) {
      qb.andWhere("d.createdAt >= :startDate", { startDate });
    }
    if (endDate) {
      qb.andWhere("d.createdAt <= :endDate", { endDate });
    }

    const donations = await qb.getMany();

    const headers = [
      "ID", "Date", "Donor Name", "Donor Email", "Amount", "Currency",
      "Gift Aid", "Gift Aid Amount", "Total Amount", "Status",
      "Campaign", "Frequency", "Anonymous", "Message",
    ];

    const rows = donations.map((d) => [
      d.id,
      d.createdAt.toISOString(),
      `"${d.donorName}"`,
      d.donorEmail,
      d.amount,
      d.currency,
      d.giftAid ? "Yes" : "No",
      d.giftAidAmount,
      d.totalAmount,
      d.status,
      `"${d.campaign?.title || ""}"`,
      d.frequency,
      d.isAnonymous ? "Yes" : "No",
      `"${(d.message || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    await logAudit(req, {
      action: "export",
      entityType: "donation",
      details: { count: donations.length, startDate, endDate, status },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=donations-${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error("Export donations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { page = "1", limit = "25", action, user, from, to } = req.query;
    const qb = activityLogRepo()
      .createQueryBuilder("a")
      .orderBy("a.createdAt", "DESC");

    if (action) qb.andWhere("a.type = :action", { action });
    if (user) qb.andWhere("a.userId ILIKE :user", { user: `%${user}%` });
    if (from) qb.andWhere("a.createdAt >= :from", { from });
    if (to) qb.andWhere("a.createdAt <= :to", { to });

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const [items, total] = await qb
      .skip((pageNum - 1) * take)
      .take(take)
      .getManyAndCount();

    return res.json({
      items: items.map((i) => ({
        id: i.id,
        action: i.type,
        user: i.userId || "Anonymous",
        details: i.page || "",
        ipAddress: i.ipAddress || "",
        createdAt: i.createdAt,
        entityType: i.type,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Activity logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { page = "1", limit = "25", action, user, from, to, entityType, search } = req.query;
    const qb = auditLogRepo()
      .createQueryBuilder("a")
      .orderBy("a.createdAt", "DESC");

    if (action && action !== "all") qb.andWhere("a.action = :action", { action });
    if (entityType && entityType !== "all") {
      qb.andWhere("a.entityType = :entityType", { entityType });
    }
    if (user) {
      qb.andWhere("(a.userId ILIKE :user OR a.userEmail ILIKE :user)", { user: `%${user}%` });
    }
    if (search) {
      qb.andWhere(
        "(a.action ILIKE :search OR a.entityType ILIKE :search OR a.entityId ILIKE :search OR a.userEmail ILIKE :search OR CAST(a.details AS TEXT) ILIKE :search)",
        { search: `%${search}%` }
      );
    }
    if (from) qb.andWhere("a.createdAt >= :from", { from: parseDateFilter(String(from)) });
    if (to) qb.andWhere("a.createdAt <= :to", { to: parseDateFilter(String(to), true) });

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const [items, total] = await qb
      .skip((pageNum - 1) * take)
      .take(take)
      .getManyAndCount();

    return res.json({
      items: items.map(mapAuditLogForClient),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function trackActivity(req: Request, res: Response) {
  try {
    const { type, page, metadata } = req.body;
    if (!type) return res.status(400).json({ message: "type is required" });

    const log = activityLogRepo().create({
      type,
      page,
      metadata,
      ipAddress: req.ip || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
    });
    await activityLogRepo().save(log);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Track activity error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
