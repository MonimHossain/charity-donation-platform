"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gift,
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
import { statTotalClass } from "@/lib/home-buttons";
import { CURRENCIES, convertAmount, normalizeCurrencyCode } from "@/lib/currency";
import {
  createAutomatedSchedule,
  createDonation,
  createRecurringDonation,
  fetchPaymentsConfig,
  getApiErrorMessage,
} from "@/lib/api";
import { isRecurringFrequency, parseStripeRecurringParams, stripeRecurringParamsLabel } from "@/lib/stripe-recurring";
import { StripeCheckoutForm } from "@/components/payments/StripeCheckoutForm";
import { clearDonationCart, useDonationCart } from "@/lib/stores/donationCartStore";
import CheckoutGiftAidStep from "@/components/donation/CheckoutGiftAidStep";
import CheckoutUpsellList from "@/components/donation/CheckoutUpsellList";
import CheckoutStepIndicator, { type CheckoutFlowStep } from "@/components/donation/CheckoutStepIndicator";
import { useCheckoutDonorPrefill } from "@/lib/hooks/useCheckoutDonorPrefill";
import {
  getRamadanInstallmentsFromLine,
  isRamadanSplitCartLine,
  summarizeRamadanCheckout,
} from "@/lib/ramadan-split";
import {
  DEFAULT_CAMPAIGN_CONFIG,
  isGiftAidCheckoutEnabled,
  normalizeCheckoutSettings,
  resolveCheckoutCampaignConfig,
  type CheckoutCampaignConfig,
} from "@/lib/checkout-campaign-config";

const DEDICATION_TYPES = [
  "In honour of",
  "In memory of",
  "On behalf of",
  "As a gift to",
];

function DonationCheckoutContent() {
  const router = useRouter();
  const { items, subtotal, currency, removeItem, clear } = useDonationCart();
  const { prefill, stripeCustomer, loading: donorPrefillLoading } = useCheckoutDonorPrefill();
  const prefillApplied = useRef(false);

  const [campaignConfig, setCampaignConfig] = useState<CheckoutCampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [flowStep, setFlowStep] = useState<CheckoutFlowStep>("details");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorComment, setDonorComment] = useState("");
  const [giftAid, setGiftAid] = useState(false);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<Set<string>>(new Set());
  const [adminSavesLife, setAdminSavesLife] = useState(false);
  const [showDedication, setShowDedication] = useState(false);
  const [dedicationType, setDedicationType] = useState(DEDICATION_TYPES[2]);
  const [dedicationName, setDedicationName] = useState("");
  const [dedicationEmail, setDedicationEmail] = useState("");
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null);
  const [pendingRecurringDonationId, setPendingRecurringDonationId] = useState<string | null>(null);
  const [pendingAutomatedScheduleIds, setPendingAutomatedScheduleIds] = useState<string[]>([]);
  const [monthlyGift, setMonthlyGift] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    if (!prefill || prefillApplied.current) return;
    prefillApplied.current = true;
    setDonorName((prev) => prev || prefill.name);
    setDonorEmail((prev) => prev || prefill.email);
    setDonorPhone((prev) => prev || prefill.phone);
  }, [prefill]);

  const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES] ?? CURRENCIES.GBP;
  const { checkoutSettings, upsells } = campaignConfig;

  const activeUpsells = useMemo(
    () => (checkoutSettings.enableUpsell ? upsells.filter((u) => u.isActive !== false) : []),
    [checkoutSettings.enableUpsell, upsells]
  );

  const cartSelectedUpsellIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      item.selectedUpsellIds?.forEach((id) => ids.add(id));
    }
    return ids;
  }, [items]);

  const checkoutUpsellOptions = useMemo(
    () => activeUpsells.filter((u) => !cartSelectedUpsellIds.has(u.id)),
    [activeUpsells, cartSelectedUpsellIds]
  );

  const cartSelectedUpsells = useMemo(
    () => activeUpsells.filter((u) => cartSelectedUpsellIds.has(u.id)),
    [activeUpsells, cartSelectedUpsellIds]
  );

  const upsellTotal = useMemo(
    () =>
      checkoutUpsellOptions
        .filter((u) => selectedUpsellIds.has(u.id))
        .reduce((sum, u) => sum + Number(u.amount || 0), 0),
    [checkoutUpsellOptions, selectedUpsellIds]
  );

  const adminSavesLifeAmount = useMemo(() => {
    if (!checkoutSettings.enableAdminSavesLife) return 0;
    return Math.max(0, Number(checkoutSettings.adminSavesLifeAmount) || 0);
  }, [checkoutSettings.enableAdminSavesLife, checkoutSettings.adminSavesLifeAmount]);

  const showAdminSavesLife = adminSavesLifeAmount > 0;

  const adminSavesLifeTotal = adminSavesLife && showAdminSavesLife ? adminSavesLifeAmount : 0;

  const ramadanSummary = useMemo(() => summarizeRamadanCheckout(items), [items]);

  const nonRamadanSubtotal = useMemo(
    () =>
      items
        .filter((i) => !isRamadanSplitCartLine(i))
        .reduce(
          (s, i) =>
            s +
            convertAmount(Number(i.amount || 0), normalizeCurrencyCode(i.currency), currency),
          0
        ),
    [items, currency]
  );

  const ramadanCheckoutCharge = useMemo(
    () => ramadanSummary.checkoutChargeAmount,
    [ramadanSummary.checkoutChargeAmount]
  );

  const donationAmount = subtotal + upsellTotal + adminSavesLifeTotal;
  const chargeAmount = nonRamadanSubtotal + upsellTotal + adminSavesLifeTotal + ramadanCheckoutCharge;

  const giftAidBoost =
    giftAid && isGiftAidCheckoutEnabled(checkoutSettings)
      ? +(chargeAmount * 0.25).toFixed(2)
      : 0;
  const charityValue = donationAmount + giftAidBoost;

  const showGiftAidStep = isGiftAidCheckoutEnabled(checkoutSettings);

  const flowSteps = useMemo(() => {
    const steps: Array<{ id: CheckoutFlowStep; label: string }> = [];
    if (showGiftAidStep) steps.push({ id: "gift-aid", label: "Gift Aid" });
    steps.push({ id: "details", label: "Your Details" });
    steps.push({ id: "payment", label: "Donate" });
    return steps;
  }, [showGiftAidStep]);

  const cartConfigKey = useMemo(
    () => items.map((i) => `${i.id}:${i.donationPageSlug}:${i.campaignId}`).join("|"),
    [items]
  );

  useEffect(() => {
    if (!items.length) {
      setCampaignConfig(DEFAULT_CAMPAIGN_CONFIG);
      setConfigLoading(false);
      return;
    }
    let cancelled = false;
    setConfigLoading(true);
    resolveCheckoutCampaignConfig(items)
      .then((config) => {
        if (!cancelled) setCampaignConfig(config);
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cartConfigKey, items]);

  useEffect(() => {
    if (!showAdminSavesLife) setAdminSavesLife(false);
  }, [showAdminSavesLife]);

  useEffect(() => {
    if (configLoading) return;
    setFlowStep(showGiftAidStep ? "gift-aid" : "details");
  }, [showGiftAidStep, configLoading, items[0]?.donationPageSlug]);

  useEffect(() => {
    fetchPaymentsConfig()
      .then((cfg) => {
        const stripeProvider = cfg.providers?.find((p) => p.id === "stripe");
        if (stripeProvider?.publicKey) {
          setStripePublishableKey(stripeProvider.publicKey);
        }
        setStripeReady(Boolean(stripeProvider?.configured && stripeProvider?.enabled));
      })
      .catch(() => setStripeReady(Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)));
  }, []);

  function toggleUpsell(id: string) {
    setSelectedUpsellIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToDetails() {
    setFlowStep("details");
  }

  function goToPayment() {
    if (!donorName.trim() || !donorEmail.trim()) return;
    setFlowStep("payment");
  }

  function goBackFromDetails() {
    if (showGiftAidStep) setFlowStep("gift-aid");
  }

  function goBackFromPayment() {
    setFlowStep("details");
    setPendingDonationId(null);
    setPendingRecurringDonationId(null);
    setPendingAutomatedScheduleIds([]);
    setPaymentError("");
    paymentPrepareAttempted.current = false;
  }

  const checkoutRecurringParams = useMemo(() => {
    const line = items.find((i) => i.recurringFrequency || i.recurringInterval);
    if (!line) return parseStripeRecurringParams("single");

    if (line.recurringInterval) {
      return {
        interval: line.recurringInterval,
        intervalCount: Math.max(1, Number(line.recurringIntervalCount ?? 1)),
        ...(line.recurringCancelAt ? { cancelAt: line.recurringCancelAt } : {}),
      };
    }

    const params = parseStripeRecurringParams(line.recurringFrequency ?? "single");
    if (line.recurringCancelAt) {
      params.cancelAt = line.recurringCancelAt;
    }
    return params;
  }, [items]);

  const checkoutFrequency = useMemo(() => {
    const line = items.find((i) => i.recurringFrequency || i.recurringInterval);
    if (line?.recurringFrequency) return line.recurringFrequency;
    if (line?.recurringInterval) {
      const count = Math.max(1, Number(line.recurringIntervalCount ?? 1));
      if (count === 1) {
        if (line.recurringInterval === "day") return "daily";
        if (line.recurringInterval === "week") return "weekly";
        if (line.recurringInterval === "year") return "yearly";
        return "monthly";
      }
      return `custom:${count}:${line.recurringInterval}`;
    }
    return monthlyGift ? "monthly" : "single";
  }, [items, monthlyGift]);

  const checkoutRecurrenceLabel = useMemo(
    () => stripeRecurringParamsLabel(checkoutRecurringParams),
    [checkoutRecurringParams]
  );

  const isCartRecurring = isRecurringFrequency(checkoutFrequency);

  const stripePaymentMode = useMemo((): "payment" | "setup" => {
    if (
      ramadanSummary.hasRamadanSplit &&
      pendingAutomatedScheduleIds.length > 0 &&
      ramadanSummary.checkoutChargeAmount <= 0
    ) {
      return "setup";
    }
    return "payment";
  }, [
    pendingAutomatedScheduleIds.length,
    ramadanSummary.checkoutChargeAmount,
    ramadanSummary.hasRamadanSplit,
  ]);

  const redirectToThankYou = (donationId?: string) => {
    clear();
    const summaryParams = new URLSearchParams({
      amount: chargeAmount.toString(),
      currency,
      frequency: ramadanSummary.hasRamadanSplit ? "ramadan_split" : checkoutFrequency,
      giftAid: giftAid.toString(),
    });
    if (ramadanSummary.hasRamadanSplit) {
      summaryParams.set("commitmentTotal", donationAmount.toString());
      summaryParams.set("installmentCount", String(ramadanSummary.installmentCount));
      summaryParams.set("installmentAmount", ramadanSummary.firstInstallmentAmount.toString());
    }
    if (donationId) summaryParams.set("donationId", donationId);
    router.push(`/thank-you?${summaryParams.toString()}`);
  };

  const paymentPrepareAttempted = useRef(false);

  const createRamadanSchedules = useCallback(async (): Promise<string[]> => {
    const scheduleIds: string[] = [];
    for (const line of items) {
      if (!isRamadanSplitCartLine(line) || !line.ramadan) continue;
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

      const schedule = await createAutomatedSchedule({
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
        status: "awaiting_payment_method",
      });
      if (schedule?.id) scheduleIds.push(String(schedule.id));
    }
    return scheduleIds;
  }, [donorEmail, donorName, donorPhone, items]);

  const formatPaymentError = (message: string) => {
    if (message.toLowerCase().includes("ip address")) {
      return `${message} Open Stripe Dashboard → Developers → API keys and remove IP restrictions on your test secret key.`;
    }
    return message;
  };

  const preparePayment = useCallback(async () => {
    if (!items.length || pendingDonationId || paymentPrepareAttempted.current) return;
    if (!donorName.trim() || !donorEmail.trim() || !stripeReady) return;

    paymentPrepareAttempted.current = true;
    setSubmitting(true);
    setPaymentError("");
    try {
      const upsellSummary = [
        ...cartSelectedUpsells.map(
          (u) =>
            `${u.name || u.label || "Upsell"} (${currencyInfo.symbol}${Number(u.amount || 0).toFixed(2)})`
        ),
        ...checkoutUpsellOptions
          .filter((u) => selectedUpsellIds.has(u.id))
          .map(
            (u) =>
              `${u.name || u.label || "Upsell"} (${currencyInfo.symbol}${Number(u.amount || 0).toFixed(2)})`
          ),
      ].join(", ");

      const cartSummary = items.map((i) => i.description).join("; ");
      const primary = items[0];

      const scheduleIds = ramadanSummary.hasRamadanSplit ? await createRamadanSchedules() : [];
      setPendingAutomatedScheduleIds(scheduleIds);
      const primaryScheduleId = scheduleIds[0];

      let recurringId: string | undefined;
      if (isRecurringFrequency(checkoutFrequency)) {
        const recurring = await createRecurringDonation({
          donorName,
          donorEmail,
          amount: chargeAmount,
          currency,
          frequency: checkoutFrequency,
          campaignId: primary?.campaignId,
          campaignSlug: primary?.campaignSlug || (!primary?.campaignId ? primary?.donationPageSlug : undefined),
          paymentMethod: "stripe",
          giftAid,
        });
        recurringId = recurring.id as string;
      }

      const ramadanMessage = ramadanSummary.hasRamadanSplit
        ? `Ramadan split — ${currencyInfo.symbol}${donationAmount.toFixed(2)} across ${ramadanSummary.installmentCount} nights` +
          (ramadanCheckoutCharge > 0
            ? ` · First night ${currencyInfo.symbol}${ramadanCheckoutCharge.toFixed(2)}`
            : " · Card saved for scheduled nights")
        : "";

      const donation = await createDonation({
        amount: chargeAmount,
        currency,
        frequency: ramadanSummary.hasRamadanSplit ? "ramadan_split" : checkoutFrequency,
        giftAid,
        donationType: primary?.donationType || primary?.category || "general",
        paymentMethod: "stripe",
        donorName,
        donorEmail,
        donorPhone: donorPhone || undefined,
        campaignId: primary?.campaignId,
        campaignSlug:
          primary?.campaignSlug || (!primary?.campaignId ? primary?.donationPageSlug : undefined),
        quantity: 1,
        unitPrice: chargeAmount,
        automatedScheduleId: primaryScheduleId,
        message: [
          `Donation cart: ${cartSummary}`,
          ramadanMessage,
          upsellSummary ? `Upsells: ${upsellSummary}` : "",
          adminSavesLifeTotal > 0
            ? `Admin Saves Life: ${currencyInfo.symbol}${adminSavesLifeTotal.toFixed(2)}`
            : "",
          donorComment.trim() ? `Comment: ${donorComment.trim()}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        dedication:
          checkoutSettings.enableDedication && showDedication && dedicationName.trim()
            ? {
                type: dedicationType,
                recipientName: dedicationName.trim(),
                recipientEmail: dedicationEmail.trim() || undefined,
                personalMessage: dedicationMessage.trim() || undefined,
              }
            : undefined,
      });

      setPendingDonationId(donation.id as string);
      setPendingRecurringDonationId(recurringId ?? null);
    } catch (err: unknown) {
      paymentPrepareAttempted.current = false;
      setPaymentError(formatPaymentError(getApiErrorMessage(err, "Payment could not be started")));
    } finally {
      setSubmitting(false);
    }
  }, [
    adminSavesLifeTotal,
    cartSelectedUpsells,
    chargeAmount,
    checkoutSettings.enableDedication,
    checkoutFrequency,
    checkoutUpsellOptions,
    createRamadanSchedules,
    donationAmount,
    ramadanCheckoutCharge,
    ramadanSummary.hasRamadanSplit,
    ramadanSummary.installmentCount,
    ramadanSummary.installmentCount,
    currency,
    currencyInfo.symbol,
    dedicationEmail,
    dedicationMessage,
    dedicationName,
    dedicationType,
    donorComment,
    donorEmail,
    donorName,
    donorPhone,
    giftAid,
    items,
    selectedUpsellIds,
    showDedication,
    pendingDonationId,
    stripeReady,
  ]);

  useEffect(() => {
    if (flowStep !== "payment") return;
    void preparePayment();
  }, [flowStep, preparePayment, stripeReady]);

  const effectivePublishableKey =
    stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  if (!items.length) {
    return (
      <section className="container-wide py-20 text-center space-y-6">
        <h1 className="font-serif text-3xl text-primary">Your cart is empty</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Add a donation from a campaign, then return here to complete checkout.
        </p>
        <Button asChild className="rounded-full bg-accent hover:bg-primary hover:text-primary-foreground">
          <Link href="/campaigns">Browse campaigns</Link>
        </Button>
      </section>
    );
  }

  if (configLoading) {
    return (
      <div className="container-wide py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <section className="bg-secondary/40 border-b border-border">
        <div className="container-wide py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/campaigns"
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
        <div className="lg:col-span-7 space-y-6">
          {flowStep === "gift-aid" && showGiftAidStep && (
            <CheckoutGiftAidStep
              currencySymbol={currencyInfo.symbol}
              donationAmount={donationAmount}
              giftAid={giftAid}
              onGiftAidChange={setGiftAid}
              showUpsells={checkoutSettings.enableUpsell && checkoutUpsellOptions.length > 0}
              upsells={checkoutUpsellOptions}
              selectedUpsellIds={selectedUpsellIds}
              onToggleUpsell={toggleUpsell}
              onNext={goToDetails}
              onPrevious={() => router.push("/campaigns")}
              flowSteps={flowSteps}
            />
          )}

          {flowStep === "details" && (
            <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-6 max-w-xl mx-auto lg:mx-0">
              <div className="space-y-1">
                <h1 className="font-serif text-2xl md:text-3xl text-primary">Your details</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your contact details so we can send your receipt.
                </p>
              </div>

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

              {checkoutSettings.enableComments && (
                <div>
                  <Label htmlFor="donor-comment" className="text-xs">
                    Comments (optional)
                  </Label>
                  <textarea
                    id="donor-comment"
                    value={donorComment}
                    onChange={(e) => setDonorComment(e.target.value)}
                    rows={3}
                    className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Any message for our team..."
                  />
                </div>
              )}

              {!showGiftAidStep && checkoutSettings.enableUpsell && checkoutUpsellOptions.length > 0 && (
                <div className="rounded-2xl bg-secondary/50 border border-border p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Please support us further</p>
                  <CheckoutUpsellList
                    upsells={checkoutUpsellOptions}
                    selectedUpsellIds={selectedUpsellIds}
                    currencySymbol={currencyInfo.symbol}
                    onToggleUpsell={toggleUpsell}
                  />
                </div>
              )}

              {showAdminSavesLife && (
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminSavesLife}
                    onChange={(e) => setAdminSavesLife(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-accent rounded shrink-0"
                  />
                  <span className="text-sm flex-1">
                    <span className="font-semibold text-primary">Admin Saves Life</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Add {currencyInfo.symbol}
                      {adminSavesLifeAmount.toFixed(2)} to your donation.
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-accent tabular-nums">
                    {currencyInfo.symbol}
                    {adminSavesLifeAmount.toFixed(2)}
                  </span>
                </label>
              )}

              {checkoutSettings.enableDedication && (
                <div className="rounded-2xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDedication(!showDedication)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Donate on behalf of someone
                    </span>
                    {showDedication ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  {showDedication && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border">
                      <div>
                        <Label className="text-xs">Dedication type</Label>
                        <select
                          value={dedicationType}
                          onChange={(e) => setDedicationType(e.target.value)}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                          className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isCartRecurring && !ramadanSummary.hasRamadanSplit && (
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={monthlyGift}
                    onChange={(e) => setMonthlyGift(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-accent rounded shrink-0"
                  />
                  <span className="text-sm">
                    <span className="font-semibold text-primary">Make this a monthly gift</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Sandbox test — charges {currencyInfo.symbol}
                      {chargeAmount.toFixed(2)} every month until cancelled.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {showGiftAidStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBackFromDetails}
                    className="rounded-full min-w-[120px] border-accent text-accent hover:bg-primary hover:text-primary-foreground"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={goToPayment}
                  disabled={!donorName.trim() || !donorEmail.trim()}
                  className="rounded-full min-w-[120px] bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  Next
                </Button>
              </div>

              <CheckoutStepIndicator steps={flowSteps} current="details" />
            </div>
          )}

          {flowStep === "payment" && (
            <div className="max-w-xl mx-auto lg:mx-0 space-y-6">
              {!stripeReady && (
                <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-4">
                  <p className="text-sm text-destructive">
                    Stripe is not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to
                    your environment, then restart the API and web app.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBackFromPayment}
                      className="rounded-full min-w-[120px] border-accent text-accent hover:bg-primary hover:text-primary-foreground"
                    >
                      Previous
                    </Button>
                  </div>
                  <CheckoutStepIndicator steps={flowSteps} current="payment" />
                </div>
              )}

              {stripeReady && !pendingDonationId && (
                <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-6">
                  {paymentError ? (
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-destructive text-center leading-relaxed">{paymentError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackFromPayment}
                          className="rounded-full min-w-[120px] border-accent text-accent hover:bg-primary hover:text-primary-foreground"
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            paymentPrepareAttempted.current = false;
                            void preparePayment();
                          }}
                          disabled={submitting}
                          className="rounded-full min-w-[120px] bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Retrying…
                            </>
                          ) : (
                            "Try again"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-accent-deep" />
                      <p className="text-sm text-muted-foreground">Loading secure checkout…</p>
                    </div>
                  )}
                  <CheckoutStepIndicator steps={flowSteps} current="payment" />
                </div>
              )}

              {effectivePublishableKey && pendingDonationId && donorPrefillLoading && (
                <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-deep" />
                    <p className="text-sm text-muted-foreground">Loading your saved payment methods…</p>
                  </div>
                </div>
              )}

              {effectivePublishableKey && pendingDonationId && !donorPrefillLoading && (
                <>
                  {paymentError && (
                    <p className="text-sm text-destructive text-center">{paymentError}</p>
                  )}
                  <StripeCheckoutForm
                    publishableKey={effectivePublishableKey}
                    donationId={pendingDonationId}
                    donorName={donorName}
                    donorEmail={donorEmail}
                    amount={chargeAmount}
                    currencySymbol={currencyInfo.symbol}
                    currencyCode={currency}
                    frequency={checkoutFrequency}
                    recurringInterval={checkoutRecurringParams.interval}
                    recurringIntervalCount={checkoutRecurringParams.intervalCount}
                    recurringCancelAt={checkoutRecurringParams.cancelAt}
                    recurringDonationId={pendingRecurringDonationId ?? undefined}
                    campaignId={items[0]?.campaignId}
                    stripeCustomerId={stripeCustomer?.customerId}
                    customerSessionClientSecret={stripeCustomer?.customerSessionClientSecret}
                    paymentMode={stripePaymentMode}
                    automatedScheduleIds={pendingAutomatedScheduleIds}
                    ramadanCommitmentTotal={ramadanSummary.hasRamadanSplit ? donationAmount : undefined}
                    ramadanFirstInstallmentAmount={
                      ramadanSummary.hasRamadanSplit
                        ? ramadanSummary.firstInstallmentAmount
                        : undefined
                    }
                    ramadanInstallmentCount={
                      ramadanSummary.hasRamadanSplit ? ramadanSummary.installmentCount : undefined
                    }
                    onSuccess={() => redirectToThankYou(pendingDonationId)}
                    onError={(msg) => setPaymentError(msg)}
                  />
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBackFromPayment}
                      disabled={submitting}
                      className="rounded-full min-w-[120px] border-accent text-accent hover:bg-primary hover:text-primary-foreground"
                    >
                      Previous
                    </Button>
                  </div>
                  <CheckoutStepIndicator steps={flowSteps} current="payment" />
                </>
              )}
            </div>
          )}
        </div>

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
                      {isRamadanSplitCartLine(line) ? (
                        (() => {
                          const installments = [...getRamadanInstallmentsFromLine(line)].sort(
                            (a, b) => a.scheduledDate.localeCompare(b.scheduledDate)
                          );
                          const perNight = Number(installments[0]?.amount ?? 0);
                          return (
                            <>
                              {currencyInfo.symbol}
                              {perNight.toFixed(2)}
                              <span className="text-muted-foreground font-normal"> / night</span>
                              <span className="block text-[11px] font-normal text-muted-foreground">
                                {currencyInfo.symbol}
                                {Number(line.amount).toFixed(2)} total · {line.ramadan?.nights ?? 0}{" "}
                                nights
                              </span>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          {currencyInfo.symbol}
                          {Number(line.amount).toFixed(2)}
                        </>
                      )}
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
            {[...cartSelectedUpsells, ...checkoutUpsellOptions.filter((u) => selectedUpsellIds.has(u.id))].map(
              (u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{u.name || u.label}</p>
                    {u.description?.trim() && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{u.description}</p>
                    )}
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">
                    {currencyInfo.symbol}
                    {Number(u.amount || 0).toFixed(2)}
                  </span>
                </div>
              )
            )}
            {adminSavesLifeTotal > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm gap-3">
                <p className="font-medium">Admin Saves Life</p>
                <span className="font-semibold tabular-nums shrink-0">
                  {currencyInfo.symbol}
                  {adminSavesLifeTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {checkoutSettings.enableDedication && showDedication && dedicationName.trim() && (
            <div className="rounded-2xl bg-card border border-border p-5 text-sm">
              <p className="font-semibold text-primary flex items-center gap-2">
                <Gift className="w-4 h-4" /> {dedicationType}
              </p>
              <p className="text-muted-foreground mt-1">{dedicationName}</p>
            </div>
          )}

          <div className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift">
            {ramadanSummary.hasRamadanSplit ? (
              <>
                <p className="text-xs uppercase tracking-widest text-accent font-bold">
                  First night · {currency}
                </p>
                <p className={`${statTotalClass} mt-1`}>
                  {currencyInfo.symbol}
                  {ramadanSummary.firstInstallmentAmount.toFixed(2)}
                </p>
                <p className="text-sm text-primary-foreground/85 mt-2">
                  {currencyInfo.symbol}
                  {donationAmount.toFixed(2)} total across {ramadanSummary.installmentCount} nights
                </p>
                <p className="text-sm text-primary-foreground/90 mt-3 font-semibold">
                  Due today: {currencyInfo.symbol}
                  {chargeAmount.toFixed(2)}
                  <span className="block text-xs font-normal text-primary-foreground/75 mt-0.5">
                    Night 1 of {ramadanSummary.installmentCount} · saved card used for remaining
                    nights
                  </span>
                </p>
                {ramadanSummary.futureInstallmentTotal > 0 && (
                  <p className="text-xs text-primary-foreground/75 mt-1">
                    {currencyInfo.symbol}
                    {ramadanSummary.futureInstallmentTotal.toFixed(2)} charged automatically on nights
                    2–{ramadanSummary.installmentCount}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest text-accent font-bold">You pay · {currency}</p>
                <p className={`${statTotalClass} mt-1`}>
                  {currencyInfo.symbol}
                  {chargeAmount.toFixed(2)}
                </p>
              </>
            )}
            {giftAid && giftAidBoost > 0 && (
              <p className="text-sm text-primary-foreground/80 mt-2">
                Charity receives {currencyInfo.symbol}
                {charityValue.toFixed(2)} with Gift Aid (+{currencyInfo.symbol}
                {giftAidBoost.toFixed(2)} at no extra cost)
              </p>
            )}
            {isCartRecurring && (
              <p className="text-sm text-primary-foreground/85">
                Recurring every {checkoutRecurrenceLabel}
              </p>
            )}
            <div className="mt-6 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                {items.length} item{items.length === 1 ? "" : "s"} in your cart
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
