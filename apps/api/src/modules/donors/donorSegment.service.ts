import type { SelectQueryBuilder } from "typeorm";
import type { DonorSegmentParams, DonorSegmentType } from "@repo/shared-types";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { User } from "../../components/user/user.entity.js";
import { normalizeEmail } from "../user-auth/userAuth.service.js";

export const EXPIRING_SOON_DAYS = 7;

const VALID_SEGMENTS: DonorSegmentType[] = [
  "campaign",
  "recurring",
  "loyal",
  "at_risk",
  "expiring_soon",
  "recent",
];

export function isDonorSegmentType(value: string): value is DonorSegmentType {
  return VALID_SEGMENTS.includes(value as DonorSegmentType);
}

export function parseSegmentParams(query: Record<string, unknown>): DonorSegmentParams | null {
  const segment = typeof query.segment === "string" ? query.segment.trim() : "";
  if (!segment || !isDonorSegmentType(segment)) return null;

  const campaignId =
    typeof query.campaignId === "string" && query.campaignId.trim()
      ? query.campaignId.trim()
      : undefined;
  const startDate =
    typeof query.startDate === "string" && query.startDate.trim()
      ? query.startDate.trim()
      : undefined;
  const endDate =
    typeof query.endDate === "string" && query.endDate.trim()
      ? query.endDate.trim()
      : undefined;

  return { segment, campaignId, startDate, endDate };
}

function expiringWindowEnd(): Date {
  const end = new Date();
  end.setDate(end.getDate() + EXPIRING_SOON_DAYS);
  end.setHours(23, 59, 59, 999);
  return end;
}

function defaultRecentRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function parseDateRange(params: DonorSegmentParams): { start: Date; end: Date } {
  const defaults = defaultRecentRange();
  const start = params.startDate ? new Date(params.startDate) : defaults.start;
  const end = params.endDate ? new Date(params.endDate) : defaults.end;
  if (!params.startDate) start.setHours(0, 0, 0, 0);
  if (!params.endDate) end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Emails matching recurring segment criteria (subquery helper). */
function recurringEmailSubquery(alias: string, whereClause: string): string {
  return `LOWER(d.${alias}) IN (
    SELECT LOWER(r."donorEmail") FROM recurring_donations r
    WHERE ${whereClause}
  )`;
}

export function applySegmentToDonations(
  qb: SelectQueryBuilder<Donation>,
  params: DonorSegmentParams
): void {
  const { segment } = params;

  if (segment === "campaign") {
    if (!params.campaignId) {
      qb.andWhere("1 = 0");
      return;
    }
    qb.andWhere("d.campaignId = :segmentCampaignId", { segmentCampaignId: params.campaignId });
    qb.andWhere("d.status = :segmentCompleted", { segmentCompleted: "completed" });
    return;
  }

  if (segment === "recurring") {
    qb.andWhere(
      recurringEmailSubquery("donorEmail", `r.status = 'active'`)
    );
    return;
  }

  if (segment === "loyal") {
    qb.andWhere(`LOWER(d.donorEmail) IN (
      SELECT LOWER(inner_d."donorEmail") FROM donations inner_d
      WHERE inner_d.status = 'completed'
      GROUP BY LOWER(inner_d."donorEmail")
      HAVING COUNT(*) >= 2
    )`);
    qb.andWhere("d.status = :segmentCompleted", { segmentCompleted: "completed" });
    return;
  }

  if (segment === "at_risk") {
    qb.andWhere(
      recurringEmailSubquery(
        "donorEmail",
        `(r.status IN ('failed', 'cancelled') OR r."failedAttempts" > 0)`
      )
    );
    return;
  }

  if (segment === "expiring_soon") {
    const windowEnd = expiringWindowEnd();
    const now = new Date();
    qb.andWhere(
      recurringEmailSubquery(
        "donorEmail",
        `r.status = 'active' AND (
          (r."nextPaymentDate" IS NOT NULL AND r."nextPaymentDate" <= :expiringWindowEnd)
          OR (r."cancelAt" IS NOT NULL AND r."cancelAt" >= :expiringNow AND r."cancelAt" <= :expiringWindowEnd)
        )`
      ),
      { expiringWindowEnd: windowEnd, expiringNow: now }
    );
    return;
  }

  if (segment === "recent") {
    const { start, end } = parseDateRange(params);
    qb.andWhere("d.createdAt BETWEEN :segmentStart AND :segmentEnd", {
      segmentStart: start,
      segmentEnd: end,
    });
  }
}

async function getSegmentDonorEmailsRaw(params: DonorSegmentParams): Promise<string[]> {
  const donationRepo = AppDataSource.getRepository(Donation);
  const qb = donationRepo
    .createQueryBuilder("d")
    .select('DISTINCT LOWER(d."donorEmail")', "email")
    .where("d.donorEmail IS NOT NULL")
    .andWhere("TRIM(d.donorEmail) != ''");

  applySegmentToDonations(qb, params);

  const rows = await qb.getRawMany<{ email: string }>();
  return rows.map((r) => r.email).filter(Boolean);
}

export async function countSegmentDonors(params: DonorSegmentParams): Promise<{
  donorCount: number;
  userAccountCount: number;
}> {
  const emails = await getSegmentDonorEmailsRaw(params);
  const donorCount = emails.length;

  if (donorCount === 0) {
    return { donorCount: 0, userAccountCount: 0 };
  }

  const userRepo = AppDataSource.getRepository(User);
  const userAccountCount = await userRepo
    .createQueryBuilder("u")
    .where("LOWER(u.email) IN (:...emails)", { emails })
    .andWhere("u.isActive = true")
    .getCount();

  return { donorCount, userAccountCount };
}

export async function getSegmentUsers(
  params: DonorSegmentParams,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    idsOnly?: boolean;
  } = {}
): Promise<{ items: Array<Record<string, unknown>>; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(5000, Math.max(1, options.limit ?? 50));
  const emails = await getSegmentDonorEmailsRaw(params);

  if (emails.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  const userRepo = AppDataSource.getRepository(User);
  const qb = userRepo
    .createQueryBuilder("u")
    .where("LOWER(u.email) IN (:...emails)", { emails })
    .andWhere("u.isActive = true")
    .orderBy("u.fullName", "ASC");

  if (options.search?.trim()) {
    qb.andWhere("(u.fullName ILIKE :search OR u.email ILIKE :search)", {
      search: `%${options.search.trim()}%`,
    });
  }

  const total = await qb.getCount();

  if (options.idsOnly) {
    const ids = await qb
      .select(["u.id"])
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    return {
      items: ids.map((u) => ({ id: u.id })),
      total,
      page,
      limit,
    };
  }

  const users = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  return {
    items: users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      donationCount: u.donationCount || 0,
      totalDonated: Number(u.totalDonated || 0),
    })),
    total,
    page,
    limit,
  };
}

export async function getAllSegmentUserIds(
  params: DonorSegmentParams,
  cap = 5000
): Promise<string[]> {
  const result = await getSegmentUsers(params, { page: 1, limit: cap, idsOnly: true });
  return result.items.map((item) => String(item.id));
}

export { normalizeEmail };
