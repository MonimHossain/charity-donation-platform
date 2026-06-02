"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gift,
  Heart,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/currency";
import {
  createAutomatedSchedule,
  createDonation,
  createStripePaymentIntent,
  fetchPaymentsConfig,
  initPayTabsPayment,
  initTelrPayment,
} from "@/lib/api";
import { StripeCheckoutForm } from "@/components/payments/StripeCheckoutForm";
import { PayPalCheckoutButton } from "@/components/payments/PayPalCheckoutButton";
import { clearDonationCart, useDonationCart } from "@/lib/stores/donationCartStore";

type GatewayId = "stripe" | "paypal" | "telr" | "paytabs";

const GATEWAY_LABELS: Record<GatewayId, string> = {
  stripe: "Card",
  paypal: "PayPal",
  telr: "Telr",
  paytabs: "PayTabs",
};

const DEDICATION_TYPES = [
  "In honour of",
  "In memory of",
  "On behalf of",
  "As a gift to",
];

function DonationCheckoutContent() {
  const router = useRouter();
  const { items, subtotal, currency, removeItem, clear } = useDonationCart();

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [giftAid, setGiftAid] = useState(false);
  const [showDedication, setShowDedication] = useState(false);
  const [dedicationType, setDedicationType] = useState(DEDICATION_TYPES[2]);
  const [dedicationName, setDedicationName] = useState("");
  const [dedicationEmail, setDedicationEmail] = useState("");
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [availableGateways, setAvailableGateways] = useState<GatewayId[]>(["stripe"]);
  const [selectedGateway, setSelectedGateway] = useState<GatewayId>("stripe");
  const [paymentPublicKeys, setPaymentPublicKeys] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);

  const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES] ?? CURRENCIES.GBP;
  const giftAidExtra = useMemo(
    () => (giftAid && currency === "GBP" ? +(subtotal * 0.25).toFixed(2) : 0),
    [giftAid, subtotal, currency]
  );
  const totalWithGiftAid = subtotal + giftAidExtra;

  useEffect(() => {
    fetchPaymentsConfig()
      .then((cfg) => {
        const ids = (cfg.availableProviders || ["stripe"]) as GatewayId[];
        setAvailableGateways(ids.length ? ids : ["stripe"]);
        setSelectedGateway(ids[0] || "stripe");
        const keys: Record<string, string> = {};
        cfg.providers?.forEach((p: { id: string; publicKey?: string }) => {
          if (p.publicKey) keys[p.id] = p.publicKey;
        });
        setPaymentPublicKeys(keys);
      })
      .catch(() => setAvailableGateways(["stripe"]));
  }, []);

  const stripePublishableKey =
    paymentPublicKeys.stripe || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const paypalClientId =
    paymentPublicKeys.paypal || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const redirectToThankYou = (donationId?: string) => {
    clear();
    const summaryParams = new URLSearchParams({
      amount: subtotal.toString(),
      currency,
      frequency: "single",
      giftAid: giftAid.toString(),
    });
    if (donationId) summaryParams.set("donationId", donationId);
    router.push(`/thank-you?${summaryParams.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || stripeClientSecret) return;

    setSubmitting(true);
    setPaymentError("");
    try {
      for (const line of items) {
        if (line.kind === "ramadan_split" && line.ramadan) {
          const r = line.ramadan;
          const startDate =
            r.ramadanStartDate ?? r.startDate ?? r.selectedDates?.[0] ?? new Date().toISOString().slice(0, 10);
          const installments =
            r.recurringPlan?.installments ??
            (r.selectedDates ?? []).map((date, i) => ({
              id: `inst-${date}`,
              scheduledDate: date,
              amount: r.dailyBreakdown[i] ?? 0,
              weight: r.weights[i] ?? 1,
              currency: line.currency,
              status: "pending",
            }));

          await createAutomatedSchedule({
            donorName,
            donorEmail,
            donorPhone: donorPhone || undefined,
            campaignId: r.campaignId || line.campaignId,
            totalAmount: line.amount,
            startDate,
            dailyBreakdown: r.dailyBreakdown,
            installments,
            recurringPlanId: r.recurringPlan?.id,
            currency: line.currency,
            notes: r.notes || `Ramadan split (${r.nights} nights)`,
          });
        }
      }

      const cartSummary = items.map((i) => i.description).join("; ");
      const primary = items[0];
      const donation = await createDonation({
        amount: subtotal,
        currency,
        frequency: "single",
        giftAid,
        donationType: primary?.donationType || primary?.category || "general",
        paymentMethod: selectedGateway,
        donorName,
        donorEmail,
        donorPhone: donorPhone || undefined,
        campaignId: primary?.campaignId,
        quantity: 1,
        unitPrice: subtotal,
        message: `Donation cart: ${cartSummary}`,
        dedication:
          showDedication && dedicationName.trim()
            ? {
                type: dedicationType,
                recipientName: dedicationName.trim(),
                recipientEmail: dedicationEmail.trim() || undefined,
                personalMessage: dedicationMessage.trim() || undefined,
              }
            : undefined,
      });

      const donationId = donation.id as string;
      const chargeAmount = giftAid ? totalWithGiftAid : subtotal;

      if (selectedGateway === "telr") {
        const { redirectUrl } = await initTelrPayment({
          donationId,
          amount: chargeAmount,
          currency,
        });
        window.location.href = redirectUrl;
        return;
      }

      if (selectedGateway === "paytabs") {
        const { redirectUrl } = await initPayTabsPayment({
          donationId,
          amount: chargeAmount,
          currency,
        });
        window.location.href = redirectUrl;
        return;
      }

      if (selectedGateway === "stripe") {
        const { clientSecret } = await createStripePaymentIntent({
          amount: chargeAmount,
          currency,
          donationId,
        });
        setPendingDonationId(donationId);
        setStripeClientSecret(clientSecret);
        setSubmitting(false);
        return;
      }

      if (selectedGateway === "paypal") {
        setPendingDonationId(donationId);
        setShowPayPal(true);
        setSubmitting(false);
        return;
      }
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : "Payment could not be started");
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <section className="container-wide py-20 text-center space-y-6">
        <h1 className="font-serif text-3xl text-primary">Your cart is empty</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Add a donation from any donation page, then return here to complete checkout.
        </p>
        <Button asChild className="rounded-full bg-accent hover:bg-accent/90">
          <Link href="/">Browse donation pages</Link>
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="bg-secondary/40 border-b border-border">
        <div className="container-wide py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Continue giving
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Registered Charity
            </span>
          </div>
        </div>
      </section>

      <section className="container-wide py-8 lg:py-12 grid lg:grid-cols-12 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-2">
            <h1 className="font-serif text-2xl md:text-3xl text-primary">Place your donation</h1>
            <p className="text-sm text-muted-foreground">
              Your amount and giving type are already set. Enter your details and pay below.
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-6">
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Your details</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="donor-name" className="text-xs">
                  Full name *
                </Label>
                <Input
                  id="donor-name"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="donor-email" className="text-xs">
                  Email (for receipt) *
                </Label>
                <Input
                  id="donor-email"
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                  placeholder="you@email.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="donor-phone" className="text-xs">
                Phone (optional)
              </Label>
              <Input
                id="donor-phone"
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                className="mt-1 h-12 rounded-xl"
                placeholder="+44 7700 900000"
              />
            </div>

            {currency === "GBP" && (
              <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={giftAid}
                  onChange={(e) => setGiftAid(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I am a UK taxpayer and would like to claim Gift Aid on this donation (+25%).
                </span>
              </label>
            )}
          </div>

          <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDedication(!showDedication)}
              className="w-full p-6 lg:px-8 flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold">Donate on behalf of someone</span>
              </span>
              {showDedication ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {showDedication && (
              <div className="px-6 pb-6 lg:px-8 space-y-4 border-t border-border">
                <div>
                  <Label className="text-xs">Dedication type</Label>
                  <select
                    value={dedicationType}
                    onChange={(e) => setDedicationType(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {DEDICATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ded-name" className="text-xs">
                      Recipient name
                    </Label>
                    <Input
                      id="ded-name"
                      value={dedicationName}
                      onChange={(e) => setDedicationName(e.target.value)}
                      className="mt-1 rounded-xl h-10"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ded-email" className="text-xs">
                      Recipient email (optional)
                    </Label>
                    <Input
                      id="ded-email"
                      type="email"
                      value={dedicationEmail}
                      onChange={(e) => setDedicationEmail(e.target.value)}
                      className="mt-1 rounded-xl h-10"
                      placeholder="john@email.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ded-msg" className="text-xs">
                    Personal message (optional)
                  </Label>
                  <textarea
                    id="ded-msg"
                    value={dedicationMessage}
                    onChange={(e) => setDedicationMessage(e.target.value)}
                    rows={3}
                    className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    placeholder="Write a heartfelt message..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-5">
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Payment method</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {availableGateways.map((gw) => (
                <button
                  key={gw}
                  type="button"
                  onClick={() => {
                    setSelectedGateway(gw);
                    setStripeClientSecret(null);
                    setShowPayPal(false);
                    setPendingDonationId(null);
                  }}
                  disabled={!!stripeClientSecret || showPayPal}
                  className={cn(
                    "h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all border-2 capitalize",
                    selectedGateway === gw
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {gw === "stripe" && <CreditCard className="w-5 h-5" />}
                  {GATEWAY_LABELS[gw]}
                </button>
              ))}
            </div>

            {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

            {stripeClientSecret && stripePublishableKey && pendingDonationId && (
              <StripeCheckoutForm
                publishableKey={stripePublishableKey}
                clientSecret={stripeClientSecret}
                donationId={pendingDonationId}
                onSuccess={() => redirectToThankYou(pendingDonationId)}
                onError={(msg) => setPaymentError(msg)}
              />
            )}

            {showPayPal && paypalClientId && pendingDonationId && (
              <PayPalCheckoutButton
                clientId={paypalClientId}
                amount={giftAid ? totalWithGiftAid : subtotal}
                currency={currency}
                donationId={pendingDonationId}
                onSuccess={() => redirectToThankYou(pendingDonationId)}
                onError={(msg) => setPaymentError(msg)}
              />
            )}

            <Button
              type="submit"
              disabled={
                submitting ||
                !donorName ||
                !donorEmail ||
                availableGateways.length === 0 ||
                !!stripeClientSecret ||
                showPayPal
              }
              size="lg"
              className="w-full rounded-full text-base bg-accent text-accent-foreground hover:bg-accent/90 h-14"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" /> Pay {currencyInfo.symbol}
                  {totalWithGiftAid.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-4">
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-4">
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Your cart</p>
            <ul className="space-y-3">
              {items.map((line) => (
                <li
                  key={line.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{line.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{line.description}</p>
                    <p className="text-sm font-bold text-accent-deep mt-1 tabular-nums">
                      {currencyInfo.symbol}
                      {Number(line.amount).toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {showDedication && dedicationName.trim() && (
            <div className="rounded-2xl bg-card border border-border p-5 text-sm">
              <p className="font-semibold text-primary flex items-center gap-2">
                <Gift className="w-4 h-4" /> {dedicationType}
              </p>
              <p className="text-muted-foreground mt-1">{dedicationName}</p>
              {dedicationMessage.trim() && (
                <p className="text-muted-foreground mt-1 italic">&ldquo;{dedicationMessage}&rdquo;</p>
              )}
            </div>
          )}

          <div className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift">
            <p className="text-xs uppercase tracking-widest text-accent font-bold">Total · {currency}</p>
            <p className="font-serif text-5xl mt-1 tabular-nums">
              {currencyInfo.symbol}
              {totalWithGiftAid.toFixed(2)}
            </p>
            {giftAid && (
              <p className="text-sm text-primary-foreground/75 mt-1">
                Includes Gift Aid +{currencyInfo.symbol}
                {giftAidExtra.toFixed(2)}
              </p>
            )}
            <div className="mt-6 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                {items.length} item{items.length === 1 ? "" : "s"} in your cart
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                100% donation policy on Zakat
              </p>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

export default function DonationCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container-wide py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DonationCheckoutContent />
    </Suspense>
  );
}
