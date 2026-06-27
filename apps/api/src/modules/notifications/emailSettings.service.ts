import { AppDataSource } from "../../helper/connectDB.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

export type EmailSettings = {
  donationConfirmation: boolean;
  recurringReminders: boolean;
  campaignUpdates: boolean;
  newsletterDigest: boolean;
  adminAlerts: boolean;
  senderName: string;
  senderEmail: string;
  reminderHoursMin: number;
  reminderHoursMax: number;
};

const DEFAULTS: EmailSettings = {
  donationConfirmation: true,
  recurringReminders: true,
  campaignUpdates: false,
  newsletterDigest: false,
  adminAlerts: true,
  senderName: "",
  senderEmail: "",
  reminderHoursMin: 24,
  reminderHoursMax: 32,
};

export async function getEmailSettings(): Promise<EmailSettings> {
  const repo = AppDataSource.getRepository(SiteSettings);
  const settings = await repo.findOne({ where: {} });
  const raw = settings?.emailSettings ?? {};
  return {
    donationConfirmation: raw.donationConfirmation ?? DEFAULTS.donationConfirmation,
    recurringReminders: raw.recurringReminders ?? DEFAULTS.recurringReminders,
    campaignUpdates: raw.campaignUpdates ?? DEFAULTS.campaignUpdates,
    newsletterDigest: raw.newsletterDigest ?? DEFAULTS.newsletterDigest,
    adminAlerts: raw.adminAlerts ?? DEFAULTS.adminAlerts,
    senderName: raw.senderName ?? DEFAULTS.senderName,
    senderEmail: raw.senderEmail ?? DEFAULTS.senderEmail,
    reminderHoursMin: raw.reminderHoursMin ?? DEFAULTS.reminderHoursMin,
    reminderHoursMax: raw.reminderHoursMax ?? DEFAULTS.reminderHoursMax,
  };
}

export function isEventEnabled(
  settings: EmailSettings,
  event: "donation" | "recurring_reminder" | "newsletter" | "admin_alert"
): boolean {
  switch (event) {
    case "donation":
      return settings.donationConfirmation;
    case "recurring_reminder":
      return settings.recurringReminders;
    case "newsletter":
      return settings.newsletterDigest;
    case "admin_alert":
      return settings.adminAlerts;
    default:
      return true;
  }
}
