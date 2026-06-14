import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { ILike } from "typeorm";
import { createEntity } from "../../helper/typeorm.js";
import { logAudit } from "../../helper/auditLog.js";

const repo = () => AppDataSource.getRepository(Campaign);

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

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("getCampaigns error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublishedCampaigns(req: Request, res: Response) {
  try {
    const { category, mode, search, featured, page = "1", limit = "12" } = req.query;
    const where: any = { status: "published" };
    if (category) where.category = category;
    if (mode) where.campaignMode = mode;
    if (featured === "true") where.isFeatured = true;
    if (search) where.title = ILike(`%${search}%`);

    const [items, total] = await repo().findAndCount({
      where,
      order: { sortOrder: "ASC", createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("getPublishedCampaigns error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCampaignBySlug(req: Request, res: Response) {
  try {
    const campaign = await repo().findOne({ where: { slug: routeParam(req, 'slug') } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    return res.json(campaign);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCampaignById(req: Request, res: Response) {
  try {
    const campaign = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    return res.json(campaign);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCampaign(req: Request, res: Response) {
  try {
    let slug =
      req.body.slug ||
      req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await repo().findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const campaign = createEntity(repo(), { ...req.body, slug });
    await repo().save(campaign);
    await logAudit(req, {
      action: "create",
      entityType: "campaign",
      entityId: campaign.id,
      details: { title: campaign.title },
    });
    return res.status(201).json(campaign);
  } catch (error) {
    console.error("createCampaign error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCampaign(req: Request, res: Response) {
  try {
    const campaign = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    Object.assign(campaign, req.body);
    await repo().save(campaign);
    await logAudit(req, {
      action: "update",
      entityType: "campaign",
      entityId: campaign.id,
      details: { title: campaign.title },
    });
    return res.json(campaign);
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
