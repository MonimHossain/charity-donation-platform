import { Request, Response } from "express";
import { createEntity } from "../../helper/typeorm.js";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { HeroSlide } from "../../components/cms/heroSlide.entity.js";
import { HomepageSection } from "../../components/cms/homepageSection.entity.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";
import { DonationPreset } from "../../components/donation/donationPreset.entity.js";
import { Testimonial } from "../../components/testimonial/testimonial.entity.js";
import { logAudit } from "../../helper/auditLog.js";

const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  CAD: 1.72,
  AUD: 1.93,
  AED: 4.67,
  SAR: 4.76,
  MYR: 5.98,
};

function normalizeCurrencyRates(raw?: Record<string, unknown> | null): Record<string, number> {
  const rates = { ...DEFAULT_CURRENCY_RATES };
  if (!raw || typeof raw !== "object") return rates;
  for (const [code, value] of Object.entries(raw)) {
    const upper = code.toUpperCase();
    const num = Number(value);
    if (upper in rates && Number.isFinite(num) && num > 0) {
      rates[upper] = num;
    }
  }
  rates.GBP = 1;
  return rates;
}

export async function getHeroSlides(_req: Request, res: Response) {
  try {
    const slides = await AppDataSource.getRepository(HeroSlide).find({
      where: { isVisible: true },
      order: { sortOrder: "ASC" },
    });
    return res.json(slides);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateHeroSlide(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(HeroSlide);
    const slide = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!slide) return res.status(404).json({ message: "Slide not found" });
    Object.assign(slide, req.body);
    await repo.save(slide);
    return res.json(slide);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createHeroSlide(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(HeroSlide);
    const slide = createEntity(repo, req.body);
    await repo.save(slide);
    await logAudit(req, { action: "create", entityType: "hero_slide", entityId: slide.id });
    return res.status(201).json(slide);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteHeroSlide(req: Request, res: Response) {
  try {
    const result = await AppDataSource.getRepository(HeroSlide).delete(routeParam(req, 'id'));
    if (result.affected === 0) return res.status(404).json({ message: "Slide not found" });
    await logAudit(req, { action: "delete", entityType: "hero_slide", entityId: routeParam(req, 'id') });
    return res.json({ message: "Slide deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getHomepageSections(_req: Request, res: Response) {
  try {
    const sections = await AppDataSource.getRepository(HomepageSection).find({
      order: { sortOrder: "ASC" },
    });
    return res.json(sections);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateHomepageSection(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(HomepageSection);
    const section = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!section) return res.status(404).json({ message: "Section not found" });
    Object.assign(section, req.body);
    await repo.save(section);
    await logAudit(req, { action: "update", entityType: "homepage_section", entityId: section.id });
    return res.json(section);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function reorderHomepageSections(req: Request, res: Response) {
  try {
    const { sections } = req.body;
    const repo = AppDataSource.getRepository(HomepageSection);
    for (const { id, sortOrder } of sections) {
      await repo.update(id, { sortOrder });
    }
    await logAudit(req, { action: "reorder", entityType: "homepage_section" });
    return res.json({ message: "Sections reordered" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSiteSettings(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    let settings = await repo.findOne({ where: {} });
    if (!settings) {
      settings = repo.create({
        siteName: "Charity Donation Platform",
        siteDescription: "Making a difference together",
        charityRegNumber: "1192710",
        contactEmail: "info@charityplatform.org",
        contactPhone: "0333 533 0642",
        donationPolicy: "100% Donation Policy on Zakat",
      });
      await repo.save(settings);
    }
    const response = {
      ...settings,
      currencyRates: normalizeCurrencyRates(settings.currencyRates),
      email: {
        donationConfirmation: settings.emailSettings?.donationConfirmation ?? true,
        recurringReminders: settings.emailSettings?.recurringReminders ?? true,
        campaignUpdates: settings.emailSettings?.campaignUpdates ?? false,
        newsletterDigest: settings.emailSettings?.newsletterDigest ?? false,
        adminAlerts: settings.emailSettings?.adminAlerts ?? true,
        senderName: settings.emailSettings?.senderName ?? "",
        senderEmail: settings.emailSettings?.senderEmail ?? "",
        reminderHoursMin: settings.emailSettings?.reminderHoursMin ?? 24,
        reminderHoursMax: settings.emailSettings?.reminderHoursMax ?? 32,
      },
      payment: settings.paymentConfig
        ? {
            enabledProviders: settings.paymentConfig.enabledProviders || ["stripe"],
            stripePublicKey: settings.paymentConfig.stripePublicKey || "",
            paypalClientId: settings.paymentConfig.paypalClientId || "",
            paytabsClientKey: settings.paymentConfig.paytabsClientKey || "",
            currency: settings.paymentConfig.defaultCurrency || "GBP",
            minimumDonation: settings.paymentConfig.minimumDonation ?? 1,
          }
        : {
            enabledProviders: ["stripe"],
            stripePublicKey: "",
            paypalClientId: "",
            paytabsClientKey: "",
            currency: "GBP",
            minimumDonation: 1,
          },
    };
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateSiteSettings(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    let settings = await repo.findOne({ where: {} });
    const body = { ...req.body };
    if (body.payment) {
      const payment = body.payment;
      body.paymentConfig = {
        enabledProviders: payment.enabledProviders || payment.enabled || ["stripe"],
        stripePublicKey: payment.stripePublicKey,
        paypalClientId: payment.paypalClientId,
        paytabsClientKey: payment.paytabsClientKey,
        defaultCurrency: payment.currency || payment.defaultCurrency || "GBP",
        minimumDonation: payment.minimumDonation ?? 1,
      };
      delete body.payment;
    }
    if (body.currencyRates) {
      body.currencyRates = normalizeCurrencyRates(body.currencyRates);
    }
    if (body.email) {
      body.emailSettings = {
        ...(settings?.emailSettings || {}),
        donationConfirmation: body.email.donationConfirmation,
        recurringReminders: body.email.recurringReminders,
        campaignUpdates: body.email.campaignUpdates,
        newsletterDigest: body.email.newsletterDigest,
        adminAlerts: body.email.adminAlerts,
        senderName: body.email.senderName,
        senderEmail: body.email.senderEmail,
        reminderHoursMin: body.email.reminderHoursMin,
        reminderHoursMax: body.email.reminderHoursMax,
      };
      delete body.email;
    }
    if (!settings) {
      settings = createEntity(repo, body);
    } else {
      Object.assign(settings, body);
      if (body.paymentConfig) {
        settings.paymentConfig = { ...settings.paymentConfig, ...body.paymentConfig };
      }
    }
    await repo.save(settings);
    await logAudit(req, { action: "update", entityType: "site_settings", entityId: settings.id });
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonationPresets(_req: Request, res: Response) {
  try {
    const presets = await AppDataSource.getRepository(DonationPreset).find({
      where: { isActive: true },
      order: { sortOrder: "ASC" },
    });
    return res.json(presets);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateDonationPreset(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(DonationPreset);
    const preset = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!preset) return res.status(404).json({ message: "Preset not found" });
    Object.assign(preset, req.body);
    await repo.save(preset);
    await logAudit(req, { action: "update", entityType: "donation_preset", entityId: preset.id });
    return res.json(preset);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getTestimonials(_req: Request, res: Response) {
  try {
    const testimonials = await AppDataSource.getRepository(Testimonial).find({
      where: { isVisible: true },
      order: { sortOrder: "ASC" },
    });
    return res.json(testimonials);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
