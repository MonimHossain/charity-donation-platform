import { AppDataSource } from "../../helper/connectDB.js";
import { In } from "typeorm";
import { Admin } from "../../components/admin/admin.entity.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { EmailLog } from "../../components/email/emailLog.entity.js";
import { EmailTemplate } from "../../components/email/emailTemplate.entity.js";
import { Notification } from "../../components/notification/notification.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { User } from "../../components/user/user.entity.js";
import { sendMail, isEmailEnabled } from "../../helper/mailer.js";
import { generateDonationReceiptPdf } from "../donations/receiptPdf.service.js";
import { getEmailSettings, isEventEnabled } from "./emailSettings.service.js";
import {
  buildDonationMergeData,
  formatAmount,
  renderTemplateHtml,
  renderTemplateSubject,
  type MergeData,
} from "./templateRenderer.js";

export type NotificationEventType =
  | "donation_success"
  | "registration"
  | "recurring_reminder"
  | "payment_failed"
  | "admin_alert";

const EVENT_TEMPLATE_MAP: Record<NotificationEventType, string> = {
  donation_success: "donation_receipt",
  registration: "welcome_registration",
  recurring_reminder: "recurring_payment_reminder",
  payment_failed: "payment_failed",
  admin_alert: "admin_general_alert",
};

const ADMIN_TEMPLATE_MAP: Partial<Record<NotificationEventType, string>> = {
  donation_success: "admin_new_donation",
  registration: "admin_new_registration",
  payment_failed: "admin_payment_failed",
};

const templateRepo = () => AppDataSource.getRepository(EmailTemplate);
const notificationRepo = () => AppDataSource.getRepository(Notification);
const emailLogRepo = () => AppDataSource.getRepository(EmailLog);
const adminRepo = () => AppDataSource.getRepository(Admin);

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
}

async function getTemplateByKey(key: string): Promise<EmailTemplate | null> {
  return templateRepo().findOne({ where: { key, isActive: true } });
}

async function logEmail(input: {
  templateId?: string;
  templateKey?: string;
  recipientEmail: string;
  recipientType?: string;
  recipientId?: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  const log = emailLogRepo().create({
    templateId: input.templateId,
    templateKey: input.templateKey,
    recipientEmail: input.recipientEmail,
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    subject: input.subject,
    status: input.status,
    error: input.error,
    metadata: input.metadata,
  });
  await emailLogRepo().save(log);
}

async function createNotification(input: {
  recipientType: "user" | "admin";
  recipientId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const row = notificationRepo().create(input);
  await notificationRepo().save(row);
  return row;
}

async function sendTemplatedEmail(input: {
  templateKey: string;
  to: string;
  mergeData: MergeData;
  recipientType?: string;
  recipientId?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  subjectOverride?: string;
  htmlOverride?: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const template = await getTemplateByKey(input.templateKey);
  if (!template) {
    await logEmail({
      templateKey: input.templateKey,
      recipientEmail: input.to,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      subject: input.subjectOverride || input.templateKey,
      status: "failed",
      error: "Template not found",
    });
    return "failed";
  }

  const subject = renderTemplateSubject(
    input.subjectOverride || template.subject,
    input.mergeData
  );
  const html = renderTemplateHtml(input.htmlOverride || template.htmlBody, input.mergeData);

  if (!isEmailEnabled()) {
    await logEmail({
      templateId: template.id,
      templateKey: template.key,
      recipientEmail: input.to,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      subject,
      status: "skipped",
      metadata: { reason: "EMAIL_ENABLED is not true" },
    });
    return "skipped";
  }

  try {
    await sendMail({
      to: input.to,
      subject,
      html,
      attachments: input.attachments,
    });
    await logEmail({
      templateId: template.id,
      templateKey: template.key,
      recipientEmail: input.to,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      subject,
      status: "sent",
    });
    return "sent";
  } catch (err) {
    await logEmail({
      templateId: template.id,
      templateKey: template.key,
      recipientEmail: input.to,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      subject,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    return "failed";
  }
}

async function notifyAllAdmins(input: {
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const admins = await adminRepo().find({ where: { isActive: true } });
  for (const admin of admins) {
    await createNotification({
      recipientType: "admin",
      recipientId: admin.id,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    });
  }
}

export async function dispatchEvent(
  type: NotificationEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const settings = await getEmailSettings();

  switch (type) {
    case "donation_success": {
      const donation = payload.donation as Donation;
      const campaignTitle = (payload.campaignTitle as string) || "General Donation";
      if (!donation?.donorEmail) return;

      const mergeData = buildDonationMergeData({
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        amount: Number(donation.amount),
        totalAmount: Number(donation.totalAmount),
        currency: donation.currency,
        receiptNumber: donation.receiptNumber,
        campaignTitle,
        giftAid: donation.giftAid,
        giftAidAmount: Number(donation.giftAidAmount),
        donationId: donation.id,
      });

      if (isEventEnabled(settings, "donation")) {
        let pdfAttachment: Array<{ filename: string; content: Buffer; contentType?: string }> =
          [];
        try {
          const pdf = await generateDonationReceiptPdf(donation, campaignTitle);
          pdfAttachment = [
            {
              filename: `receipt-${donation.receiptNumber || donation.id}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ];
        } catch (err) {
          console.error("[notification] PDF generation failed:", err);
        }

        await sendTemplatedEmail({
          templateKey: EVENT_TEMPLATE_MAP.donation_success,
          to: donation.donorEmail,
          mergeData,
          recipientType: "user",
          recipientId: donation.userId,
          attachments: pdfAttachment,
        });
      } else {
        await logEmail({
          templateKey: EVENT_TEMPLATE_MAP.donation_success,
          recipientEmail: donation.donorEmail,
          recipientType: "user",
          recipientId: donation.userId,
          subject: "Donation receipt (skipped)",
          status: "skipped",
          metadata: { reason: "donationConfirmation disabled" },
        });
      }

      if (donation.userId) {
        await createNotification({
          recipientType: "user",
          recipientId: donation.userId,
          type: "donation_success",
          title: "Donation successful",
          body: `Thank you! Your donation of ${formatAmount(Number(donation.totalAmount), donation.currency)} has been received.`,
          actionUrl: `/thank-you?donationId=${donation.id}`,
          metadata: { donationId: donation.id },
        });
      }

      const adminTemplateKey = ADMIN_TEMPLATE_MAP.donation_success!;
      const adminTemplate = await getTemplateByKey(adminTemplateKey);
      const adminMerge: MergeData = {
        ...mergeData,
        adminDashboardUrl: `${appUrl()}/admin/donations`,
      };
      await notifyAllAdmins({
        type: "donation_success",
        title: adminTemplate
          ? renderTemplateSubject(adminTemplate.subject, adminMerge)
          : "New donation received",
        body: adminTemplate
          ? renderTemplateHtml(adminTemplate.preheader || adminTemplate.htmlBody, adminMerge)
              .replace(/<[^>]+>/g, " ")
              .slice(0, 280)
          : `${donation.donorName} donated ${formatAmount(Number(donation.totalAmount), donation.currency)}.`,
        actionUrl: `/admin/donations`,
        metadata: { donationId: donation.id },
      });
      break;
    }

    case "registration": {
      const user = payload.user as User;
      if (!user?.email) return;

      const mergeData: MergeData = {
        donorName: user.fullName,
        donorEmail: user.email,
        accountUrl: `${appUrl()}/account`,
        appUrl: appUrl(),
      };

      await sendTemplatedEmail({
        templateKey: EVENT_TEMPLATE_MAP.registration,
        to: user.email,
        mergeData,
        recipientType: "user",
        recipientId: user.id,
      });

      await createNotification({
        recipientType: "user",
        recipientId: user.id,
        type: "registration",
        title: "Welcome!",
        body: `Welcome to our platform, ${user.fullName}. Your account is ready.`,
        actionUrl: "/account",
      });

      await notifyAllAdmins({
        type: "registration",
        title: "New user registered",
        body: `${user.fullName} (${user.email}) has registered.`,
        actionUrl: "/admin/users",
        metadata: { userId: user.id },
      });
      break;
    }

    case "recurring_reminder": {
      if (!isEventEnabled(settings, "recurring_reminder")) return;

      const donorEmail = payload.donorEmail as string;
      const donorName = payload.donorName as string;
      const amount = Number(payload.amount);
      const currency = (payload.currency as string) || "GBP";
      const chargeDate = payload.chargeDate as string;
      const userId = payload.userId as string | undefined;

      const mergeData: MergeData = {
        donorName,
        donorEmail,
        amount: formatAmount(amount, currency),
        currency,
        chargeDate,
        recurringUrl: `${appUrl()}/account/recurring`,
        appUrl: appUrl(),
      };

      await sendTemplatedEmail({
        templateKey: EVENT_TEMPLATE_MAP.recurring_reminder,
        to: donorEmail,
        mergeData,
        recipientType: "user",
        recipientId: userId,
      });

      if (userId) {
        await createNotification({
          recipientType: "user",
          recipientId: userId,
          type: "recurring_reminder",
          title: "Upcoming recurring payment",
          body: `Your recurring donation of ${formatAmount(amount, currency)} is scheduled for ${chargeDate}.`,
          actionUrl: "/account/recurring",
        });
      }
      break;
    }

    case "payment_failed": {
      const donorEmail = payload.donorEmail as string;
      const donorName = payload.donorName as string;
      const amount = Number(payload.amount || 0);
      const currency = (payload.currency as string) || "GBP";
      const userId = payload.userId as string | undefined;
      const isRecurring = Boolean(payload.isRecurring);
      const donationId = payload.donationId as string | undefined;

      const mergeData: MergeData = {
        donorName,
        donorEmail,
        amount: formatAmount(amount, currency),
        currency,
        recurringUrl: `${appUrl()}/account/recurring`,
        checkoutUrl: `${appUrl()}/donation/checkout`,
        appUrl: appUrl(),
      };

      await sendTemplatedEmail({
        templateKey: EVENT_TEMPLATE_MAP.payment_failed,
        to: donorEmail,
        mergeData,
        recipientType: "user",
        recipientId: userId,
      });

      if (userId) {
        await createNotification({
          recipientType: "user",
          recipientId: userId,
          type: "payment_failed",
          title: "Payment failed",
          body: `We could not process your ${isRecurring ? "recurring " : ""}payment of ${formatAmount(amount, currency)}.`,
          actionUrl: isRecurring ? "/account/recurring" : "/account/history",
          metadata: { donationId },
        });
      }

      await notifyAllAdmins({
        type: "payment_failed",
        title: "Payment failed",
        body: `Payment failed for ${donorName} (${formatAmount(amount, currency)}).`,
        actionUrl: donationId ? `/admin/donations` : "/admin/donations",
        metadata: { donationId, donorEmail },
      });
      break;
    }

    case "admin_alert": {
      if (!isEventEnabled(settings, "admin_alert")) return;

      const title = (payload.title as string) || "Admin alert";
      const body = (payload.body as string) || "";
      const actionUrl = (payload.actionUrl as string) || "/admin";
      const adminIds = payload.adminIds as string[] | undefined;
      const sendEmail = payload.sendEmail !== false;
      const mergeData: MergeData = {
        alertTitle: title,
        alertBody: body,
        adminDashboardUrl: `${appUrl()}/admin`,
        appUrl: appUrl(),
      };

      const admins = adminIds?.length
        ? await adminRepo().find({ where: { id: In(adminIds), isActive: true } })
        : await adminRepo().find({ where: { isActive: true } });

      for (const admin of admins) {
        if (sendEmail) {
          await sendTemplatedEmail({
            templateKey: EVENT_TEMPLATE_MAP.admin_alert,
            to: admin.email,
            mergeData: { ...mergeData, donorName: admin.fullName },
            recipientType: "admin",
            recipientId: admin.id,
            htmlOverride: payload.htmlOverride as string | undefined,
            subjectOverride: payload.subjectOverride as string | undefined,
          });
        }
        await createNotification({
          recipientType: "admin",
          recipientId: admin.id,
          type: "admin_alert",
          title,
          body,
          actionUrl,
        });
      }
      break;
    }
  }
}

export async function sendBulkUserEmail(input: {
  userIds: string[];
  templateId: string;
  subjectOverride?: string;
  htmlOverride?: string;
}): Promise<{ sent: number; failed: number; skipped: number }> {
  const template = await templateRepo().findOne({ where: { id: input.templateId } });
  if (!template) throw new Error("Template not found");

  const users = await AppDataSource.getRepository(User).find({
    where: { id: In(input.userIds) },
  });
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }
    const mergeData: MergeData = {
      donorName: user.fullName,
      donorEmail: user.email,
      accountUrl: `${appUrl()}/account`,
      appUrl: appUrl(),
    };
    const result = await sendTemplatedEmail({
      templateKey: template.key,
      to: user.email,
      mergeData,
      recipientType: "user",
      recipientId: user.id,
      subjectOverride: input.subjectOverride,
      htmlOverride: input.htmlOverride,
    });
    if (result === "sent") sent++;
    else if (result === "failed") failed++;
    else skipped++;
  }

  return { sent, failed, skipped };
}

export async function sendNewsletterCampaign(input: {
  templateId: string;
  subjectOverride?: string;
  htmlOverride?: string;
}): Promise<{ sent: number; failed: number; skipped: number }> {
  const settings = await getEmailSettings();
  if (!isEventEnabled(settings, "newsletter")) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const template = await templateRepo().findOne({ where: { id: input.templateId } });
  if (!template) throw new Error("Template not found");

  const { NewsletterSubscriber } = await import(
    "../../components/newsletter/subscriber.entity.js"
  );
  const subscribers = await AppDataSource.getRepository(NewsletterSubscriber).find({
    where: { isActive: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const sub of subscribers) {
    const mergeData: MergeData = {
      donorName: sub.name || "Subscriber",
      donorEmail: sub.email,
      unsubscribeUrl: `${appUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`,
      appUrl: appUrl(),
    };
    const result = await sendTemplatedEmail({
      templateKey: template.key,
      to: sub.email,
      mergeData,
      recipientType: "user",
      subjectOverride: input.subjectOverride,
      htmlOverride: input.htmlOverride,
    });
    if (result === "sent") sent++;
    else if (result === "failed") failed++;
    else skipped++;
  }

  return { sent, failed, skipped };
}

export async function sendAnnualSummaryCampaign(input: {
  templateId: string;
  fromDate: string;
  toDate: string;
  userIds?: string[];
  subjectOverride?: string;
  htmlOverride?: string;
}): Promise<{ sent: number; failed: number; skipped: number }> {
  const template = await templateRepo().findOne({ where: { id: input.templateId } });
  if (!template) throw new Error("Template not found");

  const donationRepo = AppDataSource.getRepository(Donation);
  const userRepo = AppDataSource.getRepository(User);

  const users = input.userIds?.length
    ? await userRepo.find({ where: { id: In(input.userIds) } })
    : await userRepo.find({ where: { isActive: true } });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    const qb = donationRepo
      .createQueryBuilder("d")
      .select("SUM(d.totalAmount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("d.status = :status", { status: "completed" })
      .andWhere("d.donorEmail = :email", { email: user.email })
      .andWhere("d.createdAt >= :from", { from: input.fromDate })
      .andWhere("d.createdAt <= :to", { to: input.toDate });

    const agg = await qb.getRawOne<{ total: string; count: string }>();
    const total = Number(agg?.total || 0);
    const count = Number(agg?.count || 0);

    if (total <= 0) {
      skipped++;
      continue;
    }

    const mergeData: MergeData = {
      donorName: user.fullName,
      donorEmail: user.email,
      annualTotal: formatAmount(total, "GBP"),
      donationCount: count,
      dateRange: `${input.fromDate} – ${input.toDate}`,
      accountUrl: `${appUrl()}/account/history`,
      appUrl: appUrl(),
    };

    const result = await sendTemplatedEmail({
      templateKey: template.key,
      to: user.email,
      mergeData,
      recipientType: "user",
      recipientId: user.id,
      subjectOverride: input.subjectOverride,
      htmlOverride: input.htmlOverride,
    });
    if (result === "sent") sent++;
    else if (result === "failed") failed++;
    else skipped++;
  }

  return { sent, failed, skipped };
}

export { sendTemplatedEmail, getTemplateByKey, createNotification, notifyAllAdmins };
