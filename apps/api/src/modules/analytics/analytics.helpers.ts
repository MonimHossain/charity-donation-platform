import type { SelectQueryBuilder } from "typeorm";
import type { Request } from "express";
import { Donation } from "../../components/donation/donation.entity.js";

export type AnalyticsDateRange = {
  start: Date;
  end: Date;
};

export function parseAnalyticsDateRange(query: Record<string, unknown>): AnalyticsDateRange | null {
  const range = typeof query.range === "string" ? query.range : "";
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === "custom") {
    const from = typeof query.from === "string" ? query.from.trim() : "";
    const to = typeof query.to === "string" ? query.to.trim() : "";
    if (!from || !to) return null;
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const customEnd = new Date(to);
    customEnd.setHours(23, 59, 59, 999);
    return { start, end: customEnd };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "week") {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (range === "year") {
    start.setMonth(0, 1);
    return { start, end };
  }
  if (range === "month" || !range) {
    start.setDate(1);
    return { start, end };
  }

  return null;
}

export function getAnalyticsCampaignId(query: Record<string, unknown>): string | undefined {
  const id = typeof query.campaignId === "string" ? query.campaignId.trim() : "";
  return id || undefined;
}

export function applyDonationDateFilter(
  qb: SelectQueryBuilder<Donation>,
  range: AnalyticsDateRange | null,
  alias = "d"
): void {
  if (!range) return;
  qb.andWhere(`${alias}.createdAt >= :analyticsStart`, { analyticsStart: range.start });
  qb.andWhere(`${alias}.createdAt <= :analyticsEnd`, { analyticsEnd: range.end });
}

export function applyDonationCampaignFilter(
  qb: SelectQueryBuilder<Donation>,
  campaignId: string | undefined,
  alias = "d"
): void {
  if (!campaignId) return;
  qb.andWhere(`${alias}.campaignId = :analyticsCampaignId`, { analyticsCampaignId: campaignId });
}

export function analyticsQueryFromRequest(req: Request): {
  dateRange: AnalyticsDateRange | null;
  campaignId: string | undefined;
} {
  const query = req.query as Record<string, unknown>;
  return {
    dateRange: parseAnalyticsDateRange(query),
    campaignId: getAnalyticsCampaignId(query),
  };
}
