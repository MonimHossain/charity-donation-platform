"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateZakat, fetchZakatMetalPrices } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { statTotalClass } from "@/lib/home-buttons";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  buildZakatDonateHref,
  zakatInstallmentAmount,
  zakatInstallmentPlanLabel,
  ZAKAT_INSTALLMENT_MONTHS,
  type ZakatInstallmentMonths,
} from "@/lib/zakat-installments";

export type NisabBasis = "gold" | "silver";

type MetalPrices = {
  goldPricePerGram: number;
  silverPricePerGram: number;
  isLive?: boolean;
  source?: string;
  updatedAt?: string;
  goldNisabValue?: number;
  silverNisabValue?: number;
  nisabGoldGrams?: number;
  nisabSilverGrams?: number;
};

type ZakatResult = {
  zakatPayable: number;
  netWealth: number;
  isAboveNisab: boolean;
  nisabThreshold: number;
  nisabBasis?: NisabBasis;
  currency: string;
  metalPrices?: MetalPrices;
};

const MOCK_METAL_PRICES: MetalPrices = {
  goldPricePerGram: 87,
  silverPricePerGram: 0.95,
  isLive: false,
  source: "fallback",
  goldNisabValue: 87 * 87.48,
  silverNisabValue: 0.95 * 612.36,
  nisabGoldGrams: 87.48,
  nisabSilverGrams: 612.36,
};

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step="0.01"
        className="mt-1"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1 tabular-nums">{hint}</p>}
    </div>
  );
}

export default function ZakatCalculator() {
  const { code: currency, formatMoney } = useCurrency();
  const [nisabBasis, setNisabBasis] = useState<NisabBasis>("silver");
  const [cashInHand, setCashInHand] = useState(0);
  const [cashInBank, setCashInBank] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [otherAssets, setOtherAssets] = useState(0);
  const [businessStock, setBusinessStock] = useState(0);
  const [personalDebt, setPersonalDebt] = useState(0);
  const [otherLiabilities, setOtherLiabilities] = useState(0);
  const [goldGrams, setGoldGrams] = useState(0);
  const [silverGrams, setSilverGrams] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [metalPrices, setMetalPrices] = useState<MetalPrices | null>(null);
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<ZakatInstallmentMonths>(1);

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

  const payload = useMemo(
    () => ({
      cashInHand,
      cashInBank,
      investments,
      receivables,
      otherAssets,
      businessStock,
      personalDebt,
      otherLiabilities,
      goldGrams,
      silverGrams,
      currency,
      nisabBasis,
      goldPricePerGram: metalPrices?.goldPricePerGram,
      silverPricePerGram: metalPrices?.silverPricePerGram,
    }),
    [
      cashInHand,
      cashInBank,
      investments,
      receivables,
      otherAssets,
      businessStock,
      personalDebt,
      otherLiabilities,
      goldGrams,
      silverGrams,
      currency,
      nisabBasis,
      metalPrices,
    ]
  );

  const handleCalculate = async () => {
    setPaymentPlan(1);
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const prices = metalPrices ?? MOCK_METAL_PRICES;
        const totalAssets =
          cashInHand +
          cashInBank +
          goldValue +
          silverValue +
          investments +
          receivables +
          otherAssets +
          businessStock;
        const totalLiabilities = personalDebt + otherLiabilities;
        const netWealth = Math.max(0, totalAssets - totalLiabilities);
        const goldNisab = prices.goldPricePerGram * NISAB_GOLD_GRAMS;
        const silverNisab = prices.silverPricePerGram * NISAB_SILVER_GRAMS;
        const nisab = nisabBasis === "gold" ? goldNisab : silverNisab;
        setResult({
          zakatPayable: netWealth >= nisab ? Math.round(netWealth * 0.025 * 100) / 100 : 0,
          netWealth,
          isAboveNisab: netWealth >= nisab,
          nisabThreshold: nisab,
          nisabBasis,
          currency,
          metalPrices: {
            ...prices,
            goldNisabValue: goldNisab,
            silverNisabValue: silverNisab,
          },
        });
        return;
      }
      const data = await calculateZakat(payload);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const zakatTotal = result?.zakatPayable ?? 0;
  const installmentAmount = zakatInstallmentAmount(zakatTotal, paymentPlan);
  const installmentTotal = installmentAmount * paymentPlan;

  const donateHref =
    result?.zakatPayable && result.zakatPayable > 0
      ? buildZakatDonateHref({
          totalDue: result.zakatPayable,
          currency,
          months: paymentPlan,
        })
      : "/donate?cause=zakat";

  const priceUpdatedLabel = metalPrices?.updatedAt
    ? new Date(metalPrices.updatedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const activeNisab =
    nisabBasis === "gold" ? metalPrices?.goldNisabValue : metalPrices?.silverNisabValue;

  return (
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

      <div className="mb-6 rounded-2xl border border-accent/25 bg-accent/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              metalPrices?.isLive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
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
            <p>
              <span className="text-muted-foreground">Gold nisab (87.48g): </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(metalPrices.goldNisabValue ?? 0, { from: currency, code: currency })}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Silver nisab (612.36g): </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(metalPrices.silverNisabValue ?? 0, { from: currency, code: currency })}
              </span>
            </p>
          </div>
        )}
        <div>
          <Label htmlFor="nisab-basis" className="text-xs">
            Nisab basis
          </Label>
          <select
            id="nisab-basis"
            value={nisabBasis}
            onChange={(e) => setNisabBasis(e.target.value as NisabBasis)}
            className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="silver">Silver nisab (612.36g)</option>
            <option value="gold">Gold nisab (87.48g)</option>
          </select>
          {activeNisab != null && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Using{" "}
              {formatMoney(activeNisab, { from: currency, code: currency })} as your nisab threshold.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Gold &amp; silver
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField
              label="Gold weight (grams, 24k)"
              value={goldGrams}
              onChange={setGoldGrams}
              hint={
                goldGrams > 0 && metalPrices
                  ? `≈ ${formatMoney(goldValue, { from: currency, code: currency })}`
                  : undefined
              }
            />
            <NumberField
              label="Silver weight (grams)"
              value={silverGrams}
              onChange={setSilverGrams}
              hint={
                silverGrams > 0 && metalPrices
                  ? `≈ ${formatMoney(silverValue, { from: currency, code: currency })}`
                  : undefined
              }
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Cash &amp; assets
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="Cash in hand" value={cashInHand} onChange={setCashInHand} />
            <NumberField label="Cash in bank" value={cashInBank} onChange={setCashInBank} />
            <NumberField
              label="Savings / deposits for future"
              value={investments}
              onChange={setInvestments}
            />
            <NumberField label="Money lent out (loans given)" value={receivables} onChange={setReceivables} />
            <NumberField
              label="Shares, pensions & investments"
              value={otherAssets}
              onChange={setOtherAssets}
            />
            <NumberField label="Value of stock (trade goods)" value={businessStock} onChange={setBusinessStock} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Liabilities (deduct)
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="Borrowed money" value={personalDebt} onChange={setPersonalDebt} />
            <NumberField
              label="Bills / tax / rent due immediately"
              value={otherLiabilities}
              onChange={setOtherLiabilities}
            />
          </div>
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
              ? ` · Above ${result.nisabBasis ?? nisabBasis} nisab (${formatMoney(result.nisabThreshold, { from: result.currency || currency, code: currency })})`
              : " · Below nisab threshold — consult a scholar"}
          </p>
          {result.isAboveNisab && result.zakatPayable > 0 && (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  How would you like to pay?
                </p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ZAKAT_INSTALLMENT_MONTHS.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setPaymentPlan(months)}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all border",
                        paymentPlan === months
                          ? "bg-accent text-accent-foreground border-accent"
                          : "border-white/25 bg-white/10 hover:bg-white/15"
                      )}
                    >
                      {zakatInstallmentPlanLabel(months)}
                    </button>
                  ))}
                </div>
              </div>

              {paymentPlan > 1 ? (
                <p className="text-sm opacity-90">
                  Pay{" "}
                  <span className="font-bold">
                    {formatMoney(installmentAmount, {
                      from: result.currency || currency,
                      code: currency,
                    })}
                  </span>{" "}
                  per month for {paymentPlan} months
                  {installmentTotal > zakatTotal && (
                    <span className="block text-xs opacity-75 mt-1">
                      ({formatMoney(installmentTotal, {
                        from: result.currency || currency,
                        code: currency,
                      })}{" "}
                      total — rounded up per instalment)
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm opacity-90">
                  Pay the full amount in one payment today.
                </p>
              )}

              <Button
                asChild
                className="w-full rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Link href={donateHref}>
                  {paymentPlan > 1
                    ? `Start ${paymentPlan}-month plan`
                    : "Pay your Zakat now"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
