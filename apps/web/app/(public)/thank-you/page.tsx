"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Share2,
  Download,
  Heart,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { statTotalClass } from "@/lib/home-buttons";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";
import { pushDonationEvent } from "@/lib/analytics/push-donation-event";
import { shouldFirePurchase } from "@/lib/analytics/purchase-dedupe";
import { parseThankYouParams } from "@/lib/analytics/thank-you-params";
import { USE_MOCK_DATA } from "@/lib/config";
import ShareSheet from "@/components/sharing/ShareSheet";

export default function ThankYouPage() {
  const params = useSearchParams();
  const analytics = parseThankYouParams(params);
  const amount = analytics.amount;
  const currency = (analytics.currency as CurrencyCode) || "GBP";
  const frequency = analytics.frequency;
  const giftAid = analytics.giftAid === "true";
  const donationId = analytics.donationId || "";
  const receiptNumber = analytics.receiptNumber || "";
  const commitmentTotal = analytics.commitmentTotal;
  const installmentCount = analytics.installmentCount;
  const installmentAmount = analytics.installmentAmount;
  const isRamadanSplit = frequency === "ramadan_split";
  const isGuestParam = params.get("guest") === "1";
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const isGuest = isGuestParam || hasSession === false;
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/donate`);
    setHasSession(!!localStorage.getItem("user_token"));
  }, []);

  useEffect(() => {
    const transactionId = donationId || receiptNumber;
    if (!transactionId || !shouldFirePurchase(transactionId)) return;

    void pushDonationEvent(
      "purchase",
      {
        appealId: analytics.campaignSlug,
        appealName: analytics.campaignName,
        category: analytics.category,
        donationType: analytics.donationType,
        amount: Number(amount) || 0,
        currency,
        frequency,
        giftAid,
        paymentType: analytics.paymentType,
        firstName: analytics.firstName,
        lastName: analytics.lastName,
        email: analytics.email,
        phone: analytics.phone,
      },
      { transaction_id: transactionId }
    );
  }, [
    donationId,
    receiptNumber,
    amount,
    currency,
    frequency,
    giftAid,
    analytics.campaignSlug,
    analytics.campaignName,
    analytics.category,
    analytics.donationType,
    analytics.paymentType,
    analytics.firstName,
    analytics.lastName,
    analytics.email,
    analytics.phone,
  ]);

  const currencyInfo = CURRENCIES[currency] || CURRENCIES.GBP;
  const giftAidAmount = giftAid ? (Number(amount) * 0.25).toFixed(2) : "0";
  const total = giftAid
    ? (Number(amount) + Number(amount) * 0.25).toFixed(2)
    : Number(amount).toFixed(2);

  const shareText = useMemo(
    () =>
      `I just donated ${currencyInfo.symbol}${total} to make a difference! Join me and support this amazing cause.`,
    [currencyInfo.symbol, total]
  );

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
          {isGuest && (
            <p className="text-muted-foreground mt-2 text-sm">
              A receipt has been sent to your email
              {analytics.email ? (
                <>
                  {" "}
                  at <strong className="text-foreground">{analytics.email}</strong>
                </>
              ) : null}
              .
            </p>
          )}
        </div>

        {/* Donation summary */}
        <div
          className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift mx-auto max-w-md animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-xs uppercase tracking-widest text-accent font-bold">
            Donation Summary
          </p>
          <p className={`${statTotalClass} mt-2`}>
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
              Frequency:{" "}
              {isRamadanSplit
                ? `Ramadan split (${installmentCount ?? "?"} nights)`
                : frequency === "single"
                  ? "One-time"
                  : frequency}
            </p>
            {isRamadanSplit && commitmentTotal && (
              <p>
                Total pledge: {currencyInfo.symbol}
                {Number(commitmentTotal).toFixed(2)} ({currencyInfo.symbol}
                {installmentAmount ?? amount} × {installmentCount} nights)
              </p>
            )}
            {isRamadanSplit && (
              <p className="text-xs opacity-90">
                You paid night 1 today. Remaining nights are charged automatically on each scheduled
                date.
              </p>
            )}
            {analytics.campaignName && <p>Campaign: {analytics.campaignName}</p>}
          </div>
        </div>

        {/* Social share */}
        <div className="animate-fade-up" style={{ animationDelay: "0.45s" }}>
          <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 mb-4">
            <Share2 className="w-4 h-4" /> Share your generosity &amp; inspire others
          </p>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-full gap-2 px-8"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share your donation
          </Button>
          <ShareSheet
            open={shareOpen}
            onOpenChange={setShareOpen}
            title="Share your impact"
            description="Thank you for giving — help others discover this cause without leaving this page."
            shareText={shareText}
            shareUrl={shareUrl || "/donate"}
          />
        </div>

        {/* Actions */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "0.6s" }}
        >
          {!isGuest && donationId && !USE_MOCK_DATA ? (
            <Button asChild variant="outline" size="lg" className="rounded-full gap-2">
              <Link href={`/account/receipt/${donationId}`}>
                <Download className="w-4 h-4" /> View Receipt
              </Link>
            </Button>
          ) : !isGuest ? (
            <Button variant="outline" size="lg" className="rounded-full gap-2" disabled>
              <Download className="w-4 h-4" /> View Receipt
            </Button>
          ) : null}
          {isGuest ? (
            <Button asChild variant="default" size="lg" className="rounded-full gap-2">
              <Link href="/auth/login">
                <UserPlus className="w-4 h-4" /> Create an account to track donations
              </Link>
            </Button>
          ) : (
            <Button asChild variant="default" size="lg" className="rounded-full gap-2">
              <Link href="/account">
                <UserPlus className="w-4 h-4" /> View My Dashboard
              </Link>
            </Button>
          )}
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
