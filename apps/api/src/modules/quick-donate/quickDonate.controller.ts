import { Request, Response } from "express";
import { createEntity } from "../../helper/typeorm.js";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { QuickDonateOption } from "../../components/donation/quickDonateOption.entity.js";
import {
  QuickDonateSettings,
  type DonationCategoryOption,
} from "../../components/donation/quickDonateSettings.entity.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";
import { logAudit } from "../../helper/auditLog.js";

function normalizePrices(raw: unknown): { amount: number; sortOrder: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p, i) => ({
      amount: Number((p as { amount?: number }).amount),
      sortOrder: Number((p as { sortOrder?: number }).sortOrder ?? i),
    }))
    .filter((p) => Number.isFinite(p.amount) && p.amount > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function resolveCampaignFields(campaignId?: string | null) {
  if (!campaignId) {
    return { campaignId: null, campaignSlug: null, campaignTitle: null };
  }
  const campaign = await AppDataSource.getRepository(Campaign).findOne({
    where: { id: campaignId },
    select: ["id", "slug", "title"],
  });
  if (!campaign) {
    return { campaignId: null, campaignSlug: null, campaignTitle: null };
  }
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.slug,
    campaignTitle: campaign.title,
  };
}

async function getOrCreateSettings() {
  const repo = AppDataSource.getRepository(QuickDonateSettings);
  let settings = await repo.findOne({ where: { key: "default" } });
  if (!settings) {
    settings = repo.create({
      key: "default",
      donationCategories: [
        { value: "general", label: "General Donation", sortOrder: 0, isActive: true },
        { value: "zakat", label: "Zakat", sortOrder: 1, isActive: true },
        { value: "sadaqah", label: "Sadaqah", sortOrder: 2, isActive: true },
      ],
      showSingleFrequency: true,
      showRegularFrequency: true,
    });
    await repo.save(settings);
  }
  return settings;
}

export async function getPublicQuickDonate(_req: Request, res: Response) {
  try {
    const optionRepo = AppDataSource.getRepository(QuickDonateOption);
    const options = await optionRepo.find({
      where: { isActive: true },
      order: { sortOrder: "ASC" },
    });
    const settings = await getOrCreateSettings();
    const categories = (settings.donationCategories ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return res.json({
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        campaignId: o.campaignId ?? null,
        campaignSlug: o.campaignSlug ?? null,
        campaignTitle: o.campaignTitle ?? null,
        prices: normalizePrices(o.prices),
        sortOrder: o.sortOrder,
      })),
      settings: {
        donationCategories: categories,
        showSingleFrequency: settings.showSingleFrequency,
        showRegularFrequency: settings.showRegularFrequency,
      },
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listQuickDonateOptions(_req: Request, res: Response) {
  try {
    const options = await AppDataSource.getRepository(QuickDonateOption).find({
      order: { sortOrder: "ASC" },
    });
    return res.json({ items: options });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createQuickDonateOption(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(QuickDonateOption);
    const campaignFields = await resolveCampaignFields(req.body.campaignId);
    const option = createEntity(repo, {
      label: String(req.body.label ?? "").trim(),
      prices: normalizePrices(req.body.prices),
      sortOrder: Number(req.body.sortOrder ?? 0),
      isActive: req.body.isActive !== false,
      ...campaignFields,
    });
    if (!option.label) {
      return res.status(400).json({ message: "Label is required" });
    }
    await repo.save(option);
    await logAudit(req, { action: "create", entityType: "quick_donate_option", entityId: option.id });
    return res.status(201).json(option);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateQuickDonateOption(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(QuickDonateOption);
    const option = await repo.findOne({ where: { id: routeParam(req, "id") } });
    if (!option) return res.status(404).json({ message: "Option not found" });

    if (req.body.label !== undefined) option.label = String(req.body.label).trim();
    if (req.body.prices !== undefined) option.prices = normalizePrices(req.body.prices);
    if (req.body.sortOrder !== undefined) option.sortOrder = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined) option.isActive = Boolean(req.body.isActive);
    if (req.body.campaignId !== undefined) {
      const campaignFields = await resolveCampaignFields(req.body.campaignId);
      option.campaignId = campaignFields.campaignId ?? undefined;
      option.campaignSlug = campaignFields.campaignSlug ?? undefined;
      option.campaignTitle = campaignFields.campaignTitle ?? undefined;
    }

    if (!option.label) {
      return res.status(400).json({ message: "Label is required" });
    }

    await repo.save(option);
    await logAudit(req, { action: "update", entityType: "quick_donate_option", entityId: option.id });
    return res.json(option);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteQuickDonateOption(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(QuickDonateOption).delete(routeParam(req, "id"));
    if (result.affected === 0) return res.status(404).json({ message: "Option not found" });
    await logAudit(req, { action: "delete", entityType: "quick_donate_option", entityId: routeParam(req, "id") });
    return res.json({ message: "Option deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getQuickDonateSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateQuickDonateSettings(req: Request, res: Response) {
  try {
    const settings = await getOrCreateSettings();
    if (req.body.donationCategories !== undefined) {
      settings.donationCategories = (req.body.donationCategories as DonationCategoryOption[]).map(
        (c, i) => ({
          value: String(c.value ?? "").trim(),
          label: String(c.label ?? "").trim(),
          sortOrder: Number(c.sortOrder ?? i),
          isActive: c.isActive !== false,
        })
      );
    }
    if (req.body.showSingleFrequency !== undefined) {
      settings.showSingleFrequency = Boolean(req.body.showSingleFrequency);
    }
    if (req.body.showRegularFrequency !== undefined) {
      settings.showRegularFrequency = Boolean(req.body.showRegularFrequency);
    }
    await AppDataSource.getRepository(QuickDonateSettings).save(settings);
    await logAudit(req, { action: "update", entityType: "quick_donate_settings", entityId: settings.id });
    return res.json(settings);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}
