"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2, RefreshCw } from "lucide-react";
import Quote from "@/components/home/Quote";
import { calculateZakat, fetchZakatMetalPrices } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { statTotalClass } from "@/lib/home-buttons";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type MetalPrices = {
  goldPricePerGram: number;
  silverPricePerGram: number;
  isLive?: boolean;
  source?: string;
  updatedAt?: string;
  goldNisabValue?: number;
  silverNisabValue?: number;
};

const MOCK_METAL_PRICES: MetalPrices = {
  goldPricePerGram: 87,
  silverPricePerGram: 0.95,
  isLive: false,
  source: "fallback",
};

export default function ZakatPage() {
  const { code: currency, formatMoney } = useCurrency();
  const [cashInHand, setCashInHand] = useState(0);
  const [cashInBank, setCashInBank] = useState(0);
  const [goldGrams, setGoldGrams] = useState(0);
  const [silverGrams, setSilverGrams] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [personalDebt, setPersonalDebt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [metalPrices, setMetalPrices] = useState<MetalPrices | null>(null);
  const [result, setResult] = useState<{
    zakatPayable: number;
    netWealth: number;
    isAboveNisab: boolean;
    nisabThreshold: number;
    currency: string;
    metalPrices?: MetalPrices;
  } | null>(null);

  const loadMetalPrices = useCallback(async () => {
    setPricesLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setMetalPrices(MOCK_METAL_PRICES);
        return;
      }
      const data = await fetchZakatMetalPrices(currency);
      setMetalPrices(data);
    } catch {
      setMetalPrices(MOCK_METAL_PRICES);
    } finally {
      setPricesLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadMetalPrices();
  }, [loadMetalPrices]);

  const goldValue = useMemo(() => {
    if (!metalPrices) return 0;
    return Math.round(goldGrams * metalPrices.goldPricePerGram * 100) / 100;
  }, [goldGrams, metalPrices]);

  const silverValue = useMemo(() => {
    if (!metalPrices) return 0;
    return Math.round(silverGrams * metalPrices.silverPricePerGram * 100) / 100;
  }, [silverGrams, metalPrices]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const prices = metalPrices ?? MOCK_METAL_PRICES;
        const total = Math.max(
          0,
          cashInHand + cashInBank + goldValue + silverValue + investments - personalDebt
        );
        const nisab = Math.min(
          prices.goldPricePerGram * 87.48,
          prices.silverPricePerGram * 612.36
        );
        setResult({
          zakatPayable: total >= nisab ? total * 0.025 : 0,
          netWealth: total,
          isAboveNisab: total >= nisab,
          nisabThreshold: nisab,
          currency,
          metalPrices: prices,
        });
        return;
      }
      const data = await calculateZakat({
        cashInHand,
        cashInBank,
        goldGrams,
        silverGrams,
        investments,
        personalDebt,
        currency,
        goldPricePerGram: metalPrices?.goldPricePerGram,
        silverPricePerGram: metalPrices?.silverPricePerGram,
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const donateHref = result?.zakatPayable
    ? `/donate?cause=zakat&amount=${encodeURIComponent(String(result.zakatPayable))}&currency=${currency}`
    : "/donate?cause=zakat";

  const priceUpdatedLabel = metalPrices?.updatedAt
    ? new Date(metalPrices.updatedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <PageShell
      title="Zakat — Your Impact Foundation"
      description="Calculate and give your Zakat with confidence."
    >
      <PageHero
        eyebrow="Zakat"
        title={
          <>
            Give Zakat with <span className="underline-brush">confidence</span>.
          </>
        }
        description="Your Zakat helps poor families, widows, orphans and refugees — distributed transparently."
      />
      <section className="container-wide py-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <h2 className="font-serif text-4xl text-primary">What Zakat supports</h2>
          {[
            { t: "Food, shelter & medical care", d: "For families struggling to survive each day." },
            { t: "Children's education & clothing", d: "Sponsorship that brings dignity and stability." },
            { t: "Skills & livelihood projects", d: "Long-term relief that breaks the cycle of poverty." },
          ].map((p) => (
            <div key={p.t} className="p-6 rounded-2xl bg-secondary border border-border">
              <h3 className="font-serif text-xl text-primary">{p.t}</h3>
              <p className="text-muted-foreground mt-1">{p.d}</p>
            </div>
          ))}
          <Button asChild size="lg" className="rounded-full bg-accent hover:bg-primary hover:text-primary-foreground">
            <Link href={donateHref}>Donate Zakat Online</Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-soft">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-accent" />
                <p className="text-sm uppercase tracking-widest font-semibold text-accent-deep">
                  Zakat calculator
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full gap-1.5 text-xs"
                onClick={loadMetalPrices}
                disabled={pricesLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", pricesLoading && "animate-spin")} />
                Refresh prices
              </Button>
            </div>

            {/* Live metal prices */}
            <div className="mb-6 rounded-2xl border border-accent/25 bg-accent/5 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    metalPrices?.isLive
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {pricesLoading ? "Loading…" : metalPrices?.isLive ? "Live rates" : "Estimated rates"}
                </span>
                {priceUpdatedLabel && (
                  <span className="text-[11px] text-muted-foreground">Updated {priceUpdatedLabel}</span>
                )}
              </div>
              {metalPrices && (
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Gold (24k): </span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(metalPrices.goldPricePerGram, { from: currency, code: currency })}/g
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Silver: </span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(metalPrices.silverPricePerGram, { from: currency, code: currency })}/g
                    </span>
                  </p>
                </div>
              )}
              {!metalPrices?.isLive && !pricesLoading && (
                <p className="text-[11px] text-muted-foreground">
                  Add <code className="text-xs">GOLD_API_KEY</code> on the server for live spot prices (free at goldapi.io).
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Cash in hand", value: cashInHand, set: setCashInHand },
                { label: "Cash in bank", value: cashInBank, set: setCashInBank },
                { label: "Investments", value: investments, set: setInvestments },
                { label: "Debts (deduct)", value: personalDebt, set: setPersonalDebt },
              ].map((f) => (
                <div key={f.label}>
                  <Label>{f.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="mt-1"
                    value={f.value || ""}
                    onChange={(e) => f.set(Number(e.target.value) || 0)}
                  />
                </div>
              ))}

              <div>
                <Label>Gold weight (grams, 24k)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1"
                  value={goldGrams || ""}
                  onChange={(e) => setGoldGrams(Number(e.target.value) || 0)}
                  placeholder="e.g. 50"
                />
                {goldGrams > 0 && metalPrices && (
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    ≈ {formatMoney(goldValue, { from: currency, code: currency })}
                  </p>
                )}
              </div>
              <div>
                <Label>Silver weight (grams)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1"
                  value={silverGrams || ""}
                  onChange={(e) => setSilverGrams(Number(e.target.value) || 0)}
                  placeholder="e.g. 200"
                />
                {silverGrams > 0 && metalPrices && (
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    ≈ {formatMoney(silverValue, { from: currency, code: currency })}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              className="mt-6 w-full rounded-full"
              onClick={handleCalculate}
              disabled={loading || pricesLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating…
                </>
              ) : (
                "Calculate Zakat"
              )}
            </Button>
            {result && (
              <div className="mt-8 p-6 rounded-2xl bg-primary text-primary-foreground">
                <p className="text-sm opacity-80">Zakat due (2.5%)</p>
                <p className={`${statTotalClass} mt-1`}>
                  {formatMoney(result.zakatPayable, { from: result.currency || currency, code: currency })}
                </p>
                <p className="text-xs mt-2 opacity-70">
                  Net wealth:{" "}
                  {formatMoney(result.netWealth, { from: result.currency || currency, code: currency })}
                  {result.isAboveNisab
                    ? ` · Above nisab (${formatMoney(result.nisabThreshold, { from: result.currency || currency, code: currency })})`
                    : " · Below nisab threshold — consult a scholar"}
                </p>
                {result.metalPrices && (
                  <p className="text-[11px] mt-2 opacity-60">
                    Nisab (silver):{" "}
                    {formatMoney(result.metalPrices.silverNisabValue ?? 0, {
                      from: result.currency || currency,
                      code: currency,
                    })}{" "}
                    · Gold nisab:{" "}
                    {formatMoney(result.metalPrices.goldNisabValue ?? 0, {
                      from: result.currency || currency,
                      code: currency,
                    })}
                  </p>
                )}
                {result.isAboveNisab && result.zakatPayable > 0 && (
                  <Button asChild className="mt-4 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground">
                    <Link href={donateHref}>Pay your Zakat now</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <Quote />
    </PageShell>
  );
}
