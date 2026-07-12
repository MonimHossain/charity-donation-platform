import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { ILike } from "typeorm";
import { createEntity } from "../../helper/typeorm.js";
import { logAudit } from "../../helper/auditLog.js";
import { archiveExpiredCampaigns } from "./archiveExpiredCampaigns.js";
import { withResolvedUpsells } from "../upsells/resolveCampaignUpsells.js";
import { normalizeCampaignSlug } from "./normalizeCampaignSlug.js";
import { normalizeOptionalMediaUrl, normalizeStoredMediaUrl } from "../../helper/storage.js";

const repo = () => AppDataSource.getRepository(Campaign);

function normalizeCampaignMedia<T extends { thumbnail?: string | null; banner?: string | null }>(
  campaign: T
): T {
  return {
    ...campaign,
    thumbnail: normalizeOptionalMediaUrl(campaign.thumbnail) ?? campaign.thumbnail,
    banner: normalizeOptionalMediaUrl(campaign.banner) ?? campaign.banner,
  };
}

function serializeCampaignForClient<T extends Campaign>(campaign: T) {
  const media = normalizeCampaignMedia(campaign);
  const fs = media.fundraiserSettings ?? { targetAmount: 0, raisedAmount: 0, endDate: "" };
  return {
    ...media,
    raisedAmount: Number(fs.raisedAmount ?? 0),
    goalAmount: Number(fs.targetAmount ?? 0),
    endDate: fs.endDate || undefined,
  };
}

function normalizeCampaignList(campaigns: Campaign[]): ReturnType<typeof serializeCampaignForClient>[] {
  return campaigns.map(serializeCampaignForClient);
}

export async function getCampaigns(req: Request, res: Response) {
  try {
    const {
      status,
      category,
      featured,
      urgent,
      mode,
      search,
      page = "1",
      limit = "12",
    } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (featured === "true") where.isFeatured = true;
    if (urgent === "true") where.isUrgent = true;
    if (mode) where.campaignMode = mode;
    if (search) where.title = ILike(`%${search}%`);

    const [items, total] = await repo().findAndCount({
      where,
      order: { sortOrder: "ASC", createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.json({ items: normalizeCampaignList(items), total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("getCampaigns error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublishedCampaigns(req: Request, res: Response) {
  try {
    await archiveExpiredCampaigns(repo());

    const { category, mode, search, featured, page = "1", limit = "12" } = req.query;
    const where: any = { status: "published" };
    if (category) where.category = category;
    if (mode) where.campaignMode = mode;
    if (featured === "true") where.isFeatured = true;
    if (search) where.title = ILike(`%${search}%`);

    const [items, total] = await repo().findAndCount({
      where,
      order: { isFeatured: "DESC", sortOrder: "ASC", createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.json({ items: normalizeCampaignList(items), total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("getPublishedCampaigns error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCampaignBySlug(req: Request, res: Response) {
  try {
    await archiveExpiredCampaigns(repo());

    const rawSlug = routeParam(req, "slug");
    let campaign = await repo().findOne({ where: { slug: rawSlug } });
    if (!campaign) {
      const normalized = normalizeCampaignSlug(rawSlug);
      if (normalized && normalized !== rawSlug) {
        campaign = await repo().findOne({ where: { slug: normalized } });
      }
    }
    if (!campaign || campaign.status !== "published") {
      return res.status(404).json({ message: "Campaign not found" });
    }
    return res.json(serializeCampaignForClient(await withResolvedUpsells(campaign)));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCampaignById(req: Request, res: Response) {
  try {
    const campaign = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    return res.json(serializeCampaignForClient(await withResolvedUpsells(campaign)));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCampaign(req: Request, res: Response) {
  try {
    let slug = normalizeCampaignSlug(
      String(req.body.slug ?? ""),
      typeof req.body.title === "string" ? req.body.title : undefined
    );
    if (!slug) {
      return res.status(400).json({ message: "A valid URL slug is required" });
    }

    const existing = await repo().findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const campaign = createEntity(repo(), {
      ...req.body,
      slug,
      thumbnail: req.body.thumbnail ? normalizeStoredMediaUrl(req.body.thumbnail) : req.body.thumbnail,
      banner: req.body.banner ? normalizeStoredMediaUrl(req.body.banner) : req.body.banner,
    });
    await repo().save(campaign);
    await logAudit(req, {
      action: "create",
      entityType: "campaign",
      entityId: campaign.id,
      details: { title: campaign.title },
    });
    return res.status(201).json(serializeCampaignForClient(await withResolvedUpsells(campaign)));
  } catch (error) {
    console.error("createCampaign error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCampaign(req: Request, res: Response) {
  try {
    const campaign = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const body = { ...req.body };
    if (body.slug !== undefined) {
      const nextSlug = normalizeCampaignSlug(
        String(body.slug ?? ""),
        typeof body.title === "string" ? body.title : campaign.title
      );
      if (!nextSlug) {
        return res.status(400).json({ message: "A valid URL slug is required" });
      }
      body.slug = nextSlug;
    }

    Object.assign(campaign, {
      ...body,
      ...(req.body.thumbnail !== undefined
        ? { thumbnail: req.body.thumbnail ? normalizeStoredMediaUrl(req.body.thumbnail) : null }
        : {}),
      ...(req.body.banner !== undefined
        ? { banner: req.body.banner ? normalizeStoredMediaUrl(req.body.banner) : null }
        : {}),
    });
    await repo().save(campaign);
    await logAudit(req, {
      action: "update",
      entityType: "campaign",
      entityId: campaign.id,
      details: { title: campaign.title },
    });
    return res.json(serializeCampaignForClient(await withResolvedUpsells(campaign)));
  } catch (error) {
    console.error("updateCampaign error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteCampaign(req: Request, res: Response) {
  try {
    const result = await repo().delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Campaign not found" });
    await logAudit(req, { action: "delete", entityType: "campaign", entityId: routeParam(req, 'id') });
    return res.json({ message: "Campaign deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
