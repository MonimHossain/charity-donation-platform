import "reflect-metadata";
import { DataSource } from "typeorm";
import { ActivityLog } from "../components/activityLog/activityLog.entity.js";
import { Admin } from "../components/admin/admin.entity.js";
import { AuditLog } from "../components/auditLog/auditLog.entity.js";
import { AutomatedDonationSchedule } from "../components/automatedDonation/automatedDonation.entity.js";
import { BlogCategory } from "../components/blog/blogCategory.entity.js";
import { BlogPost } from "../components/blog/blogPost.entity.js";
import { Campaign } from "../components/campaign/campaign.entity.js";
import { ApplyReviewSubmission } from "../components/charity/applyReview.entity.js";
import { Certification } from "../components/charity/certification.entity.js";
import { Charity } from "../components/charity/charity.entity.js";
import { ConcernReport } from "../components/charity/concernReport.entity.js";
import { ContactMessage } from "../components/charity/contactMessage.entity.js";
import { Banner } from "../components/cms/banner.entity.js";
import { Faq } from "../components/cms/faq.entity.js";
import { HeroSlide } from "../components/cms/heroSlide.entity.js";
import { HomepageSection } from "../components/cms/homepageSection.entity.js";
import { MediaLibrary } from "../components/cms/mediaLibrary.entity.js";
import { NavigationMenu } from "../components/cms/navigationMenu.entity.js";
import { PageBlock } from "../components/cms/pageBuilder.entity.js";
import { SeoSettings } from "../components/cms/seoSettings.entity.js";
import { SiteSettings } from "../components/cms/siteSettings.entity.js";
import { Translation } from "../components/cms/translation.entity.js";
import { Donation } from "../components/donation/donation.entity.js";
import { DonationPreset } from "../components/donation/donationPreset.entity.js";
import { QuickDonateOption } from "../components/donation/quickDonateOption.entity.js";
import { QuickDonateSettings } from "../components/donation/quickDonateSettings.entity.js";
import { DonationDedication } from "../components/donationDedication/donationDedication.entity.js";
import { EmailCampaign } from "../components/email/emailCampaign.entity.js";
import { EmailLog } from "../components/email/emailLog.entity.js";
import { EmailTemplate } from "../components/email/emailTemplate.entity.js";
import { RecurringReminderLog } from "../components/email/recurringReminderLog.entity.js";
import { DonationPage } from "../components/donationPage/donationPage.entity.js";
import { Notification } from "../components/notification/notification.entity.js";
import { NewsletterSubscriber } from "../components/newsletter/subscriber.entity.js";
import { PaymentLog } from "../components/paymentLog/paymentLog.entity.js";
import { RecurringDonation } from "../components/recurringDonation/recurringDonation.entity.js";
import { Testimonial } from "../components/testimonial/testimonial.entity.js";
import { Upsell } from "../components/upsell/upsell.entity.js";
import { User } from "../components/user/user.entity.js";
import { ZakatCalculation } from "../components/zakat/zakatCalculation.entity.js";
import { ZakatPage } from "../components/cms/zakatPage.entity.js";

const dbHost = process.env.DB_HOST ?? "localhost";
const dbPort = Number(process.env.DB_PORT ?? 54322);
const dbUser = process.env.DB_USERNAME ?? "admin";
const dbPassword = process.env.DB_PASSWORD ?? "admin123";
const dbName = process.env.DB_DATABASE ?? "charity_platform";
const dbSynchronize = (process.env.DB_SYNCHRONIZE ?? "true").toLowerCase() === "true";
const dbLogging = (process.env.DB_LOGGING ?? "false").toLowerCase() === "true";

const entities = [
  ActivityLog,
  Admin,
  AuditLog,
  AutomatedDonationSchedule,
  BlogCategory,
  BlogPost,
  Campaign,
  ApplyReviewSubmission,
  Certification,
  Charity,
  ConcernReport,
  ContactMessage,
  Banner,
  Faq,
  HeroSlide,
  HomepageSection,
  MediaLibrary,
  NavigationMenu,
  PageBlock,
  SeoSettings,
  SiteSettings,
  Translation,
  Donation,
  DonationPreset,
  QuickDonateOption,
  QuickDonateSettings,
  DonationDedication,
  DonationPage,
  EmailCampaign,
  EmailLog,
  EmailTemplate,
  Notification,
  RecurringReminderLog,
  NewsletterSubscriber,
  PaymentLog,
  RecurringDonation,
  Testimonial,
  Upsell,
  User,
  ZakatCalculation,
  ZakatPage,
];

export const AppDataSource = new DataSource({
  type: "postgres",
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
  synchronize: dbSynchronize,
  logging: dbLogging,
  entities,
  migrations: ["src/migration/**/*.ts"],
  subscribers: [],
});

export const connectDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connection established.");
    }
  } catch (error: any) {
    console.error("Error during Data Source initialization:", error);
    if (error.code === "ECONNREFUSED") {
      console.error("Connection refused. Is PostgreSQL running?");
    }
  }
};
