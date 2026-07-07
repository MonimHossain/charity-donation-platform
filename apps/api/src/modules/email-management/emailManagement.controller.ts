import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { EmailCampaign } from "../../components/email/emailCampaign.entity.js";
import { EmailLog } from "../../components/email/emailLog.entity.js";
import { EmailTemplate } from "../../components/email/emailTemplate.entity.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";
import { prepareEmailHtmlForSend } from "../../helper/emailHtml.js";
import { sendMail } from "../../helper/mailer.js";
import { getEmailSettings } from "../notifications/emailSettings.service.js";
import {
  renderTemplateHtml,
  renderTemplateSubject,
  type MergeData,
} from "../notifications/templateRenderer.js";
import {
  dispatchEvent,
  getTemplateByKey,
  sendAnnualSummaryCampaign,
  sendBulkUserEmail,
  sendNewsletterCampaign,
} from "../notifications/notification.service.js";

const templateRepo = () => AppDataSource.getRepository(EmailTemplate);
const logRepo = () => AppDataSource.getRepository(EmailLog);
const campaignRepo = () => AppDataSource.getRepository(EmailCampaign);

export async function getSmtpConfig(_req: Request, res: Response) {
  return res.json({
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    fromName: process.env.SMTP_FROM_NAME || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "",
    emailEnabled: process.env.EMAIL_ENABLED === "true" || process.env.EMAIL_ENABLED === "1",
  });
}

export async function updateSmtpConfig(_req: Request, res: Response) {
  return res.status(400).json({
    message: "SMTP is configured via environment variables (.env). Update SMTP_* there.",
  });
}

export async function sendTestSmtp(req: Request, res: Response) {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: "Recipient email required" });
    await sendMail({
      to,
      subject: "Test email — Charity Platform",
      html: "<p>This is a test email from your charity platform.</p>",
    });
    return res.json({ message: "Test email sent" });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Send failed",
    });
  }
}

export async function listEmailTemplates(_req: Request, res: Response) {
  const items = await templateRepo().find({ order: { name: "ASC" } });
  return res.json({ items, total: items.length });
}

export async function getEmailTemplate(req: Request, res: Response) {
  const tpl = await templateRepo().findOne({ where: { id: routeParam(req, "id") } });
  if (!tpl) return res.status(404).json({ message: "Template not found" });
  return res.json(tpl);
}

export async function createEmailTemplate(req: Request, res: Response) {
  const { key, name, category, subject, preheader, htmlBody, mergeTags, isActive } = req.body;
  if (!key || !name || !subject || !htmlBody) {
    return res.status(400).json({ message: "key, name, subject, htmlBody required" });
  }
  const existing = await templateRepo().findOne({ where: { key } });
  if (existing) return res.status(409).json({ message: "Template key already exists" });

  const tpl = templateRepo().create({
    key,
    name,
    category: category || "transactional",
    subject,
    preheader,
    htmlBody,
    mergeTags: mergeTags || [],
    isSystem: false,
    isActive: isActive !== false,
  });
  await templateRepo().save(tpl);
  return res.status(201).json(tpl);
}

export async function updateEmailTemplate(req: Request, res: Response) {
  const tpl = await templateRepo().findOne({ where: { id: routeParam(req, "id") } });
  if (!tpl) return res.status(404).json({ message: "Template not found" });

  const { name, category, subject, preheader, htmlBody, mergeTags, isActive } = req.body;
  if (name !== undefined) tpl.name = name;
  if (category !== undefined) tpl.category = category;
  if (subject !== undefined) tpl.subject = subject;
  if (preheader !== undefined) tpl.preheader = preheader;
  if (htmlBody !== undefined) tpl.htmlBody = htmlBody;
  if (mergeTags !== undefined) tpl.mergeTags = mergeTags;
  if (isActive !== undefined) tpl.isActive = isActive;

  await templateRepo().save(tpl);
  return res.json(tpl);
}

export async function deleteEmailTemplate(req: Request, res: Response) {
  const tpl = await templateRepo().findOne({ where: { id: routeParam(req, "id") } });
  if (!tpl) return res.status(404).json({ message: "Template not found" });
  if (tpl.isSystem) return res.status(400).json({ message: "System templates cannot be deleted" });
  await templateRepo().remove(tpl);
  return res.json({ message: "Template deleted" });
}

export async function getReminderSettings(_req: Request, res: Response) {
  const settings = await getEmailSettings();
  return res.json({
    reminderHoursMin: settings.reminderHoursMin,
    reminderHoursMax: settings.reminderHoursMax,
    recurringReminders: settings.recurringReminders,
  });
}

export async function updateReminderSettings(req: Request, res: Response) {
  const repo = AppDataSource.getRepository(SiteSettings);
  let settings = await repo.findOne({ where: {} });
  if (!settings) return res.status(404).json({ message: "Site settings not found" });

  settings.emailSettings = {
    ...settings.emailSettings,
    reminderHoursMin: req.body.reminderHoursMin ?? settings.emailSettings?.reminderHoursMin ?? 24,
    reminderHoursMax: req.body.reminderHoursMax ?? settings.emailSettings?.reminderHoursMax ?? 32,
    recurringReminders:
      req.body.recurringReminders ?? settings.emailSettings?.recurringReminders ?? true,
  };
  await repo.save(settings);
  return res.json(settings.emailSettings);
}

export async function listEmailLogs(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
  const skip = (page - 1) * limit;

  const [items, total] = await logRepo().findAndCount({
    order: { sentAt: "DESC" },
    skip,
    take: limit,
  });

  return res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function previewEmailTemplate(req: Request, res: Response) {
  const { templateId, mergeData } = req.body;
  const tpl = await templateRepo().findOne({ where: { id: templateId } });
  if (!tpl) return res.status(404).json({ message: "Template not found" });

  const sample: MergeData = {
    donorName: "Jane Donor",
    donorEmail: "jane@example.com",
    amount: "£25.00",
    totalAmount: "£31.25",
    receiptNumber: "DON-202601-000001",
    campaignTitle: "Food Aid",
    giftAid: "Yes",
    chargeDate: "15 January 2026",
    annualTotal: "£150.00",
    donationCount: 5,
    dateRange: "1 Jan 2025 – 31 Dec 2025",
    alertTitle: "System maintenance",
    alertBody: "Scheduled maintenance tonight at 10pm.",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
    accountUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/account`,
    receiptUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/thank-you`,
    recurringUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/account/recurring`,
    ...(mergeData || {}),
  };

  const renderedHtml = renderTemplateHtml(tpl.htmlBody, sample);
  return res.json({
    subject: renderTemplateSubject(tpl.subject, sample),
    html: prepareEmailHtmlForSend(renderedHtml),
  });
}

export async function sendBulkEmail(req: Request, res: Response) {
  try {
    const { userIds, templateId, subjectOverride, htmlOverride, sendNow } = req.body;
    if (!userIds?.length || !templateId) {
      return res.status(400).json({ message: "userIds and templateId required" });
    }

    if (sendNow !== false) {
      const stats = await sendBulkUserEmail({
        userIds,
        templateId,
        subjectOverride,
        htmlOverride,
      });
      return res.json({ message: "Bulk email sent", stats });
    }

    const campaign = campaignRepo().create({
      type: "bulk_users",
      templateId,
      name: "Bulk user email",
      status: "scheduled",
      scheduledAt: new Date(),
      config: { userIds, subjectOverride, htmlOverride },
    });
    await campaignRepo().save(campaign);
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err instanceof Error ? err.message : "Send failed" });
  }
}

export async function createEmailCampaign(req: Request, res: Response) {
  try {
    const { type, templateId, name, scheduledAt, config, sendNow } = req.body;
    if (!type || !templateId) {
      return res.status(400).json({ message: "type and templateId required" });
    }

    if (sendNow !== false) {
      let stats = { sent: 0, failed: 0, skipped: 0 };
      if (type === "newsletter") {
        stats = await sendNewsletterCampaign({
          templateId,
          subjectOverride: config?.subjectOverride,
          htmlOverride: config?.htmlOverride,
        });
      } else if (type === "annual_summary") {
        if (!config?.fromDate || !config?.toDate) {
          return res.status(400).json({ message: "fromDate and toDate required" });
        }
        stats = await sendAnnualSummaryCampaign({
          templateId,
          fromDate: config.fromDate,
          toDate: config.toDate,
          userIds: config.userIds,
          subjectOverride: config?.subjectOverride,
          htmlOverride: config?.htmlOverride,
        });
      } else if (type === "admin_alert") {
        await dispatchEvent("admin_alert", {
          title: config?.title || "Admin alert",
          body: config?.body || "",
          actionUrl: config?.actionUrl || "/admin",
          adminIds: config?.adminIds,
          sendEmail: true,
          subjectOverride: config?.subjectOverride,
          htmlOverride: config?.htmlOverride,
        });
        stats = { sent: 1, failed: 0, skipped: 0 };
      } else {
        return res.status(400).json({ message: "Unsupported campaign type for immediate send" });
      }
      return res.json({ message: "Campaign sent", stats });
    }

    const campaign = campaignRepo().create({
      type,
      templateId,
      name,
      status: "scheduled",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      config: config || {},
    });
    await campaignRepo().save(campaign);
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err instanceof Error ? err.message : "Campaign failed" });
  }
}

export async function getEmailCampaign(req: Request, res: Response) {
  const campaign = await campaignRepo().findOne({ where: { id: routeParam(req, "id") } });
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  return res.json(campaign);
}

export async function listEmailCampaigns(_req: Request, res: Response) {
  const items = await campaignRepo().find({ order: { createdAt: "DESC" }, take: 50 });
  return res.json({ items, total: items.length });
}
