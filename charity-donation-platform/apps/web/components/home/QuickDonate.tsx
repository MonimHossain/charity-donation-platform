"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, ChevronDown, HandHeart, Repeat, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [10, 25, 50, 100, 250];

const FREQUENCIES = [
  { value: "single", label: "Single" },
  { value: "monthly", label: "Monthly" },
] as const;

const CAUSES = [
  { value: "where-needed-most", label: "Where Needed Most" },
  { value: "gaza", label: "Gaza Emergency" },
  { value: "orphans", label: "Orphan Sponsorship" },
  { value: "water", label: "Water Wells" },
  { value: "food", label: "Food Aid" },
  { value: "zakat", label: "Zakat" },
  { value: "sadaqah", label: "Sadaqah Jariyah" },
];

interface Props {
  defaultAmount?: number;
  campaign?: string;
  variant?: "light" | "dark" | "banner";
}

export default function QuickDonate({ defaultAmount = 50, campaign = "gaza", variant = "light" }: Props) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<"single" | "monthly">("single");
  const [cause, setCause] = useState(campaign);
  const router = useRouter();
  const final = Number(custom) || amount;
  const symbol = "£";

  const go = () => {
    router.push(`/donate?amount=${final}&freq=${freq}&cause=${encodeURIComponent(cause)}`);
  };

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
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex p-0.5 rounded-full bg-secondary">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFreq(f.value as "single" | "monthly")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  freq === f.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-deep" /> Secure checkout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledField label="I'd like to donate to" icon={HandHeart}>
            <div className="relative">
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                className={fieldClass}
              >
                {CAUSES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </LabeledField>

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

        <div className="mt-3">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1 mb-1.5">
            Quick pick
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { setAmount(a); setCustom(""); }}
                className={`flex-1 min-w-[60px] px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  amount === a && !custom
                    ? "bg-accent text-accent-foreground shadow-glow scale-[1.02]"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {symbol}{a}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={go}
          className="w-full rounded-full h-12 mt-3 text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Heart className="w-5 h-5" /> Donate {symbol}{final}{freq === "monthly" ? "/mo" : ""}
        </Button>

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
        <div className={`flex p-0.5 rounded-full ${dark ? "bg-primary-foreground/15" : "bg-secondary"}`}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFreq(f.value as "single" | "monthly")}
              className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-colors ${
                freq === f.value
                  ? dark ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                  : dark ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {f.value === "single" ? "One-off" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 relative">
        <select
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          className="w-full appearance-none bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-xs rounded-full pl-3 pr-7 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate"
        >
          {CAUSES.map((o) => (
            <option key={o.value} value={o.value}>Cause: {o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PRESETS.map((a) => {
          const active = amount === a && !custom;
          return (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustom(""); }}
              className={`py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
                active
                  ? "bg-accent text-accent-foreground scale-[1.03] shadow-glow"
                  : dark
                  ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                  : "bg-secondary text-foreground hover:bg-secondary/70"
              }`}
            >
              {symbol}{a}
            </button>
          );
        })}
      </div>

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

      <Button
        onClick={go}
        className="w-full mt-4 rounded-full text-base bg-accent text-accent-foreground hover:bg-accent/90"
        size="lg"
      >
        <Heart className="w-5 h-5" /> Donate {symbol}{final}
        {freq === "monthly" && "/mo"} now
      </Button>

      <div className={`mt-3 flex items-center justify-center gap-1.5 text-[11px] ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        <ShieldCheck className="w-3.5 h-3.5" /> Secure · Apple Pay · Google Pay · Card
      </div>
    </div>
  );
}
