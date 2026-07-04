import PDFDocument from "pdfkit";
import type { Donation } from "../../components/donation/donation.entity.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

const BRAND_PURPLE = "#5B21B6";
const BRAND_GREEN = "#84CC16";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "£";
}

async function getBranding(): Promise<{ siteName: string; charityRegNumber: string }> {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    const settings = await repo.findOne({ where: {} });
    return {
      siteName: settings?.siteName || "Charity Donation Platform",
      charityRegNumber: settings?.charityRegNumber || "1192710",
    };
  } catch {
    return { siteName: "Charity Donation Platform", charityRegNumber: "1192710" };
  }
}

export async function generateDonationReceiptPdf(
  donation: Donation,
  campaignTitle?: string,
): Promise<Buffer> {
  const branding = await getBranding();
  const currency = donation.currency || "GBP";
  const symbol = currencySymbol(currency);
  const fmt = (n: number) => `${symbol}${Number(n).toFixed(2)}`;
  const receiptNumber =
    donation.receiptNumber || `DON-${donation.id.substring(0, 8).toUpperCase()}`;
  const dateLabel = donation.createdAt
    ? new Date(donation.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(0, 0, pageWidth, 100).fill(BRAND_PURPLE);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20)
      .text(branding.siteName, margin, 32, { width: contentWidth });
    doc.font("Helvetica").fontSize(11).fillColor(BRAND_GREEN)
      .text("Official Donation Receipt", margin, 58);

    doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(14)
      .text(receiptNumber, margin, 120);
    doc.font("Helvetica").fontSize(10).fillColor(TEXT_MUTED)
      .text(`Issued ${dateLabel}`, margin, 138);

    const rows: Array<[string, string]> = [
      ["Transaction ID", donation.id],
      ["Donor", donation.donorName || "—"],
      ["Email", donation.donorEmail || "—"],
      ["Status", donation.status || "—"],
      ["Campaign", campaignTitle || "General"],
      ["Frequency", donation.frequency || "single"],
      ["Payment method", donation.paymentMethod || "—"],
      ["Donation amount", fmt(Number(donation.amount))],
    ];

    if (donation.giftAid && Number(donation.giftAidAmount) > 0) {
      rows.push(["Gift Aid (25%)", `+${fmt(Number(donation.giftAidAmount))}`]);
    }

    let y = 165;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor("#E5E7EB").stroke();
    y += 16;

    for (const [label, value] of rows) {
      doc.font("Helvetica").fontSize(10).fillColor(TEXT_MUTED).text(label, margin, y, { width: 140 });
      doc.font("Helvetica").fontSize(10).fillColor(TEXT_DARK).text(value, margin + 145, y, { width: contentWidth - 145 });
      y += 22;
    }

    y += 8;
    doc.roundedRect(margin, y, contentWidth, 44, 6).fill("#F3F4F6");
    doc.font("Helvetica-Bold").fontSize(12).fillColor(BRAND_PURPLE)
      .text("Total paid", margin + 16, y + 14);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT_DARK)
      .text(fmt(Number(donation.totalAmount)), margin + 16, y + 28, { width: contentWidth - 32, align: "right" });

    y += 70;
    doc.font("Helvetica").fontSize(9).fillColor(TEXT_MUTED)
      .text(
        `Thank you for your generous support. UK Registered Charity No. ${branding.charityRegNumber}. Please retain this receipt for your records.`,
        margin,
        y,
        { width: contentWidth, align: "center" },
      );

    if (donation.giftAid) {
      doc.moveDown(0.5);
      doc.text(
        "Gift Aid has been claimed on this donation where applicable.",
        margin,
        doc.y,
        { width: contentWidth, align: "center" },
      );
    }

    doc.end();
  });
}
