import PDFDocument from "pdfkit";
import type { Donation } from "../../components/donation/donation.entity.js";

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "£";
}

export async function generateDonationReceiptPdf(
  donation: Donation,
  campaignTitle?: string
): Promise<Buffer> {
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
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#1a3d2e").text("Donation Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).fillColor("#333");

    const rows: Array<[string, string]> = [
      ["Receipt number", receiptNumber],
      ["Date", dateLabel],
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
    rows.push(["Total", fmt(Number(donation.totalAmount))]);

    for (const [label, value] of rows) {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text("Thank you for your generous support.", {
      align: "center",
    });

    doc.end();
  });
}
