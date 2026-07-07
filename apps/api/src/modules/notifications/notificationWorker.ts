import { Between, In } from "typeorm";
import { AppDataSource } from "../../helper/connectDB.js";
import { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";
import { EmailCampaign } from "../../components/email/emailCampaign.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { RecurringReminderLog } from "../../components/email/recurringReminderLog.entity.js";
import { getEmailSettings } from "./emailSettings.service.js";
import {
  dispatchEvent,
  sendAnnualSummaryCampaign,
  sendBulkUserEmail,
  sendNewsletterCampaign,
} from "./notification.service.js";

const reminderLogRepo = () => AppDataSource.getRepository(RecurringReminderLog);
const campaignRepo = () => AppDataSource.getRepository(EmailCampaign);

async function alreadyReminded(sourceType: string, sourceId: string): Promise<boolean> {
  const existing = await reminderLogRepo().findOne({ where: { sourceType, sourceId } });
  return Boolean(existing);
}

async function markReminded(sourceType: string, sourceId: string, chargeDate: Date) {
  const row = reminderLogRepo().create({ sourceType, sourceId, chargeDate });
  await reminderLogRepo().save(row);
}

export async function processRecurringReminders(): Promise<number> {
  const settings = await getEmailSettings();
  if (!settings.recurringReminders) return 0;

  const now = new Date();
  const minMs = settings.reminderHoursMin * 60 * 60 * 1000;
  const maxMs = settings.reminderHoursMax * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() + minMs);
  const windowEnd = new Date(now.getTime() + maxMs);

  let sent = 0;
  const recurringRepo = AppDataSource.getRepository(RecurringDonation);

  const recurringRows = await recurringRepo.find({
    where: {
      status: "active",
      nextPaymentDate: Between(windowStart, windowEnd),
    },
  });

  for (const row of recurringRows) {
    const sourceId = row.id;
    if (await alreadyReminded("recurring", sourceId)) continue;

    await dispatchEvent("recurring_reminder", {
      donorEmail: row.donorEmail,
      donorName: row.donorName,
      amount: Number(row.amount),
      currency: row.currency,
      chargeDate: row.nextPaymentDate
        ? new Date(row.nextPaymentDate).toLocaleDateString("en-GB")
        : "",
      userId: row.userId,
    });
    await markReminded("recurring", sourceId, row.nextPaymentDate || now);
    sent++;
  }

  const scheduleRepo = AppDataSource.getRepository(AutomatedDonationSchedule);
  const schedules = await scheduleRepo.find({ where: { status: "active" } });

  for (const schedule of schedules) {
    const installments = schedule.installments || [];
    for (const inst of installments) {
      if (inst.status !== "pending") continue;
      const chargeDate = new Date(inst.scheduledDate);
      if (chargeDate < windowStart || chargeDate > windowEnd) continue;

      const sourceId = `${schedule.id}:${inst.id}`;
      if (await alreadyReminded("automated", sourceId)) continue;

      await dispatchEvent("recurring_reminder", {
        donorEmail: schedule.donorEmail,
        donorName: schedule.donorName,
        amount: Number(inst.amount),
        currency: inst.currency || schedule.currency,
        chargeDate: chargeDate.toLocaleDateString("en-GB"),
        userId: schedule.userId,
      });
      await markReminded("automated", sourceId, chargeDate);
      sent++;
    }
  }

  return sent;
}

export async function processScheduledCampaigns(): Promise<number> {
  const now = new Date();
  const campaigns = await campaignRepo().find({
    where: {
      status: "scheduled",
    },
  });

  let processed = 0;

  for (const campaign of campaigns) {
    if (campaign.scheduledAt && campaign.scheduledAt > now) continue;

    campaign.status = "running";
    await campaignRepo().save(campaign);

    try {
      const config = campaign.config || {};
      let stats = { sent: 0, failed: 0, skipped: 0 };

      if (campaign.type === "bulk_users") {
        stats = await sendBulkUserEmail({
          userIds: (config.userIds as string[]) || [],
          templateId: campaign.templateId!,
          subjectOverride: config.subjectOverride as string | undefined,
          htmlOverride: config.htmlOverride as string | undefined,
        });
      } else if (campaign.type === "newsletter") {
        stats = await sendNewsletterCampaign({
          templateId: campaign.templateId!,
          subjectOverride: config.subjectOverride as string | undefined,
          htmlOverride: config.htmlOverride as string | undefined,
        });
      } else if (campaign.type === "annual_summary") {
        stats = await sendAnnualSummaryCampaign({
          templateId: campaign.templateId!,
          fromDate: config.fromDate as string,
          toDate: config.toDate as string,
          userIds: config.userIds as string[] | undefined,
          subjectOverride: config.subjectOverride as string | undefined,
          htmlOverride: config.htmlOverride as string | undefined,
        });
      } else if (campaign.type === "admin_alert") {
        await dispatchEvent("admin_alert", {
          title: (config.title as string) || "Admin alert",
          body: (config.body as string) || "",
          actionUrl: (config.actionUrl as string) || "/admin",
          adminIds: config.adminIds as string[] | undefined,
          sendEmail: true,
          subjectOverride: config.subjectOverride as string | undefined,
          htmlOverride: config.htmlOverride as string | undefined,
        });
        stats = { sent: 1, failed: 0, skipped: 0 };
      }

      campaign.status = "completed";
      campaign.completedAt = new Date();
      campaign.stats = stats;
      await campaignRepo().save(campaign);
      processed++;
    } catch (err) {
      campaign.status = "failed";
      campaign.completedAt = new Date();
      await campaignRepo().save(campaign);
      console.error("[notificationWorker] Campaign failed:", err);
    }
  }

  return processed;
}

export async function runNotificationWorkerCycle(): Promise<void> {
  const reminders = await processRecurringReminders();
  const campaigns = await processScheduledCampaigns();
  if (reminders > 0 || campaigns > 0) {
    console.log(`[notificationWorker] reminders=${reminders} campaigns=${campaigns}`);
  }
}

export function startNotificationWorker(intervalMs = 3600000): void {
  const run = () => {
    void runNotificationWorkerCycle().catch((err) => {
      console.error("[notificationWorker] error:", err);
    });
  };
  run();
  setInterval(run, intervalMs);
  console.log(`Notification worker started (every ${intervalMs}ms)`);
}
