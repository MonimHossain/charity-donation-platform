"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";
import Quote from "@/components/home/Quote";
import { calculateZakat } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { fmtMoney } from "@/lib/mock/format";

export default function ZakatPage() {
  const [cashInHand, setCashInHand] = useState(0);
  const [cashInBank, setCashInBank] = useState(0);
  const [goldValue, setGoldValue] = useState(0);
  const [silverValue, setSilverValue] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [personalDebt, setPersonalDebt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    zakatPayable: number;
    netWealth: number;
    isAboveNisab: boolean;
    nisabThreshold: number;
    currency: string;
  } | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const total = Math.max(
          0,
          cashInHand + cashInBank + goldValue + silverValue + investments - personalDebt
        );
        setResult({
          zakatPayable: total * 0.025,
          netWealth: total,
          isAboveNisab: total >= 5000,
          nisabThreshold: 5000,
          currency: "GBP",
        });
        return;
      }
      const data = await calculateZakat({
        cashInHand,
        cashInBank,
        goldValue,
        silverValue,
        investments,
        personalDebt,
        currency: "GBP",
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const donateHref = result?.zakatPayable
    ? `/donate?cause=zakat&amount=${encodeURIComponent(String(result.zakatPayable))}`
    : "/donate?cause=zakat";

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
          <Button asChild size="lg" className="rounded-full bg-accent hover:bg-accent/90">
            <Link href={donateHref}>Donate Zakat Online</Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-accent" />
              <p className="text-sm uppercase tracking-widest font-semibold text-accent-deep">
                Zakat calculator
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Cash in hand", value: cashInHand, set: setCashInHand },
                { label: "Cash in bank", value: cashInBank, set: setCashInBank },
                { label: "Gold value (£)", value: goldValue, set: setGoldValue },
                { label: "Silver value (£)", value: silverValue, set: setSilverValue },
                { label: "Investments", value: investments, set: setInvestments },
                { label: "Debts", value: personalDebt, set: setPersonalDebt },
              ].map((f) => (
                <div key={f.label}>
                  <Label>{f.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1"
                    value={f.value || ""}
                    onChange={(e) => f.set(Number(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="mt-6 w-full rounded-full"
              onClick={handleCalculate}
              disabled={loading}
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
                <p className="font-serif text-4xl mt-1">
                  {fmtMoney(result.zakatPayable, result.currency || "GBP")}
                </p>
                <p className="text-xs mt-2 opacity-70">
                  Net wealth: {fmtMoney(result.netWealth, result.currency || "GBP")}
                  {result.isAboveNisab
                    ? ` · Above nisab (${fmtMoney(result.nisabThreshold, result.currency || "GBP")})`
                    : " · Below nisab threshold — consult a scholar"}
                </p>
                {result.isAboveNisab && result.zakatPayable > 0 && (
                  <Button asChild className="mt-4 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
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
