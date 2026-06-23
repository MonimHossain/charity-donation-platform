import { Request, Response } from "express";
import { In } from "typeorm";
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
import {
  campaignUsableInQuickDonate,
  serializeCampaignForQuickDonate,
} from "./quickDonateCampaign.js";

async function resolveCampaignFields(campaignId?: string | null) {
  if (!campaignId) {
    return { campaignId: null, campaignSlug: null, campaignTitle: null, campaign: null };
  }
  const campaign = await AppDataSource.getRepository(Campaign).findOne({
    where: { id: campaignId },
  });
  if (!campaign) {
    return { campaignId: null, campaignSlug: null, campaignTitle: null, campaign: null };
  }
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.slug,
    campaignTitle: campaign.title,
    campaign,
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

    const campaignIds = [
      ...new Set(options.map((o) => o.campaignId).filter((id): id is string => Boolean(id))),
    ];

    const campaigns = campaignIds.length
      ? await AppDataSource.getRepository(Campaign).find({
          where: { id: In(campaignIds), status: "published" },
        })
      : [];

    const campaignById = new Map(campaigns.map((c) => [c.id, c]));
    const settings = await getOrCreateSettings();
    const categories = (settings.donationCategories ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const publicOptions = options
      .filter((o) => o.campaignId)
      .map((o) => {
        const campaign = campaignById.get(o.campaignId!);
        if (!campaign || !campaignUsableInQuickDonate(campaign)) return null;
        return {
          id: o.id,
          label: o.label,
          campaignId: campaign.id,
          campaignSlug: campaign.slug,
          campaignTitle: campaign.title,
          sortOrder: o.sortOrder,
          campaign: serializeCampaignForQuickDonate(campaign),
        };
      })
      .filter(Boolean);

    return res.json({
      options: publicOptions,
      settings: {
        donationCategories: categories,
        showSingleFrequency: settings.showSingleFrequency,
        showRegularFrequency: settings.showRegularFrequency,
      },
    });
  } catch (error) {
    console.error("getPublicQuickDonate error:", error);
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
    if (!campaignFields.campaignId || !campaignFields.campaign) {
      return res.status(400).json({ message: "A valid linked campaign is required" });
    }
    if (!campaignUsableInQuickDonate(campaignFields.campaign)) {
      return res.status(400).json({
        message:
          "Campaign must be published, not a fundraiser, and have at least one donation attribute with preset amounts",
      });
    }

    const option = createEntity(repo, {
      label: String(req.body.label ?? "").trim(),
      prices: [],
      sortOrder: Number(req.body.sortOrder ?? 0),
      isActive: req.body.isActive !== false,
      allowCustomPrice: false,
      campaignId: campaignFields.campaignId,
      campaignSlug: campaignFields.campaignSlug,
      campaignTitle: campaignFields.campaignTitle,
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
    if (req.body.sortOrder !== undefined) option.sortOrder = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined) option.isActive = Boolean(req.body.isActive);
    if (req.body.campaignId !== undefined) {
      const campaignFields = await resolveCampaignFields(req.body.campaignId);
      if (!campaignFields.campaignId || !campaignFields.campaign) {
        return res.status(400).json({ message: "A valid linked campaign is required" });
      }
      if (!campaignUsableInQuickDonate(campaignFields.campaign)) {
        return res.status(400).json({
          message:
            "Campaign must be published, not a fundraiser, and have at least one donation attribute with preset amounts",
        });
      }
      option.campaignId = campaignFields.campaignId;
      option.campaignSlug = campaignFields.campaignSlug ?? undefined;
      option.campaignTitle = campaignFields.campaignTitle ?? undefined;
    }

    if (!option.label) {
      return res.status(400).json({ message: "Label is required" });
    }
    if (!option.campaignId) {
      return res.status(400).json({ message: "Linked campaign is required" });
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
