"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Repeat,
  Sparkles,
  Gift,
  Globe,
  Phone,
  MapPin,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CURRENCIES, type CurrencyCode, formatCurrency } from "@/lib/currency";
import { fetchCampaigns, fetchCampaignBySlug, createDonation } from "@/lib/api";

type DonationFrequency = "single" | "monthly" | "quarterly" | "annually";
type ZakatType = "zakat" | "sadaqah" | "lillah" | "general";
type PaymentMethod = "card" | "paypal" | "apple_pay" | "google_pay";

interface CampaignPreset { amount: number; label: string; description?: string; }
interface CampaignAttribute { name: string; description?: string; options: Array<{ label: string; priceAdjustment?: number }>; }
interface CampaignUpsell { label: string; type: "fixed" | "percentage" | "round-up"; value: number; description?: string; }

interface Campaign {
  id: string;
  title: string;
  slug: string;
  donationTypes?: string[];
  recurringInterval?: string;
  allowedIntervals?: string[];
  hasQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  allowCustomAmount?: boolean;
  minDonation?: number;
  maxDonation?: number;
  presetAmounts?: CampaignPreset[];
  attributes?: CampaignAttribute[];
  isAutomated?: boolean;
  automatedConfig?: { defaultDays?: number; minDays?: number; maxDays?: number };
  upsellEnabled?: boolean;
  upsellOptions?: CampaignUpsell[];
}

const FREQUENCIES: { value: DonationFrequency; label: string; badge?: string }[] = [
  { value: "single", label: "Single" },
  { value: "monthly", label: "Monthly", badge: "Most impact" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const PRESETS: { amount: number; impact: string }[] = [
  { amount: 10, impact: "Provide clean water for a family for a week" },
  { amount: 30, impact: "Feed a family for a month" },
  { amount: 50, impact: "Provide school supplies for 5 children" },
  { amount: 100, impact: "Support an orphan for a month" },
  { amount: 250, impact: "Build a water well contribution" },
  { amount: 500, impact: "Emergency shelter for a family" },
];

const ZAKAT_TYPES: { value: ZakatType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "zakat", label: "Zakat" },
  { value: "sadaqah", label: "Sadaqah" },
  { value: "lillah", label: "Lillah" },
];

const DEDICATION_TYPES = [
  "In honour of",
  "In memory of",
  "On behalf of",
  "As a gift to",
];

export default function DonatePage() {
  const params = useSearchParams();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState(params.get("campaign") || "");
  const [frequency, setFrequency] = useState<DonationFrequency>(
    (params.get("freq") as DonationFrequency) || "single"
  );
  const [amount, setAmount] = useState(Number(params.get("amount")) || 50);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  const [giftAid, setGiftAid] = useState(false);
  const [zakatType, setZakatType] = useState<ZakatType>(
    (params.get("zakat") as ZakatType) || "general"
  );

  const [showDedication, setShowDedication] = useState(false);
  const [dedicationType, setDedicationType] = useState(DEDICATION_TYPES[0]);
  const [dedicationName, setDedicationName] = useState("");
  const [dedicationEmail, setDedicationEmail] = useState("");
  const [dedicationMessage, setDedicationMessage] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("United Kingdom");

  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [attributeSelections, setAttributeSelections] = useState<Record<string, string>>({});
  const [selectedUpsells, setSelectedUpsells] = useState<Set<number>>(new Set());
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns({ status: "active" })
      .then((res) => setCampaigns(res.items || res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      const found = campaigns.find((c) => c.id === selectedCampaign);
      setActiveCampaign(found || null);
      setQuantity(1);
      setAttributeSelections({});
      setSelectedUpsells(new Set());
    } else {
      setActiveCampaign(null);
    }
  }, [selectedCampaign, campaigns]);

  const baseAmount = Number(customAmount) || amount;
  const effectiveQuantity = activeCampaign?.hasQuantity ? quantity : 1;

  const attributePriceAdj = useMemo(() => {
    if (!activeCampaign?.attributes) return 0;
    let adj = 0;
    for (const attr of activeCampaign.attributes) {
      const sel = attributeSelections[attr.name];
      if (sel) {
        const opt = attr.options.find((o) => o.label === sel);
        if (opt?.priceAdjustment) adj += opt.priceAdjustment;
      }
    }
    return adj;
  }, [activeCampaign, attributeSelections]);

  const upsellTotal = useMemo(() => {
    if (!activeCampaign?.upsellEnabled || !activeCampaign.upsellOptions) return 0;
    let total = 0;
    selectedUpsells.forEach((idx) => {
      const u = activeCampaign.upsellOptions![idx];
      if (!u) return;
      if (u.type === "fixed") total += u.value;
      else if (u.type === "percentage") total += (baseAmount * u.value) / 100;
      else if (u.type === "round-up") {
        const rounded = Math.ceil(baseAmount / u.value) * u.value;
        total += rounded - baseAmount;
      }
    });
    return Math.round(total * 100) / 100;
  }, [activeCampaign, selectedUpsells, baseAmount]);

  const finalAmount = (baseAmount + attributePriceAdj) * effectiveQuantity + upsellTotal;
  const currencyInfo = CURRENCIES[currency];
  const giftAidExtra = useMemo(
    () => (giftAid ? +(finalAmount * 0.25).toFixed(2) : 0),
    [giftAid, finalAmount]
  );
  const totalWithGiftAid = finalAmount + giftAidExtra;

  const activePresets = activeCampaign?.presetAmounts?.length
    ? activeCampaign.presetAmounts.map((p) => ({ amount: p.amount, impact: p.description || p.label }))
    : PRESETS;

  const hoveredPreset = activePresets.find((p) => p.amount === amount && !customAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        amount: finalAmount,
        unitPrice: baseAmount,
        quantity: effectiveQuantity,
        currency,
        frequency,
        giftAid,
        zakatType,
        paymentMethod,
        donorName,
        donorEmail,
        donorPhone: donorPhone || undefined,
        campaignId: selectedCampaign || undefined,
        attributeSelections: Object.keys(attributeSelections).length ? attributeSelections : undefined,
        upsellTotal: upsellTotal > 0 ? upsellTotal : undefined,
        emailOptIn,
        smsOptIn,
        address: showAddress
          ? { line1: address1, line2: address2, city, postcode, country }
          : undefined,
        dedication: showDedication
          ? {
              type: dedicationType,
              recipientName: dedicationName,
              recipientEmail: dedicationEmail,
              message: dedicationMessage,
            }
          : undefined,
      };
      await createDonation(payload);
      const summaryParams = new URLSearchParams({
        amount: finalAmount.toString(),
        currency,
        frequency,
        giftAid: giftAid.toString(),
        campaign: selectedCampaign || "",
      });
      router.push(`/thank-you?${summaryParams.toString()}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <section className="bg-secondary/40 border-b border-border">
        <div className="container-wide py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to Home
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Secure 256-bit SSL
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Registered Charity
            </span>
          </div>
        </div>
      </section>

      <section className="container-wide py-8 lg:py-12 grid lg:grid-cols-12 gap-8">
        {/* ── Main Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-primary">
                Make a Donation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                One page. No account needed. Apple Pay &amp; Google Pay supported.
              </p>
            </div>

            {/* Campaign selection */}
            {campaigns.length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                  Choose a Campaign (Optional)
                </Label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Where Needed Most</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Frequency Tabs */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Donation Type
              </Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl bg-secondary">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFrequency(f.value)}
                    className={cn(
                      "relative py-2.5 rounded-xl text-sm font-semibold transition-all",
                      frequency === f.value
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                    {f.badge && frequency !== f.value && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-wider">
                        {f.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {frequency === "monthly" && (
                <p className="mt-2 text-xs text-accent-deep font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Monthly donors deliver 4x
                  more lifetime impact. Cancel anytime.
                </p>
              )}
            </div>

            {/* Currency Selector */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Currency
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm border transition-all font-medium",
                      currency === code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/40"
                    )}
                  >
                    {CURRENCIES[code].symbol} {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Amounts */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Amount ({currencyInfo.symbol} {currency})
              </Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-3 gap-2">
                {activePresets.map((p) => {
                  const active = amount === p.amount && !customAmount;
                  return (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() => {
                        setAmount(p.amount);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "relative py-4 px-2 rounded-xl font-bold text-base transition-all group text-center",
                        active
                          ? "bg-accent text-accent-foreground shadow-glow scale-[1.02]"
                          : "bg-secondary hover:bg-secondary/70"
                      )}
                    >
                      <span className="text-lg">
                        {currencyInfo.symbol}
                        {p.amount}
                      </span>
                      <span
                        className={cn(
                          "block text-[11px] font-normal mt-0.5 leading-tight",
                          active
                            ? "text-accent-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {p.impact}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  {currencyInfo.symbol}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-8 rounded-xl h-12 text-base"
                />
              </div>
            </div>

            {/* Zakat Type */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Donation Category
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ZAKAT_TYPES.map((z) => (
                  <button
                    key={z.value}
                    type="button"
                    onClick={() => setZakatType(z.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm border transition-all font-medium",
                      zakatType === z.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/40"
                    )}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gift Aid */}
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/30 cursor-pointer">
              <input
                type="checkbox"
                checked={giftAid}
                onChange={(e) => setGiftAid(e.target.checked)}
                className="mt-1 w-5 h-5 accent-primary rounded"
              />
              <span className="text-sm">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Gift className="w-4 h-4" /> Add Gift Aid &mdash; boost your
                  donation by 25%
                </span>
                <span className="block text-muted-foreground mt-0.5">
                  I am a UK taxpayer and understand that if I pay less Income Tax
                  and/or Capital Gains Tax than the amount of Gift Aid claimed on all
                  my donations in that tax year, it is my responsibility to pay any
                  difference.
                </span>
                {giftAid && (
                  <span className="block text-accent-deep font-semibold mt-1">
                    +{currencyInfo.symbol}
                    {giftAidExtra.toFixed(2)} extra at no cost to you!
                  </span>
                )}
              </span>
            </label>
          </div>

          {/* ── Quantity Selector ── */}
          {activeCampaign?.hasQuantity && (
            <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-4">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold flex items-center gap-1.5">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity(Math.max(activeCampaign.minQuantity || 1, quantity - 1))} className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold hover:bg-secondary/70 transition-colors">−</button>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(activeCampaign.minQuantity || 1, Math.min(activeCampaign.maxQuantity || 100, Number(e.target.value))))} className="h-10 w-20 text-center rounded-xl text-lg font-bold" />
                <button type="button" onClick={() => setQuantity(Math.min(activeCampaign.maxQuantity || 100, quantity + 1))} className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold hover:bg-secondary/70 transition-colors">+</button>
                <span className="text-sm text-muted-foreground">
                  × {currencyInfo.symbol}{baseAmount.toFixed(2)} = <span className="font-bold text-foreground">{currencyInfo.symbol}{(baseAmount * quantity).toFixed(2)}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── Attributes ── */}
          {activeCampaign?.attributes && activeCampaign.attributes.length > 0 && (
            <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-4">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Options</p>
              {activeCampaign.attributes.map((attr) => (
                <div key={attr.name} className="space-y-2">
                  <Label className="text-sm font-medium">{attr.name}</Label>
                  {attr.description && <p className="text-xs text-muted-foreground">{attr.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {attr.options.map((opt) => (
                      <button key={opt.label} type="button" onClick={() => setAttributeSelections((prev) => ({ ...prev, [attr.name]: opt.label }))} className={cn("px-4 py-2 rounded-xl text-sm border transition-all font-medium", attributeSelections[attr.name] === opt.label ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40")}>
                        {opt.label}
                        {opt.priceAdjustment ? ` (+${currencyInfo.symbol}${opt.priceAdjustment})` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Upsell Options ── */}
          {activeCampaign?.upsellEnabled && activeCampaign.upsellOptions && activeCampaign.upsellOptions.length > 0 && (
            <div className="rounded-3xl bg-accent/5 border border-accent/20 p-6 lg:p-8 shadow-soft space-y-4">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Boost Your Impact
              </p>
              {activeCampaign.upsellOptions.map((u, i) => {
                const checked = selectedUpsells.has(i);
                let extraText = "";
                if (u.type === "fixed") extraText = `+${currencyInfo.symbol}${u.value}`;
                else if (u.type === "percentage") extraText = `+${u.value}%`;
                else if (u.type === "round-up") extraText = `Round up to nearest ${currencyInfo.symbol}${u.value}`;
                return (
                  <label key={i} className={cn("flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all", checked ? "border-accent bg-accent/10" : "border-border hover:border-accent/30")}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      setSelectedUpsells((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      });
                    }} className="mt-0.5 w-4 h-4 accent-primary" />
                    <div>
                      <p className="font-semibold text-sm">{u.label} <span className="text-accent-deep">{extraText}</span></p>
                      {u.description && <p className="text-xs text-muted-foreground mt-0.5">{u.description}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* ── Dedication Section ── */}
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
              <div className="px-6 pb-6 lg:px-8 space-y-4">
                <div>
                  <Label className="text-xs">Dedication Type</Label>
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
                      Recipient Name
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
                      Recipient Email (optional)
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
                    Personal Message (optional)
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

          {/* ── Donor Info & Payment ── */}
          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Your Details
              </p>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="donor-name" className="text-xs">
                    Full Name *
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
              <div className="mt-3">
                <Label htmlFor="donor-phone" className="text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone (optional)
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
            </div>

            {/* Optional Address */}
            <div>
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                {showAddress ? "Hide address fields" : "Add address (for Gift Aid)"}
              </button>
              {showAddress && (
                <div className="mt-3 space-y-3">
                  <Input
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="Address Line 1"
                    className="h-10 rounded-xl"
                  />
                  <Input
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Address Line 2 (optional)"
                    className="h-10 rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="h-10 rounded-xl"
                    />
                    <Input
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="Postcode"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Consent */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailOptIn}
                  onChange={(e) => setEmailOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  I&apos;d like to receive email updates about campaigns and impact
                  stories.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  I&apos;d like to receive SMS updates about urgent appeals.
                </span>
              </label>
            </div>
          </div>

          {/* ── Express Checkout ── */}
          <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-5">
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
              Express Checkout
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("apple_pay")}
                className={cn(
                  "h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all border-2",
                  paymentMethod === "apple_pay"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-foreground/90 text-background border-transparent hover:opacity-90"
                )}
              >
                <span className="text-xl"></span> Pay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("google_pay")}
                className={cn(
                  "h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all border-2",
                  paymentMethod === "google_pay"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-foreground/90 text-background border-transparent hover:opacity-90"
                )}
              >
                <span className="text-lg font-bold">G</span> Pay
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={cn(
                  "h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all border-2",
                  paymentMethod === "paypal"
                    ? "bg-[#0070ba] text-white border-[#0070ba]"
                    : "bg-[#0070ba]/90 text-white border-transparent hover:opacity-90"
                )}
              >
                PayPal
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all border-2",
                  paymentMethod === "card"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-primary/90 text-primary-foreground border-transparent hover:opacity-90"
                )}
              >
                <CreditCard className="w-5 h-5" /> Pay by Card
              </button>
            </div>

            {paymentMethod === "card" && (
              <>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex-1 h-px bg-border" /> Card details{" "}
                  <span className="flex-1 h-px bg-border" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="card" className="text-xs">
                      Card number
                    </Label>
                    <Input
                      id="card"
                      inputMode="numeric"
                      placeholder="1234 1234 1234 1234"
                      className="mt-1 h-12 rounded-xl"
                    />
                  </div>
                  <Input placeholder="MM / YY" inputMode="numeric" className="h-12 rounded-xl" />
                  <Input placeholder="CVC" inputMode="numeric" className="h-12 rounded-xl" />
                </div>
              </>
            )}

            {/* Monthly upsell */}
            {frequency === "single" && (
              <div className="p-4 rounded-2xl bg-accent/10 border border-accent/30">
                <button
                  type="button"
                  onClick={() => setFrequency("monthly")}
                  className="w-full text-left flex items-start gap-3"
                >
                  <Repeat className="w-5 h-5 text-accent-deep mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-primary text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-accent-deep" />
                      Make it monthly and multiply your impact!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Monthly donors help us plan ahead and deliver 4x more impact
                      over time. Cancel anytime with one click.
                    </p>
                  </div>
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !donorName || !donorEmail}
              size="lg"
              className="w-full rounded-full text-base bg-accent text-accent-foreground hover:bg-accent/90 h-14"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing&hellip;
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" /> Complete Donation &mdash;{" "}
                  {currencyInfo.symbol}
                  {totalWithGiftAid.toFixed(2)}
                  {frequency !== "single" && `/${frequency === "monthly" ? "mo" : frequency === "quarterly" ? "qtr" : "yr"}`}
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              By donating you agree to our terms. You can cancel recurring gifts
              anytime. Charged in {currency}.
            </p>
          </div>
        </form>

        {/* ── Sidebar Summary ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-4">
          <div className="rounded-3xl gradient-plum text-primary-foreground p-6 lg:p-8 shadow-lift">
            <p className="text-xs uppercase tracking-widest text-accent font-bold">
              Your Gift &middot; {currency}
            </p>
            <p className="font-serif text-5xl mt-1 tabular-nums">
              {currencyInfo.symbol}
              {totalWithGiftAid.toFixed(2)}
            </p>
            <p className="text-sm text-primary-foreground/75 mt-1">
              {effectiveQuantity > 1 && `${effectiveQuantity} × `}
              {currencyInfo.symbol}{baseAmount.toFixed(2)}
              {attributePriceAdj > 0 && ` (+${currencyInfo.symbol}${attributePriceAdj})`}
              {upsellTotal > 0 && ` + ${currencyInfo.symbol}${upsellTotal.toFixed(2)} extras`}
              {giftAid && ` + ${currencyInfo.symbol}${giftAidExtra.toFixed(2)} Gift Aid`}
              {frequency !== "single" && ` · ${frequency}`}
            </p>
            {zakatType !== "general" && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                {zakatType}
              </span>
            )}
            <div className="mt-6 space-y-2.5 text-sm">
              {hoveredPreset && (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />{" "}
                  {hoveredPreset.impact}
                </p>
              )}
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> Provides{" "}
                {Math.max(1, Math.floor(finalAmount / 5))} hot meals
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> Clean water
                for {Math.max(1, Math.floor(finalAmount / 2))} people
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> 100% donation
                policy on Zakat
              </p>
            </div>
          </div>

          {showDedication && dedicationName && (
            <div className="rounded-2xl bg-card border border-border p-5 text-sm">
              <p className="font-semibold text-primary flex items-center gap-2">
                <Gift className="w-4 h-4" /> {dedicationType}
              </p>
              <p className="text-muted-foreground mt-1">{dedicationName}</p>
              {dedicationMessage && (
                <p className="text-muted-foreground mt-1 italic">
                  &ldquo;{dedicationMessage}&rdquo;
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-secondary/60 border border-border p-5 text-sm space-y-3">
            <p className="font-semibold text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Trusted by 12,000+ donors
            </p>
            <p className="text-muted-foreground">
              Registered Charity &middot; Independently audited &middot; 100% donation
              policy on Zakat.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {["VISA", "MC", "AMEX", "PayPal", "Apple Pay", "Google Pay"].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-md bg-background border border-border text-[10px] font-bold text-foreground/70 tracking-wider"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/campaigns?category=emergency"
            className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm hover:bg-destructive/15 transition-colors"
          >
            <span className="font-semibold text-destructive flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Emergency appeal — donate today
            </span>
            <ArrowRight className="w-4 h-4 text-destructive" />
          </Link>
        </aside>
      </section>
    </>
  );
}
