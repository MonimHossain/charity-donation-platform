"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney, normalizeCurrencyCode } from "@/lib/currency";
import { DONATION_STATUS_STYLES, type ReceiptData } from "@/lib/payment-utils";
import { cn, imageAltFromSrc } from "@/lib/utils";

function getTransactionId(receipt: ReceiptData): string {
  return receipt.donationId || receipt.receiptNumber || "—";
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
    const res = await fetch(absolute);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function DonationReceiptView({ receipt }: { receipt: ReceiptData }) {
  const [downloading, setDownloading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/images/logo-transparent.png");
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

  useEffect(() => {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/cms/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => undefined);
  }, []);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const filename = `donation-receipt-${transactionId}.pdf`;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const cardW = pageWidth - margin * 2;
      const innerX = margin + 8;
      const innerW = cardW - 16;

      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, 30, cardW, 200, 3, 3, "S");

      const logoData = await loadImageDataUrl(logoUrl);
      const headerY = 38;
      if (logoData) {
        try {
          pdf.addImage(logoData, "PNG", innerX, headerY, 28, 11);
        } catch {
          /* skip */
        }
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(91, 33, 182);
      pdf.text("DONATION RECEIPT", innerX + innerW, headerY + 4, { align: "right" });

      let y = headerY + 18;
      pdf.setFontSize(16);
      pdf.setTextColor(91, 33, 182);
      pdf.text(receipt.receiptNumber || "Receipt", innerX, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(dateLabel, innerX, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.text(`Transaction ID: ${transactionId}`, innerX, y);

      y += 8;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(innerX, y, innerX + innerW, y);
      y += 8;

      const colMid = innerX + innerW / 2;
      pdf.setFontSize(7);
      pdf.text("DONOR", innerX, y);
      pdf.text("STATUS", colMid, y);
      y += 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.text(receipt.donorName || "—", innerX, y);
      pdf.setTextColor(22, 101, 52);
      pdf.setFontSize(9);
      const statusLabel = receipt.status
        ? receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)
        : "—";
      pdf.text(statusLabel, colMid, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(receipt.donorEmail || "—", innerX, y);

      y += 8;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(innerX, y, innerX + innerW, y);
      y += 8;

      const amount = formatMoney(Number(receipt.amount || 0), { from: currency, code: currency });
      const total = formatMoney(Number(receipt.totalAmount ?? receipt.amount ?? 0), {
        from: currency,
        code: currency,
      });
      const details: Array<[string, string]> = [
        ["Campaign", receipt.campaignTitle || "General"],
        ["Frequency", receipt.frequency || "single"],
        ["Payment method", receipt.paymentMethod || "—"],
        ["Donation amount", amount],
      ];
      if (receipt.giftAid && Number(receipt.giftAidAmount) > 0) {
        details.push([
          "Gift Aid (25%)",
          `+${formatMoney(Number(receipt.giftAidAmount || 0), { from: currency, code: currency })}`,
        ]);
      }

      for (const [label, value] of details) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(label, innerX, y);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        pdf.text(value, innerX + innerW, y, { align: "right" });
        y += 7;
      }

      y += 4;
      pdf.setFillColor(245, 243, 255);
      pdf.roundedRect(innerX, y - 4, innerW, 14, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(91, 33, 182);
      pdf.text("Total", innerX + 3, y + 4);
      pdf.setFontSize(14);
      pdf.text(total, innerX + innerW - 3, y + 4, { align: "right" });

      y += 18;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const footer =
        "Thank you for your generous support. This receipt confirms your donation. Please retain it for your records." +
        (receipt.giftAid ? " Gift Aid has been claimed where applicable." : "");
      const footerLines = pdf.splitTextToSize(footer, innerW);
      pdf.text(footerLines, innerX + innerW / 2, y, { align: "center" });

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
          <div className="flex items-start justify-between gap-4">
            <img
              src={logoUrl.startsWith("http") ? logoUrl : logoUrl}
              alt={imageAltFromSrc(logoUrl)}
              className="h-9 w-auto max-w-[6.5rem] object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo-transparent.png";
              }}
            />
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold shrink-0">
              Donation receipt
            </p>
          </div>
          <h2 className="font-serif text-2xl text-primary mt-4">
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
