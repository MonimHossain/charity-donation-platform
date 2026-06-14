"use client";

import { ShieldCheck, ChevronDown, HandHeart, CircleDollarSign, Tag } from "lucide-react";
import { homeDonateButtonClass } from "@/lib/home-buttons";
import { useQuickDonateForm } from "@/lib/hooks/useQuickDonateForm";
import { useCurrency } from "@/lib/currency";

interface Props {
  defaultAmount?: number;
  campaign?: string;
  variant?: "light" | "dark" | "banner";
}

const FREQUENCY_LABELS = {
  single: { short: "Single", long: "Single Donation" },
  monthly: { short: "Monthly", long: "Monthly Donation" },
} as const;

export default function QuickDonate({ campaign = "gaza", variant = "light" }: Props) {
  const {
    options,
    categories,
    showSingle,
    showRegular,
    selectedOptionId,
    category,
    freq,
    amount,
    custom,
    prices,
    finalAmount,
    setCategory,
    setFreq,
    setCustom,
    setAmount,
    selectOption,
    selectAmount,
    goToDonate,
  } = useQuickDonateForm(campaign);

  const { symbol } = useCurrency();
  const frequencies = (
    [
      showSingle ? ("single" as const) : null,
      showRegular ? ("monthly" as const) : null,
    ].filter(Boolean) as Array<"single" | "monthly">
  );

  if (variant === "banner") {
    const LabeledField = ({
      label,
      icon: Icon,
      children,
    }: {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      children: React.ReactNode;
    }) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          <Icon className="w-3 h-3 text-accent-deep" />
          {label}
        </span>
        {children}
      </div>
    );

    const fieldClass =
      "w-full appearance-none bg-secondary/60 hover:bg-secondary text-foreground font-semibold text-sm rounded-xl px-3 pr-8 h-11 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate";

    return (
      <div className="bg-card/95 backdrop-blur rounded-3xl shadow-lift border border-border p-3 sm:p-4 max-w-2xl">
        {frequencies.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex p-0.5 rounded-full bg-secondary">
              {frequencies.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFreq(f)}
                  className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-full transition-colors ${
                    freq === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {FREQUENCY_LABELS[f].long}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-deep" /> Secure checkout
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledField label="I'd like to donate to" icon={HandHeart}>
            <div className="relative">
              <select
                value={selectedOptionId}
                onChange={(e) => selectOption(e.target.value)}
                className={fieldClass}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </LabeledField>

          <LabeledField label="Donation category" icon={Tag}>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldClass}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </LabeledField>
        </div>

        <div className="mt-3">
          <LabeledField label="Amount" icon={CircleDollarSign}>
            <div className="relative flex items-center bg-secondary/60 hover:bg-secondary rounded-xl border border-border focus-within:ring-2 focus-within:ring-accent h-11">
              <span className="pl-3 pr-1 text-base font-bold text-accent-deep">{symbol}</span>
              <input
                inputMode="numeric"
                value={custom || String(amount)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setCustom(v);
                  if (v) setAmount(Number(v));
                }}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-transparent pr-3 text-base font-bold focus:outline-none"
                aria-label="Amount"
              />
            </div>
          </LabeledField>
        </div>

        {prices.length > 0 && (
          <div className="mt-3">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1 mb-1.5">
              Quick pick
            </span>
            <div className="flex flex-wrap gap-1.5">
              {prices.map((p) => (
                <button
                  key={`${p.amount}-${p.sortOrder}`}
                  type="button"
                  onClick={() => selectAmount(p.amount)}
                  className={`flex-1 min-w-[60px] px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    amount === p.amount && !custom
                      ? "bg-accent text-accent-foreground shadow-glow scale-[1.02]"
                      : "bg-secondary text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {symbol}{p.amount}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={goToDonate}
          className={`w-full h-12 mt-3 text-base font-bold ${homeDonateButtonClass}`}
        >
          Donate {symbol}{finalAmount}{freq === "monthly" ? "/mo" : ""}
        </button>

        <p className="sm:hidden mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-deep" /> Secure checkout
        </p>
      </div>
    );
  }

  const dark = variant === "dark";

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 shadow-lift border ${
        dark
          ? "bg-primary/95 backdrop-blur text-primary-foreground border-primary-foreground/15"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className={`text-xs uppercase tracking-widest font-semibold ${dark ? "text-accent" : "text-accent-deep"}`}>
          Donate in seconds
        </p>
        {frequencies.length > 0 && (
          <div className={`flex p-0.5 rounded-full ${dark ? "bg-primary-foreground/15" : "bg-secondary"}`}>
            {frequencies.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFreq(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-colors ${
                  freq === f
                    ? dark ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    : dark ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {FREQUENCY_LABELS[f].short}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 relative">
        <select
          value={selectedOptionId}
          onChange={(e) => selectOption(e.target.value)}
          className="w-full appearance-none bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-xs rounded-full pl-3 pr-7 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>Cause: {o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      <div className="mb-3 relative">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full appearance-none bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-xs rounded-full pl-3 pr-7 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>Category: {c.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {prices.length > 0 && (
        <div className={`grid gap-2 ${prices.length <= 5 ? `grid-cols-${prices.length}` : "grid-cols-5"}`} style={{ gridTemplateColumns: `repeat(${Math.min(prices.length, 5)}, minmax(0, 1fr))` }}>
          {prices.map((p) => {
            const active = amount === p.amount && !custom;
            return (
              <button
                key={`${p.amount}-${p.sortOrder}`}
                type="button"
                onClick={() => selectAmount(p.amount)}
                className={`py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
                  active
                    ? "bg-accent text-accent-foreground scale-[1.03] shadow-glow"
                    : dark
                    ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {symbol}{p.amount}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className={`text-sm font-semibold ${dark ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {symbol}
        </span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Other amount"
          className={`flex-1 px-3 py-2 rounded-xl text-sm bg-transparent border focus:outline-none focus:ring-2 focus:ring-accent ${
            dark
              ? "border-primary-foreground/25 placeholder:text-primary-foreground/50"
              : "border-border placeholder:text-muted-foreground"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={goToDonate}
        className={`w-full mt-4 h-12 text-base font-bold ${homeDonateButtonClass}`}
      >
        Donate {symbol}{finalAmount}
        {freq === "monthly" && "/mo"}
      </button>

      <div className={`mt-3 flex items-center justify-center gap-1.5 text-[11px] ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        <ShieldCheck className="w-3.5 h-3.5" /> Secure · Apple Pay · Google Pay · Card
      </div>
    </div>
  );
}
