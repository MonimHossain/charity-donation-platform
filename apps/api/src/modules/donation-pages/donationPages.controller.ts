import { Request, Response } from "express";
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
    const page = await repo().findOne({ where: { id: req.params.id } });
    if (!page) return res.status(404).json({ message: "Not found" });
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationPageBySlug(req: Request, res: Response) {
  try {
    const page = await repo().findOne({
      where: { slug: req.params.slug, status: "published" },
    });
    if (!page) return res.status(404).json({ message: "Not found" });
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminDonationPage(req: Request, res: Response) {
  try {
    const { title, slug, category, shortDescription, status, campaignId, config } = req.body;
    const baseSlug =
      slug ||
      String(title || "page")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const page = repo().create({
      title: title || "New donation page",
      slug: baseSlug,
      category: category || "general",
      shortDescription: shortDescription || "",
      status: status || "draft",
      campaignId: campaignId || null,
      config: config || defaultConfig(),
    });
    await repo().save(page);
    await logAudit(req, { action: "create", entityType: "donation_page", entityId: page.id });
    return res.status(201).json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminDonationPage(req: Request, res: Response) {
  try {
    const page = await repo().findOne({ where: { id: req.params.id } });
    if (!page) return res.status(404).json({ message: "Not found" });
    Object.assign(page, req.body);
    await repo().save(page);
    return res.json(page);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminDonationPage(req: Request, res: Response) {
  try {
    const result = await repo().delete({ id: req.params.id });
    if (!result.affected) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}
