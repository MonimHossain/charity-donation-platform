"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";
import { DONATION_STATUS_STYLES, type ReceiptData } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";

function getTransactionId(receipt: ReceiptData): string {
  return receipt.donationId || receipt.receiptNumber || "—";
}

function buildReceiptPdf(receipt: ReceiptData, currency: string, dateLabel: string, transactionId: string) {
  const amount = formatMoney(Number(receipt.amount || 0), { from: currency, code: currency });
  const total = formatMoney(Number(receipt.totalAmount ?? receipt.amount ?? 0), {
    from: currency,
    code: currency,
  });

  const lines: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: "Receipt number", value: receipt.receiptNumber || "—" },
    { label: "Date", value: dateLabel },
    { label: "Transaction ID", value: transactionId },
    { label: "Donor", value: receipt.donorName || "—" },
    { label: "Email", value: receipt.donorEmail || "—" },
    { label: "Status", value: receipt.status || "—" },
    { label: "Campaign", value: receipt.campaignTitle || "General" },
    { label: "Frequency", value: receipt.frequency || "single" },
    { label: "Payment method", value: receipt.paymentMethod || "—" },
    { label: "Donation amount", value: amount },
  ];

  if (receipt.giftAid && Number(receipt.giftAidAmount) > 0) {
    lines.push({
      label: "Gift Aid (25%)",
      value: `+${formatMoney(Number(receipt.giftAidAmount || 0), { from: currency, code: currency })}`,
    });
  }

  lines.push({ label: "Total", value: total, bold: true });

  return lines;
}

export default function DonationReceiptView({ receipt }: { receipt: ReceiptData }) {
  const [downloading, setDownloading] = useState(false);
  const currency = normalizeCurrencyCode(receipt.currency);
  const transactionId = getTransactionId(receipt);
  const dateLabel = receipt.date
    ? new Date(receipt.date).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const filename = `donation-receipt-${transactionId}.pdf`;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      let siteName = "Charity Donation Platform";
      let charityReg = "1192710";
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/cms/settings`);
        if (res.ok) {
          const data = await res.json();
          siteName = data.siteName || siteName;
          charityReg = data.charityRegNumber || charityReg;
        }
      } catch {
        /* use defaults */
      }

      const marginLeft = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxValueWidth = pageWidth - marginLeft - 20;

      pdf.setFillColor(91, 33, 182);
      pdf.rect(0, 0, pageWidth, 32, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(siteName, marginLeft, 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(132, 204, 22);
      pdf.text("Official Donation Receipt", marginLeft, 22);

      let y = 44;
      pdf.setTextColor(31, 41, 55);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(receipt.receiptNumber || "Receipt", marginLeft, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Issued ${dateLabel}`, marginLeft, y);
      y += 12;

      const lines = buildReceiptPdf(receipt, currency, dateLabel, transactionId)
        .filter((line) => line.label !== "Receipt number" && line.label !== "Date");

      pdf.setDrawColor(229, 231, 235);
      pdf.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 8;

      for (const line of lines) {
        if (y > 250) {
          pdf.addPage();
          y = 24;
        }

        if (line.bold) {
          pdf.setFillColor(243, 244, 246);
          pdf.roundedRect(marginLeft, y - 5, pageWidth - marginLeft * 2, 14, 2, 2, "F");
        }

        pdf.setFont("helvetica", line.bold ? "bold" : "normal");
        pdf.setFontSize(line.bold ? 12 : 10);
        pdf.setTextColor(line.bold ? 91 : 107, line.bold ? 33 : 114, line.bold ? 182 : 128);

        pdf.text(line.label, marginLeft + 2, y);

        pdf.setFont("helvetica", line.bold ? "bold" : "normal");
        pdf.setTextColor(31, 41, 55);
        const valueLines = pdf.splitTextToSize(line.value, maxValueWidth - 58);
        pdf.text(valueLines, marginLeft + 58, y);
        y += Math.max(8, valueLines.length * 5 + 4);
      }

      y += 6;
      if (y > 265) {
        pdf.addPage();
        y = 24;
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      const footer =
        `Thank you for your generous support. UK Registered Charity No. ${charityReg}. Please retain this receipt for your records.` +
        (receipt.giftAid ? " Gift Aid has been claimed where applicable." : "");
      const footerLines = pdf.splitTextToSize(footer, pageWidth - marginLeft * 2);
      pdf.text(footerLines, marginLeft, y, { align: "center" });

      pdf.save(filename);
    } catch (error) {
      console.error("Receipt download failed:", error);
      toast.error("Could not download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Downloading..." : "Download receipt"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
            Donation receipt
          </p>
          <h2 className="font-serif text-2xl text-primary mt-1">
            {receipt.receiptNumber || "Receipt"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{dateLabel}</p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Transaction ID: {transactionId}
          </p>
        </div>

        <div className="border-t border-border pt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Donor</p>
            <p className="font-medium mt-1">{receipt.donorName || "—"}</p>
            <p className="text-sm text-muted-foreground">{receipt.donorEmail || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <span
              className={cn(
                "inline-flex mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                DONATION_STATUS_STYLES[receipt.status || ""] || "bg-secondary text-secondary-foreground"
              )}
            >
              {receipt.status || "—"}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium text-right">{receipt.campaignTitle || "General"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-medium capitalize">{receipt.frequency || "single"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment method</span>
            <span className="font-medium capitalize">{receipt.paymentMethod || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Donation amount</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(Number(receipt.amount || 0), { from: currency, code: currency })}
            </span>
          </div>
          {receipt.giftAid && Number(receipt.giftAidAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gift Aid (25%)</span>
              <span className="font-semibold tabular-nums text-accent-deep">
                +{formatMoney(Number(receipt.giftAidAmount || 0), { from: currency, code: currency })}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-4 flex justify-between items-center">
          <span className="font-semibold text-primary">Total</span>
          <span className="font-serif text-2xl font-bold text-primary tabular-nums">
            {formatMoney(Number(receipt.totalAmount ?? receipt.amount ?? 0), {
              from: currency,
              code: currency,
            })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Thank you for your generous support. This receipt confirms your donation. Please retain
          it for your records.
          {receipt.giftAid ? " Gift Aid has been claimed where applicable." : ""}
        </p>
      </div>
    </div>
  );
}
