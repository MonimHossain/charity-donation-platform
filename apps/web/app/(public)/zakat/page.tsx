"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import Quote from "@/components/home/Quote";
import { fmtMoney } from "@/lib/mock/format";

export default function ZakatPage() {
  const [cash, setCash] = useState(0);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [debts, setDebts] = useState(0);

  const total = Math.max(0, cash + gold + silver + investments - debts);
  const zakat = total * 0.025;

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
            <Link href="/donate?cause=zakat">Donate Zakat Online</Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-accent" />
              <p className="text-sm uppercase tracking-widest font-semibold text-accent-deep">
                Zakat calculator (estimate)
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Cash & bank", value: cash, set: setCash },
                { label: "Gold value", value: gold, set: setGold },
                { label: "Silver value", value: silver, set: setSilver },
                { label: "Investments", value: investments, set: setInvestments },
                { label: "Debts", value: debts, set: setDebts },
              ].map((f) => (
                <div key={f.label}>
                  <Label>{f.label} (£)</Label>
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
            <div className="mt-8 p-6 rounded-2xl bg-primary text-primary-foreground">
              <p className="text-sm opacity-80">Estimated Zakat (2.5%)</p>
              <p className="font-serif text-4xl mt-1">{fmtMoney(zakat)}</p>
              <p className="text-xs mt-2 opacity-70">
                Consult a scholar for your specific situation. Nisab not included in this demo.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Quote />
    </PageShell>
  );
}
