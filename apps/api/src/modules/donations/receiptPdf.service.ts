import PDFDocument from "pdfkit";
import type { Donation } from "../../components/donation/donation.entity.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

const BRAND_PURPLE = "#5B21B6";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const TOTAL_BG = "#F5F3FF";

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "£";
}

async function getBranding(): Promise<{
  siteName: string;
  charityRegNumber: string;
  logoUrl?: string;
}> {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    const settings = await repo.findOne({ where: {} });
    return {
      siteName: settings?.siteName || "Charity Donation Platform",
      charityRegNumber: settings?.charityRegNumber || "1192710",
      logoUrl: settings?.logoUrl || undefined,
    };
  } catch {
    return { siteName: "Charity Donation Platform", charityRegNumber: "1192710" };
  }
}

async function fetchLogoBuffer(logoUrl?: string): Promise<Buffer | null> {
  const candidates = [
    logoUrl,
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/images/logo-transparent.png`
      : undefined,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const url = raw.startsWith("http") ? raw : `http://localhost:3001${raw.startsWith("/") ? raw : `/${raw}`}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function generateDonationReceiptPdf(
  donation: Donation,
  campaignTitle?: string,
): Promise<Buffer> {
  const branding = await getBranding();
  const logoBuffer = await fetchLogoBuffer(branding.logoUrl);
  const currency = donation.currency || "GBP";
  const symbol = currencySymbol(currency);
  const fmt = (n: number) => `${symbol}${Number(n).toFixed(2)}`;
  const receiptNumber =
    donation.receiptNumber || `DON-${donation.id.substring(0, 8).toUpperCase()}`;
  const dateLabel = donation.createdAt
    ? new Date(donation.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 40;
    const cardX = margin;
    const cardY = 40;
    const cardW = pageWidth - margin * 2;
    const cardH = 520;

    doc.roundedRect(cardX, cardY, cardW, cardH, 12).lineWidth(1).strokeColor(BORDER).stroke();

    let y = cardY + 24;
    const innerX = cardX + 24;
    const innerW = cardW - 48;

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, innerX, y - 4, { fit: [80, 32] });
      } catch {
        /* skip logo if invalid */
      }
    }

    doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND_PURPLE)
      .text("DONATION RECEIPT", innerX, y, { width: innerW, align: logoBuffer ? "right" : "left" });

    y += 18;
    doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND_PURPLE)
      .text(receiptNumber, innerX, y, { width: innerW });
    y += 22;
    doc.font("Helvetica").fontSize(9).fillColor(TEXT_MUTED).text(dateLabel, innerX, y);
    y += 12;
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED)
      .text(`Transaction ID: ${donation.id}`, innerX, y);

    y += 16;
    doc.moveTo(innerX, y).lineTo(innerX + innerW, y).strokeColor(BORDER).stroke();
    y += 16;

    const colMid = innerX + innerW / 2;
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED).text("DONOR", innerX, y);
    doc.text("STATUS", colMid, y);
    y += 14;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT_DARK)
      .text(donation.donorName || "—", innerX, y, { width: innerW / 2 - 8 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#166534")
      .text((donation.status || "—").charAt(0).toUpperCase() + (donation.status || "—").slice(1), colMid, y);
    y += 14;
    doc.font("Helvetica").fontSize(9).fillColor(TEXT_MUTED)
      .text(donation.donorEmail || "—", innerX, y, { width: innerW / 2 - 8 });

    y += 20;
    doc.moveTo(innerX, y).lineTo(innerX + innerW, y).strokeColor(BORDER).stroke();
    y += 16;

    const detailRows: Array<[string, string]> = [
      ["Campaign", campaignTitle || "General"],
      ["Frequency", donation.frequency || "single"],
      ["Payment method", donation.paymentMethod || "—"],
      ["Donation amount", fmt(Number(donation.amount))],
    ];
    if (donation.giftAid && Number(donation.giftAidAmount) > 0) {
      detailRows.push(["Gift Aid (25%)", `+${fmt(Number(donation.giftAidAmount))}`]);
    }

    for (const [label, value] of detailRows) {
      doc.font("Helvetica").fontSize(9).fillColor(TEXT_MUTED).text(label, innerX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT_DARK)
        .text(value, innerX, y, { width: innerW, align: "right" });
      y += 18;
    }

    y += 8;
    doc.roundedRect(innerX, y, innerW, 36, 8).fill(TOTAL_BG);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND_PURPLE)
      .text("Total", innerX + 12, y + 12);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(BRAND_PURPLE)
      .text(fmt(Number(donation.totalAmount)), innerX + 12, y + 10, { width: innerW - 24, align: "right" });

    y += 52;
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED)
      .text(
        "Thank you for your generous support. This receipt confirms your donation. Please retain it for your records.",
        innerX,
        y,
        { width: innerW, align: "center" },
      );

    if (donation.giftAid) {
      doc.moveDown(0.3);
      doc.text("Gift Aid has been claimed where applicable.", innerX, doc.y, {
        width: innerW,
        align: "center",
      });
    }

    doc.end();
  });
}
