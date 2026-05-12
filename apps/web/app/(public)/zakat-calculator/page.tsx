"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Info,
  ArrowRight,
  Banknote,
  Gem,
  TrendingUp,
  Briefcase,
  Building2,
  HandCoins,
  Receipt,
  CreditCard,
  Heart,
  CheckCircle2,
  SplitSquareVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const NISAB_GOLD = 5_198;
const NISAB_SILVER = 395;

interface AssetField {
  key: string;
  label: string;
  icon: React.ElementType;
  hint: string;
}

const ASSET_FIELDS: AssetField[] = [
  {
    key: "cashBank",
    label: "Cash & Bank Balances",
    icon: Banknote,
    hint: "Total in all bank accounts, savings, and cash on hand",
  },
  {
    key: "goldValue",
    label: "Gold Value",
    icon: Gem,
    hint: "Current market value of all gold owned",
  },
  {
    key: "silverValue",
    label: "Silver Value",
    icon: Gem,
    hint: "Current market value of all silver owned",
  },
  {
    key: "sharesInvestments",
    label: "Shares & Investments",
    icon: TrendingUp,
    hint: "Current value of stocks, shares, mutual funds, crypto",
  },
  {
    key: "businessStock",
    label: "Business Stock",
    icon: Briefcase,
    hint: "Value of goods held for sale in a business",
  },
  {
    key: "propertyInvestment",
    label: "Property for Investment",
    icon: Building2,
    hint: "Value of property held for investment (not personal residence)",
  },
  {
    key: "moneyOwed",
    label: "Money Owed to You",
    icon: HandCoins,
    hint: "Loans given to others that you expect to be repaid",
  },
];

const DEDUCTION_FIELDS: AssetField[] = [
  {
    key: "debts",
    label: "Debts",
    icon: CreditCard,
    hint: "Immediate debts and liabilities due",
  },
  {
    key: "expensesDue",
    label: "Expenses Due",
    icon: Receipt,
    hint: "Bills and essential expenses due shortly",
  },
];

export default function ZakatCalculatorPage() {
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [calculated, setCalculated] = useState(false);
  const [nisabType, setNisabType] = useState<"gold" | "silver">("gold");
  const [paymentMode, setPaymentMode] = useState<"full" | "split">("full");
  const [splitCount, setSplitCount] = useState(2);
  const [saving, setSaving] = useState(false);

  const updateAsset = (key: string, value: string) =>
    setAssets((prev) => ({ ...prev, [key]: value }));
  const updateDeduction = (key: string, value: string) =>
    setDeductions((prev) => ({ ...prev, [key]: value }));

  const totalAssets = useMemo(
    () =>
      ASSET_FIELDS.reduce((sum, f) => sum + (Number(assets[f.key]) || 0), 0),
    [assets]
  );

  const totalDeductions = useMemo(
    () =>
      DEDUCTION_FIELDS.reduce(
        (sum, f) => sum + (Number(deductions[f.key]) || 0),
        0
      ),
    [deductions]
  );

  const zakatableWealth = Math.max(0, totalAssets - totalDeductions);
  const nisabThreshold = nisabType === "gold" ? NISAB_GOLD : NISAB_SILVER;
  const zakatDue =
    zakatableWealth >= nisabThreshold ? +(zakatableWealth * 0.025).toFixed(2) : 0;
  const isAboveNisab = zakatableWealth >= nisabThreshold;

  const splitAmount = splitCount > 0 ? Math.round((zakatDue / splitCount) * 100) / 100 : zakatDue;

  const handleCalculate = async () => {
    setCalculated(true);
    try {
      await api.post("/zakat/calculate", {
        goldValue: Number(assets.goldValue) || 0,
        silverValue: Number(assets.silverValue) || 0,
        cashInHand: Number(assets.cashBank) || 0,
        cashInBank: 0,
        investments: Number(assets.sharesInvestments) || 0,
        businessStock: Number(assets.businessStock) || 0,
        receivables: Number(assets.moneyOwed) || 0,
        property: Number(assets.propertyInvestment) || 0,
        otherAssets: 0,
        personalDebt: Number(deductions.debts) || 0,
        otherLiabilities: Number(deductions.expensesDue) || 0,
      });
    } catch {
      // calculation is client-side, API call is just for saving
    }
  };

  const handleReset = () => {
    setAssets({});
    setDeductions({});
    setCalculated(false);
    setPaymentMode("full");
    setSplitCount(2);
  };

  return (
    <>
      <section className="bg-secondary/40 border-b border-border">
        <div className="container-wide py-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Calculator className="w-3.5 h-3.5" /> Free Calculator
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary text-balance">
              Zakat Calculator
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
              Calculate your Zakat obligation accurately. Enter your assets and
              liabilities below to find out how much Zakat you owe.
            </p>
          </div>
        </div>
      </section>

      <section className="container-wide py-8 lg:py-12 grid lg:grid-cols-12 gap-8">
        {/* Calculator form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Nisab selector */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg text-primary">
                Nisab Threshold
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The Nisab is the minimum amount of wealth a Muslim must possess
              before being obligated to pay Zakat. Choose your preferred Nisab
              calculation method:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNisabType("gold")}
                className={cn(
                  "p-4 rounded-2xl border-2 text-left transition-all",
                  nisabType === "gold"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <p className="font-semibold text-sm">Gold Standard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  87.48g of gold
                </p>
                <p className="font-bold text-primary mt-2">
                  £{NISAB_GOLD.toLocaleString()}
                </p>
              </button>
              <button
                onClick={() => setNisabType("silver")}
                className={cn(
                  "p-4 rounded-2xl border-2 text-left transition-all",
                  nisabType === "silver"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <p className="font-semibold text-sm">Silver Standard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  612.36g of silver
                </p>
                <p className="font-bold text-primary mt-2">
                  £{NISAB_SILVER.toLocaleString()}
                </p>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
              <Info className="w-3 h-3" /> Rates are approximate. Many scholars
              recommend using the silver standard as it benefits more recipients.
            </p>
          </div>

          {/* Assets */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <h2 className="font-serif text-lg text-primary mb-1">Your Assets</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter the current value of all zakatable assets in GBP (£).
            </p>
            <div className="space-y-4">
              {ASSET_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label
                    htmlFor={field.key}
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <field.icon className="w-4 h-4 text-primary" />
                    {field.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {field.hint}
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      £
                    </span>
                    <Input
                      id={field.key}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={assets[field.key] || ""}
                      onChange={(e) => updateAsset(field.key, e.target.value)}
                      className="pl-8 h-11 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Total Assets</span>
              <span className="font-bold text-lg text-primary tabular-nums">
                £{totalAssets.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <h2 className="font-serif text-lg text-primary mb-1">
              Deductions (Liabilities)
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter any immediate debts or expenses due.
            </p>
            <div className="space-y-4">
              {DEDUCTION_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label
                    htmlFor={field.key}
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <field.icon className="w-4 h-4 text-destructive" />
                    {field.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {field.hint}
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      £
                    </span>
                    <Input
                      id={field.key}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={deductions[field.key] || ""}
                      onChange={(e) => updateDeduction(field.key, e.target.value)}
                      className="pl-8 h-11 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Total Deductions</span>
              <span className="font-bold text-lg text-destructive tabular-nums">
                −£{totalDeductions.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Calculate button */}
          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              size="lg"
              className="flex-1 rounded-full h-14 text-base gap-2"
            >
              <Calculator className="w-5 h-5" /> Calculate Zakat
            </Button>
            {calculated && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="rounded-full h-14"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-4">
          {/* Result card */}
          {calculated && (
            <div
              className={cn(
                "rounded-3xl p-6 lg:p-8 shadow-lift animate-fade-up",
                isAboveNisab
                  ? "gradient-plum text-primary-foreground"
                  : "bg-secondary/80 text-foreground"
              )}
            >
              <p className="text-xs uppercase tracking-widest font-bold opacity-75">
                Zakat Calculation Result
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Total Assets</span>
                  <span className="font-semibold tabular-nums">
                    £{totalAssets.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Total Deductions</span>
                  <span className="font-semibold tabular-nums">
                    −£{totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-white/20" />
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Zakatable Wealth</span>
                  <span className="font-bold tabular-nums">
                    £{zakatableWealth.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">
                    Nisab ({nisabType === "gold" ? "Gold" : "Silver"})
                  </span>
                  <span className="font-semibold tabular-nums">
                    £{nisabThreshold.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/20">
                {isAboveNisab ? (
                  <>
                    <p className="text-xs uppercase tracking-widest font-bold opacity-75">
                      Your Zakat Due (2.5%)
                    </p>
                    <p className="font-serif text-4xl mt-1 tabular-nums">
                      £{zakatDue.toLocaleString()}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentMode("full")}
                          className={cn(
                            "flex-1 p-3 rounded-xl border-2 text-left text-sm transition-all",
                            paymentMode === "full" ? "border-white bg-white/15" : "border-white/20"
                          )}
                        >
                          <p className="font-semibold">Pay in Full</p>
                          <p className="text-xs opacity-75">£{zakatDue.toLocaleString()}</p>
                        </button>
                        <button
                          onClick={() => setPaymentMode("split")}
                          className={cn(
                            "flex-1 p-3 rounded-xl border-2 text-left text-sm transition-all",
                            paymentMode === "split" ? "border-white bg-white/15" : "border-white/20"
                          )}
                        >
                          <p className="font-semibold flex items-center gap-1"><SplitSquareVertical className="h-3.5 w-3.5" /> Split Payments</p>
                          <p className="text-xs opacity-75">Divide into installments</p>
                        </button>
                      </div>

                      {paymentMode === "split" && (
                        <div className="p-3 rounded-xl bg-white/10 space-y-2">
                          <Label className="text-xs opacity-75">Number of Installments</Label>
                          <div className="flex items-center gap-2">
                            {[2, 3, 4, 6, 12].map((n) => (
                              <button
                                key={n}
                                onClick={() => setSplitCount(n)}
                                className={cn(
                                  "h-9 w-9 rounded-lg text-sm font-medium transition-all",
                                  splitCount === n ? "bg-white text-primary" : "bg-white/10 hover:bg-white/20"
                                )}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs opacity-75">
                            {splitCount} payments of <span className="font-bold">£{splitAmount.toLocaleString()}</span> each
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      size="lg"
                      className="w-full mt-5 rounded-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-base gap-2"
                    >
                      <Link href={paymentMode === "full"
                        ? `/donate?amount=${zakatDue}&type=zakat`
                        : `/donate?amount=${splitAmount}&type=zakat&recurring=monthly&installments=${splitCount}`
                      }>
                        <Heart className="w-5 h-5" />
                        {paymentMode === "full"
                          ? "Pay Your Zakat Now"
                          : `Pay £${splitAmount.toLocaleString()}/month`}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      Your wealth is below the Nisab threshold.
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                      You are not obligated to pay Zakat at this time, but
                      voluntary Sadaqah is always rewarding.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full mt-5 rounded-full h-14 gap-2"
                    >
                      <Link href="/donate?zakat=sadaqah">
                        <Heart className="w-5 h-5" /> Give Sadaqah Instead
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Educational content */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-5">
            <h3 className="font-serif text-lg text-primary">
              Understanding Zakat
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">
                  What is Zakat?
                </p>
                <p>
                  Zakat is the third pillar of Islam. It is a mandatory act of
                  worship requiring Muslims who meet the Nisab threshold to donate
                  2.5% of their qualifying wealth annually to those in need.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Who Must Pay Zakat?
                </p>
                <p>
                  Every adult Muslim whose total zakatable assets (minus
                  liabilities) exceed the Nisab threshold for a full lunar year
                  must pay Zakat.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  What is Nisab?
                </p>
                <p>
                  Nisab is the minimum amount of wealth a Muslim must possess
                  before being obligated to pay Zakat. It is equivalent to the
                  value of 87.48 grams of gold or 612.36 grams of silver.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  When Should I Pay?
                </p>
                <p>
                  Zakat is due once a year on wealth that has been in your
                  possession for one full lunar year (Hawl). Many Muslims choose
                  to pay during Ramadan for the increased reward.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  100% Zakat Policy
                </p>
                <p>
                  We ensure 100% of your Zakat reaches those who need it most.
                  Administrative costs are covered separately through other funds.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/donate?zakat=zakat"
            className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-sm hover:bg-primary/15 transition-colors"
          >
            <span className="font-semibold text-primary flex items-center gap-2">
              <Heart className="w-4 h-4" /> Pay your Zakat with confidence
            </span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        </aside>
      </section>
    </>
  );
}
