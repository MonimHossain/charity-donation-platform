"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Share2,
  Facebook,
  Twitter,
  Download,
  Heart,
  UserPlus,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useEffect, useState } from "react";
import { trackEvent } from "@/components/analytics/GTMScript";
import { fetchDonationReceipt } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";

export default function ThankYouPage() {
  const params = useSearchParams();
  const amount = params.get("amount") || "50";
  const currency = (params.get("currency") as CurrencyCode) || "GBP";
  const frequency = params.get("frequency") || "single";
  const giftAid = params.get("giftAid") === "true";
  const campaign = params.get("campaign") || "";
  const donationId = params.get("donationId") || "";
  const receiptNumber = params.get("receiptNumber") || "";
  const [copied, setCopied] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    trackEvent("donation_complete", {
      donation_id: donationId || undefined,
      value: Number(amount) || undefined,
      currency,
      frequency,
      campaign: campaign || undefined,
      gift_aid: giftAid,
    });
  }, [donationId, amount, currency, frequency, campaign, giftAid]);

  const currencyInfo = CURRENCIES[currency] || CURRENCIES.GBP;
  const giftAidAmount = giftAid ? (Number(amount) * 0.25).toFixed(2) : "0";
  const total = giftAid
    ? (Number(amount) + Number(amount) * 0.25).toFixed(2)
    : Number(amount).toFixed(2);

  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/donate" : "";
  const shareText = `I just donated ${currencyInfo.symbol}${amount} to make a difference! Join me and support this amazing cause.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = async () => {
    if (!donationId || USE_MOCK_DATA) return;
    setReceiptLoading(true);
    try {
      const receipt = await fetchDonationReceipt(donationId);
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber || donationId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-glow">
                <CheckCircle2 className="w-10 h-10 text-accent-foreground" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-accent/10 animate-ping" />
          </div>
        </div>

        {/* Heading */}
        <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary text-balance">
            Thank You for Your Generous Donation!
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Your kindness is making a real difference in people&apos;s lives.
          </p>
        </div>

        {/* Donation summary */}
        <div
          className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift mx-auto max-w-md animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-xs uppercase tracking-widest text-accent font-bold">
            Donation Summary
          </p>
          <p className="font-serif text-4xl mt-2 tabular-nums">
            {currencyInfo.symbol}
            {total}
          </p>
          {receiptNumber && (
            <p className="text-xs mt-2 opacity-80 font-mono">Receipt: {receiptNumber}</p>
          )}
          <div className="mt-3 space-y-1 text-sm text-primary-foreground/80">
            <p>
              Donation: {currencyInfo.symbol}
              {Number(amount).toFixed(2)}
            </p>
            {giftAid && (
              <p>
                Gift Aid: +{currencyInfo.symbol}
                {giftAidAmount}
              </p>
            )}
            <p className="capitalize">
              Frequency: {frequency === "single" ? "One-time" : frequency}
            </p>
            {campaign && <p>Campaign: {campaign}</p>}
          </div>
        </div>

        {/* Social share */}
        <div className="animate-fade-up" style={{ animationDelay: "0.45s" }}>
          <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 mb-4">
            <Share2 className="w-4 h-4" /> Share your generosity &amp; inspire others
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Facebook className="w-4 h-4" /> Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Twitter className="w-4 h-4" /> X / Twitter
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "0.6s" }}
        >
          <Button
            variant="outline"
            size="lg"
            className="rounded-full gap-2"
            disabled={!donationId || USE_MOCK_DATA || receiptLoading}
            onClick={handleDownloadReceipt}
          >
            <Download className="w-4 h-4" />{" "}
            {receiptLoading ? "Loading…" : "Download Receipt"}
          </Button>
          <Button asChild variant="default" size="lg" className="rounded-full gap-2">
            <Link href="/auth/register">
              <UserPlus className="w-4 h-4" /> Create an Account
            </Link>
          </Button>
          <Button asChild variant="accent" size="lg" className="rounded-full gap-2">
            <Link href="/donate">
              <Heart className="w-4 h-4" /> Make Another Donation
            </Link>
          </Button>
        </div>

        {/* Related campaigns teaser */}
        <div
          className="pt-8 border-t border-border animate-fade-up"
          style={{ animationDelay: "0.75s" }}
        >
          <h2 className="font-serif text-xl text-primary mb-4">
            Continue Making a Difference
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Gaza Emergency",
                desc: "Urgent relief for families in need",
                href: "/donate?campaign=gaza",
              },
              {
                title: "Orphan Sponsorship",
                desc: "Support a child's future today",
                href: "/donate?campaign=orphans",
              },
              {
                title: "Water Wells",
                desc: "Provide clean water for communities",
                href: "/donate?campaign=water",
              },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="rounded-2xl border border-border p-5 text-left hover:shadow-soft hover:border-primary/30 transition-all group"
              >
                <h3 className="font-semibold text-primary group-hover:text-accent-deep transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
