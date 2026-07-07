import type { DataSource } from "typeorm";
import { EmailTemplate } from "../../components/email/emailTemplate.entity.js";

const WRAPPER = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">${body}<p style="color:#666;font-size:12px;margin-top:24px;">{{appUrl}}</p></div>`;

export const SEED_EMAIL_TEMPLATES: Array<{
  key: string;
  name: string;
  category: "transactional" | "marketing" | "admin";
  subject: string;
  preheader?: string;
  htmlBody: string;
  mergeTags: string[];
}> = [
  {
    key: "donation_receipt",
    name: "Donation Receipt",
    category: "transactional",
    subject: "Donation receipt — {{receiptNumber}}",
    preheader: "Thank you for your generous gift",
    mergeTags: [
      "donorName",
      "donorEmail",
      "amount",
      "totalAmount",
      "receiptNumber",
      "campaignTitle",
      "giftAid",
      "receiptUrl",
      "appUrl",
    ],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">Thank you for your donation</h1>
      <p>Dear {{donorName}},</p>
      <p>We have received your generous gift. Your PDF receipt is attached.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Receipt</strong></td><td>{{receiptNumber}}</td></tr>
        <tr><td><strong>Amount</strong></td><td>{{totalAmount}}</td></tr>
        <tr><td><strong>Campaign</strong></td><td>{{campaignTitle}}</td></tr>
        <tr><td><strong>Gift Aid</strong></td><td>{{giftAid}}</td></tr>
      </table>
      <p><a href="{{receiptUrl}}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">View confirmation</a></p>
    `),
  },
  {
    key: "welcome_registration",
    name: "Welcome Registration",
    category: "transactional",
    subject: "Welcome to our charity platform",
    preheader: "Your account is ready",
    mergeTags: ["donorName", "donorEmail", "accountUrl", "appUrl"],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">Welcome, {{donorName}}!</h1>
      <p>Thank you for registering. Your account is ready to use.</p>
      <p><a href="{{accountUrl}}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">Go to my account</a></p>
    `),
  },
  {
    key: "recurring_payment_reminder",
    name: "Recurring Payment Reminder",
    category: "transactional",
    subject: "Reminder: upcoming donation of {{amount}}",
    preheader: "Your recurring gift is scheduled soon",
    mergeTags: ["donorName", "amount", "chargeDate", "recurringUrl", "appUrl"],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">Upcoming recurring payment</h1>
      <p>Dear {{donorName}},</p>
      <p>This is a friendly reminder that your recurring donation of <strong>{{amount}}</strong> is scheduled for <strong>{{chargeDate}}</strong>.</p>
      <p><a href="{{recurringUrl}}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">Manage recurring donations</a></p>
    `),
  },
  {
    key: "payment_failed",
    name: "Payment Failed",
    category: "transactional",
    subject: "Action needed: payment failed",
    preheader: "Please update your payment details",
    mergeTags: ["donorName", "amount", "recurringUrl", "checkoutUrl", "appUrl"],
    htmlBody: WRAPPER(`
      <h1 style="color:#c0392b;">Payment failed</h1>
      <p>Dear {{donorName}},</p>
      <p>We could not process your payment of <strong>{{amount}}</strong>.</p>
      <p>Please update your payment method or try again.</p>
      <p><a href="{{recurringUrl}}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;margin-right:8px;">Manage recurring</a>
      <a href="{{checkoutUrl}}" style="display:inline-block;padding:12px 24px;background:#555;color:#fff;text-decoration:none;border-radius:8px;">Donate again</a></p>
    `),
  },
  {
    key: "newsletter_monthly",
    name: "Monthly Newsletter",
    category: "marketing",
    subject: "Monthly update from our team",
    preheader: "See the impact you helped create",
    mergeTags: ["donorName", "donorEmail", "unsubscribeUrl", "appUrl"],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">Monthly update</h1>
      <p>Dear {{donorName}},</p>
      <p>Here is your monthly update on our work and the difference your support makes.</p>
      <p style="text-align:center;"><img src="{{appUrl}}/images/newsletter-hero.jpg" alt="Impact" style="max-width:100%;border-radius:8px;" /></p>
      <p>Thank you for being part of our community.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    `),
  },
  {
    key: "annual_donation_summary",
    name: "Annual Donation Summary",
    category: "marketing",
    subject: "Your donation summary — {{dateRange}}",
    preheader: "Thank you for your continued support",
    mergeTags: [
      "donorName",
      "annualTotal",
      "donationCount",
      "dateRange",
      "accountUrl",
      "appUrl",
    ],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">Your donation summary</h1>
      <p>Dear {{donorName}},</p>
      <p>Between <strong>{{dateRange}}</strong> you donated <strong>{{annualTotal}}</strong> across <strong>{{donationCount}}</strong> gift(s). Thank you!</p>
      <p><a href="{{accountUrl}}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">View donation history</a></p>
    `),
  },
  {
    key: "admin_new_donation",
    name: "Admin — New Donation",
    category: "admin",
    subject: "New donation: {{totalAmount}} from {{donorName}}",
    mergeTags: ["donorName", "totalAmount", "campaignTitle", "adminDashboardUrl"],
    htmlBody: WRAPPER(`
      <p><strong>New donation received</strong></p>
      <p>{{donorName}} donated {{totalAmount}} to {{campaignTitle}}.</p>
    `),
  },
  {
    key: "admin_new_registration",
    name: "Admin — New Registration",
    category: "admin",
    subject: "New user registered: {{donorName}}",
    mergeTags: ["donorName", "donorEmail", "adminDashboardUrl"],
    htmlBody: WRAPPER(`
      <p><strong>New user registered</strong></p>
      <p>{{donorName}} ({{donorEmail}}) has created an account.</p>
    `),
  },
  {
    key: "admin_payment_failed",
    name: "Admin — Payment Failed",
    category: "admin",
    subject: "Payment failed for {{donorName}}",
    mergeTags: ["donorName", "amount", "adminDashboardUrl"],
    htmlBody: WRAPPER(`
      <p><strong>Payment failed</strong></p>
      <p>Payment of {{amount}} failed for {{donorName}}.</p>
    `),
  },
  {
    key: "admin_general_alert",
    name: "Admin — General Alert",
    category: "admin",
    subject: "{{alertTitle}}",
    mergeTags: ["alertTitle", "alertBody", "donorName", "adminDashboardUrl", "appUrl"],
    htmlBody: WRAPPER(`
      <h1 style="color:#1a3d2e;">{{alertTitle}}</h1>
      <p>{{alertBody}}</p>
    `),
  },
];

export async function seedEmailTemplates(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(EmailTemplate);

  for (const tpl of SEED_EMAIL_TEMPLATES) {
    const existing = await repo.findOne({ where: { key: tpl.key } });
    if (existing) {
      existing.name = tpl.name;
      existing.category = tpl.category;
      existing.mergeTags = tpl.mergeTags;
      existing.isSystem = true;
      if (!existing.htmlBody || existing.htmlBody.length < 20) {
        existing.subject = tpl.subject;
        existing.preheader = tpl.preheader;
        existing.htmlBody = tpl.htmlBody;
      }
      await repo.save(existing);
    } else {
      const row = repo.create({ ...tpl, isSystem: true, isActive: true });
      await repo.save(row);
    }
  }

  console.log("Email templates seeded.");
}
