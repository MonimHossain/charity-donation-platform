import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { DonationPage } from "../../components/donationPage/donationPage.entity.js";
import { logAudit } from "../../helper/auditLog.js";

const repo = () => AppDataSource.getRepository(DonationPage);

const defaultConfig = () => ({
  experience: {
    type: "standard",
  },
  visibility: {
    homepageFeatured: false,
    headerFeatured: false,
    priority: 0,
  },
});

export async function getAdminDonationPages(_req: Request, res: Response) {
  try {
    const pages = await repo().find({ order: { updatedAt: "DESC" } });
    return res.json({ items: pages });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminDonationPageById(req: Request, res: Response) {
  try {
    const page = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!page) return res.status(404).json({ message: "Not found" });
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationPageBySlug(req: Request, res: Response) {
  try {
    const page = await repo().findOne({
      where: { slug: routeParam(req, 'slug'), status: "published" },
    });
    if (!page) return res.status(404).json({ message: "Not found" });
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listPublishedDonationPages(req: Request, res: Response) {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 50)));
    const pages = await repo().find({
      where: { status: "published" },
      order: { updatedAt: "DESC" },
      take: limit,
    });

    // No “featured” concept: return all published pages.
    return res.json({ items: pages });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminDonationPage(req: Request, res: Response) {
  try {
    const { title, slug, category, shortDescription, status, campaignId, config } = req.body;
    const normalizeSlug = (s: string) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const base =
      normalizeSlug(slug) ||
      normalizeSlug(title) ||
      `donation-${Date.now().toString(36)}`;

    // Ensure uniqueness to avoid random 500s when frontend creates with empty payload.
    let uniqueSlug = base;
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await repo().exist({ where: { slug: uniqueSlug } });
      if (!exists) break;
      uniqueSlug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const page = repo().create({
      title: title || "New donation page",
      slug: uniqueSlug,
      category: category || "general",
      shortDescription: shortDescription || "",
      status: status || "draft",
      campaignId: campaignId || null,
      config: config || defaultConfig(),
    });
    await repo().save(page);
    await logAudit(req, { action: "create", entityType: "donation_page", entityId: page.id, details: { title: page.title } });
    return res.status(201).json(page);
  } catch (error) {
    console.error("createAdminDonationPage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminDonationPage(req: Request, res: Response) {
  try {
    const page = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!page) return res.status(404).json({ message: "Not found" });
    Object.assign(page, req.body);
    await repo().save(page);
    await logAudit(req, {
      action: "update",
      entityType: "donation_page",
      entityId: page.id,
      details: { title: page.title },
    });
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminDonationPage(req: Request, res: Response) {
  try {
    const page = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!page) return res.status(404).json({ message: "Not found" });
    await repo().delete({ id: page.id });
    await logAudit(req, {
      action: "delete",
      entityType: "donation_page",
      entityId: page.id,
      details: { title: page.title },
    });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}
