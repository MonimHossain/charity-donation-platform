import nodemailer from "nodemailer";
import type { Donation } from "../components/donation/donation.entity.js";
import type { RecurringDonation } from "../components/recurringDonation/recurringDonation.entity.js";

function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === "true" || process.env.EMAIL_ENABLED === "1";
}

export { isEmailEnabled };

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP not configured");
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function fromAddress(): string {
  const name = process.env.SMTP_FROM_NAME || "Charity Platform";
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@localhost";
  return `"${name}" <${email}>`;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}): Promise<void> {
  if (!isEmailEnabled()) {
    console.info("[mailer] Skipped (EMAIL_ENABLED is not true):", options.subject, "→", options.to);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: fromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, " "),
      attachments: options.attachments,
    });
  } catch (err) {
    console.error("[mailer] Send failed:", err);
    throw err;
  }
}

export function donationReceiptEmailHtml(donation: Donation, campaignTitle?: string): string {
  const symbol = donation.currency === "USD" ? "$" : "£";
  const receiptUrl = `${appUrl()}/thank-you?donationId=${donation.id}`;
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #1a3d2e;">Thank you for your donation</h1>
      <p>Dear ${donation.donorName},</p>
      <p>We have received your generous gift. Here is your receipt summary:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td><strong>Receipt</strong></td><td>${donation.receiptNumber || donation.id}</td></tr>
        <tr><td><strong>Amount</strong></td><td>${symbol}${Number(donation.totalAmount).toFixed(2)}</td></tr>
        ${campaignTitle ? `<tr><td><strong>Campaign</strong></td><td>${campaignTitle}</td></tr>` : ""}
        ${donation.giftAid ? `<tr><td><strong>Gift Aid</strong></td><td>Yes — we may claim an extra 25%</td></tr>` : ""}
      </table>
      <p><a href="${receiptUrl}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">View confirmation</a></p>
      <p style="color:#666;font-size:12px;">This email was sent because you completed a donation on our website.</p>
    </div>
  `;
}

export async function sendDonationReceiptEmail(
  donation: Donation,
  campaignTitle?: string
): Promise<void> {
  await sendMail({
    to: donation.donorEmail,
    subject: `Donation receipt — ${donation.receiptNumber || "Thank you"}`,
    html: donationReceiptEmailHtml(donation, campaignTitle),
  });
}

export async function sendRecurringFailedPaymentEmail(recurring: RecurringDonation): Promise<void> {
  const symbol = recurring.currency === "USD" ? "$" : "£";
  await sendMail({
    to: recurring.donorEmail,
    subject: "Action needed: recurring donation payment failed",
    html: `
      <p>Dear ${recurring.donorName},</p>
      <p>We could not process your recurring donation of ${symbol}${Number(recurring.amount).toFixed(2)}.</p>
      <p>Please <a href="${appUrl()}/account/recurring">update your payment method</a> to keep your support active.</p>
    `,
  });
}

export async function sendAccountActivationEmail(
  email: string,
  fullName: string,
  token: string
): Promise<void> {
  const link = `${appUrl()}/auth/activate?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email,
    subject: "Complete your account to continue donating",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #1a3d2e;">Set your password</h1>
        <p>Dear ${fullName},</p>
        <p>Please set a password to continue with your donation. This link expires in 24 hours.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">Set password and continue</a></p>
        <p style="color:#666;font-size:12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  token: string
): Promise<void> {
  const link = `${appUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #1a3d2e;">Reset your password</h1>
        <p>Dear ${fullName},</p>
        <p>We received a request to reset your password. This link expires in 24 hours.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#1a3d2e;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p>
        <p style="color:#666;font-size:12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
